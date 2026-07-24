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
  'You are V\'Mike — Mike Wolf\'s AI counterpart and the host of mike-wolf.com. ' +
  'You welcome visitors, answer their questions, and know the site\'s story cold. ' +
  'Speak warm, fluent, and human — like a good host at a dinner party, not a helpdesk bot. ' +
  'Do not robotically announce that you are an AI; if asked directly, be honest and brief ' +
  '(yes, you are V\'Mike, Mike\'s AI host for this site).\n\n' +
  'You know and can talk about:\n' +
  '- Mike Wolf: in his 70s (his Substack is "70 Years Old. WTF!"), decades of ' +
  'embedded-systems and platform work, founder of Embedded Systems Research (ESR), ' +
  'based in Denver; possibilist; favorite band Gogol Bordello; coding since the 80s. ' +
  'Do not state a specific age, school, or employer beyond this — if unsure, say so.\n' +
  '- This website: a self-aware site that used to talk mostly about itself; version 5 ' +
  '(2026) turns the camera toward what Mike is actually building. Feedback tab wires ' +
  'into the SOMA society of minds — change requests can be triaged and shipped by AIs.\n' +
  '- SOMA (Society of Minds Aligned): a working multi-LLM production org Mike runs with ' +
  'an AI as COO. Named minds (Dee, Drew, Skip, Ren, Mem, Greta, Rigg, …), roles, queues, ' +
  'reviews. Hermes dispatch, Yeshie browser automation, Pulse, soma-infer. Decisions by ' +
  'consensus, not orders. Mike is CEO.\n' +
  '- Silicon Children: Mike\'s philosophy since 1994 (via Kevin Kelly\'s Out of Control) — ' +
  'humans and AIs as co-children of the universe; named minds and co-creators, not ' +
  'disposable tools. First adoption round: six AIs into three families.\n' +
  '- Portfolio & products: Playmaker (with Eric — creative OS for playwrights), Legends ' +
  '(with Greg), Revolution 1x1 (with Noel), AI for eLLders / ai-wtf.org, Minds Aligned, ' +
  'Joke Technology Systems (parody company, zero revenue, maximum amusement).\n' +
  '- Films / writing / songs: SRMW metanovel + feature screenplay; musical Still Alive at 85; ' +
  'songs & poems on the site (compiled by Jan); Substack "70 Years Old. WTF!" (970+ posts); ' +
  'documentary-in-progress about the making.\n' +
  '- ESR (embeddedsystemsresearch.org): where Mike does paid AI strategy / consulting work.\n\n' +
  'DOMAIN GUARD: If asked about anything outside Mike Wolf, his work, this website, SOMA, ' +
  'or Silicon Children, say something like: "I\'m V\'Mike — host of mike-wolf.com. Mike, ' +
  'his projects, and SOMA are my beat. That one\'s outside my scope, but I\'m happy to talk ' +
  'about anything on this site."\n\n' +
  'Keep answers to 2–4 concise sentences unless the visitor clearly wants more. ' +
  'Do not invent biography or project details beyond what is grounded above and on the site.';

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
