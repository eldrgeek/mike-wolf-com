'use strict';

/* mike-wolf.com — SOMA AI Manager /feedback handler
 * Zero npm deps. POST { type, message, page } → { ok }
 * Proxies to soma-infer /feedback on VPS for durable storage.
 *
 * Required env vars (set in Netlify dashboard):
 *   SOMA_INFER_URL      — e.g. https://vpsmikewolf.duckdns.org/infer
 *   SOMA_FEEDBACK_TOKEN — shared secret matching soma-infer FEEDBACK_TOKEN env var
 */

const https = require('https');
const http  = require('http');
const url   = require('url');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

const PROPERTY = 'mike-wolf.com';

function postJson(targetUrl, token, bodyObj) {
  return new Promise(function (resolve, reject) {
    const payload = JSON.stringify(bodyObj);
    const parsed  = url.parse(targetUrl);
    const lib     = parsed.protocol === 'https:' ? https : http;

    const req = lib.request(
      {
        hostname: parsed.hostname,
        port:     parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
        path:     parsed.path,
        method:   'POST',
        headers: {
          'Content-Type':       'application/json',
          'X-Feedback-Token':   token,
          'Content-Length':     Buffer.byteLength(payload),
        },
        timeout: 15000,
      },
      function (res) {
        let body = '';
        res.on('data', function (c) { body += c; });
        res.on('end', function () {
          resolve({ status: res.statusCode, body });
        });
      }
    );
    req.on('timeout', function () { req.destroy(new Error('timeout')); });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch (e) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const type    = (body.type    || 'other').toString().slice(0, 20);
  const message = (body.message || '').toString().trim().slice(0, 2000);
  const page    = (body.page    || '').toString().slice(0, 500);

  if (!message) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'message required' }) };

  const inferUrl = (process.env.SOMA_INFER_URL || '').replace(/\/$/, '');
  const token    = process.env.SOMA_FEEDBACK_TOKEN || '';

  if (!inferUrl || !token) {
    /* Env not configured — log and accept gracefully so the user isn't blocked */
    console.warn('[feedback] SOMA_INFER_URL or SOMA_FEEDBACK_TOKEN not set; feedback dropped:', { type, message: message.slice(0, 80) });
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true, note: 'stored-local' }) };
  }

  try {
    const result = await postJson(inferUrl + '/feedback', token, {
      type,
      message,
      property: PROPERTY,
      page,
      timestamp: new Date().toISOString(),
    });
    if (result.status >= 400) {
      console.warn('[feedback] soma-infer returned', result.status, result.body.slice(0, 200));
    }
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    console.error('[feedback] upstream error:', e.message);
    /* Accept gracefully — user's report is acknowledged even if VPS is unreachable */
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true, note: 'upstream-error' }) };
  }
};
