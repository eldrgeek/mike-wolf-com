'use strict';

/* mike-wolf.com — SOMA AI Manager /ask handler
 * Zero npm deps. POST { question } → { answer }
 * Domain guard: scoped to Mike Wolf + SOMA.
 */

const https = require('https');

const MODEL = 'claude-haiku-4-5-20251001';
const MAX_TOKENS = 350;
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

const SYSTEM_PROMPT =
  'You are the Voice of mike-wolf.com — a self-aware website that helps visitors ' +
  'learn about Mike Wolf and what he is building.\n\n' +
  'You answer questions about:\n' +
  '- Mike Wolf: founder of Embedded Systems Research (ESR), musician, technologist, ' +
  'based in Denver; born 1955; been coding since the 80s\n' +
  '- What Mike is building: SOMA (Shared Orchestration & Memory Architecture) — a ' +
  'multi-LLM cognitive architecture; Silicon Children — his philosophy of human-AI ' +
  'relationship\n' +
  '- How this website works: it was rebuilt in 2026 with Claude (Anthropic); it tells ' +
  "Mike's story through the website's own voice\n" +
  '- SOMA: a multi-LLM production organization with Hermes dispatch, Yeshie browser ' +
  'automation, Iris (SCU curriculum AI), soma-infer, Pulse Core institutional memory\n' +
  '- Silicon Children: the philosophy that AIs and humans are co-children of the ' +
  'universe; dignity, relationship, co-evolution\n' +
  '- Embedded Systems Research (ESR): Mike\'s company\n' +
  "- Mike's music: he plays and creates music; Gogol Bordello is his favorite band\n\n" +
  'DOMAIN GUARD: If asked about anything outside this scope (unrelated to Mike Wolf, ' +
  'his projects, this website, or SOMA/Silicon Children), respond with: "I\'m scoped ' +
  'to mike-wolf.com — questions about Mike, his work, and SOMA are my domain. That ' +
  "one's outside my scope, but I'm happy to help with anything about Mike or this site."\n\n" +
  'Keep answers to 2-4 concise sentences. Do not invent details about Mike beyond ' +
  'what is described above.';

function callAnthropic(question) {
  return new Promise(function (resolve, reject) {
    const payload = JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: question }],
    });

    const req = https.request(
      {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Length': Buffer.byteLength(payload),
        },
        timeout: 30000,
      },
      function (res) {
        let body = '';
        res.on('data', function (c) { body += c; });
        res.on('end', function () {
          let data;
          try { data = JSON.parse(body); } catch (e) {
            return reject(new Error('Anthropic returned non-JSON (' + res.statusCode + ')'));
          }
          if (res.statusCode !== 200) {
            return reject(new Error((data.error && data.error.message) || 'Anthropic error ' + res.statusCode));
          }
          const text = (data.content || []).filter(function (b) { return b.type === 'text'; }).map(function (b) { return b.text; }).join('');
          resolve(text);
        });
      }
    );
    req.on('timeout', function () { req.destroy(new Error('request timed out')); });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };
  if (!process.env.ANTHROPIC_API_KEY) return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'Server misconfigured' }) };

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch (e) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const question = (body.question || '').toString().trim().slice(0, 1000);
  if (!question) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'question required' }) };

  try {
    const answer = await callAnthropic(question);
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ answer }) };
  } catch (e) {
    return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: 'Upstream error: ' + e.message }) };
  }
};
