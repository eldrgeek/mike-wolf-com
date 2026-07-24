'use strict';

/* mike-wolf.com — newsletter / special-content signup
 * Zero npm deps. POST { email } → { ok } | { ok, already: true }
 * Inserts into shared SOMA Auth Supabase `subscribers` table; dedupes on email.
 *
 * Required env vars (set in Netlify dashboard — never hardcode):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

const https = require('https');
const url   = require('url');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function supabaseRequest(method, path, bodyObj) {
  return new Promise(function (resolve, reject) {
    const base = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
    const key  = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    if (!base || !key) {
      return reject(new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set'));
    }

    const payload = bodyObj != null ? JSON.stringify(bodyObj) : null;
    const parsed  = url.parse(base + path);
    const headers = {
      'apikey': key,
      'Authorization': 'Bearer ' + key,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    };
    if (payload) headers['Content-Length'] = Buffer.byteLength(payload);

    const req = https.request(
      {
        hostname: parsed.hostname,
        port:     parsed.port || 443,
        path:     parsed.path,
        method:   method,
        headers:  headers,
        timeout:  15000,
      },
      function (res) {
        let body = '';
        res.on('data', function (c) { body += c; });
        res.on('end', function () {
          resolve({ status: res.statusCode, body: body });
        });
      }
    );
    req.on('timeout', function () { req.destroy(new Error('timeout')); });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const email = (body.email || '').toString().trim().toLowerCase().slice(0, 320);
  if (!email || !EMAIL_RE.test(email)) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Valid email required' }) };
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[subscribe] missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'Server misconfigured' }) };
  }

  try {
    /* Dedupe: look up existing row by email */
    const lookup = await supabaseRequest(
      'GET',
      '/rest/v1/subscribers?email=eq.' + encodeURIComponent(email) + '&select=email&limit=1'
    );
    if (lookup.status >= 200 && lookup.status < 300) {
      let rows = [];
      try { rows = JSON.parse(lookup.body || '[]'); } catch (e) { rows = []; }
      if (Array.isArray(rows) && rows.length > 0) {
        return {
          statusCode: 200,
          headers: CORS,
          body: JSON.stringify({ ok: true, already: true }),
        };
      }
    }

    const insert = await supabaseRequest('POST', '/rest/v1/subscribers', {
      email: email,
    });

    /* Unique violation (duplicate race) → treat as already subscribed */
    if (insert.status === 409) {
      return {
        statusCode: 200,
        headers: CORS,
        body: JSON.stringify({ ok: true, already: true }),
      };
    }

    if (insert.status < 200 || insert.status >= 300) {
      console.error('[subscribe] insert failed', insert.status, (insert.body || '').slice(0, 300));
      /* PostgREST sometimes returns 23505 unique_violation in body with 4xx */
      if ((insert.body || '').indexOf('23505') !== -1 || (insert.body || '').toLowerCase().indexOf('duplicate') !== -1) {
        return {
          statusCode: 200,
          headers: CORS,
          body: JSON.stringify({ ok: true, already: true }),
        };
      }
      return {
        statusCode: 502,
        headers: CORS,
        body: JSON.stringify({ error: 'Could not save subscription' }),
      };
    }

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ ok: true }),
    };
  } catch (e) {
    console.error('[subscribe] error:', e.message);
    return {
      statusCode: 502,
      headers: CORS,
      body: JSON.stringify({ error: 'Upstream error' }),
    };
  }
};
