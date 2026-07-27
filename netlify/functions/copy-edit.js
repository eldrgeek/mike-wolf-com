'use strict';

/* mike-wolf.com — "Lock this down" lands here.
 *
 * soma-edit.js POSTs one of these per changed block:
 *   { type:'content-edit', siteId, key, hint, oldHTML, newHTML, page, message }
 *
 * Why this is not netlify/functions/feedback.js, which SOMA-APP-STANDARD §17
 * nominally points at — a stated deviation, not an oversight:
 *
 *   1. feedback.js forwards only { type, message, property, page, timestamp }.
 *      key / oldHTML / newHTML are dropped, so what reached the far end was a
 *      200-char prose summary — enough to know Mike changed something, not
 *      enough to apply it. The whole value of an in-place edit is that the diff
 *      survives the trip.
 *   2. It proxies to soma-infer on the VPS, which is unreachable (443 and 22
 *      both refused, 2026-07-27).
 *   3. It returns {ok:true} on upstream failure by design ("accept gracefully").
 *      Combined with 2, "Lock this down" reported *Filed 1 edit to ship* while
 *      the edit went nowhere — the exact silent success §9/§10 forbids.
 *
 * So: a dedicated store (public.site_copy_edits in the shared SOMA Auth project),
 * the full diff, no VPS in the path, and an honest status code. If the write
 * fails this returns 502 and soma-edit falls back to its localStorage draft with
 * a visible "failed to file" toast.
 *
 * The publishable key below is public by design (it is the same key the page
 * ships for sign-in) and the table is write-only to it: RLS grants INSERT and
 * grants no SELECT/UPDATE/DELETE at all. See supabase/site_copy_edits.sql.
 */

const SUPABASE_URL  = process.env.SUPABASE_URL || 'https://omfwcodoimjmbrhssvfl.supabase.co';
const PUBLISHABLE   = process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_vi2qDWjozUJ5mi9dwirkLA_rj6UaqLf';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

const MAX_HTML = 20000;   /* matches the RLS check — reject here with a readable
                             message rather than letting Postgres bounce it */
const MAX_KEY  = 500;

const clip = (v, n) => (v == null ? '' : String(v)).slice(0, n);

function json(statusCode, obj) {
  return { statusCode, headers: CORS, body: JSON.stringify(obj) };
}

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch (_) { return json(400, { error: 'Invalid JSON' }); }

  const newHTML = clip(body.newHTML, MAX_HTML);
  const elKey   = clip(body.key, MAX_KEY);

  /* An edit with no locator can't be applied to source, so refusing it is
   * kinder than storing something nobody can act on. */
  if (!elKey)   return json(400, { error: 'key required' });
  if (!newHTML) return json(400, { error: 'newHTML required' });

  const row = {
    site_id:  clip(body.siteId, 120) || 'mike-wolf-com',
    page:     clip(body.page, 500),
    el_key:   elKey,
    hint:     clip(body.hint, 300),
    old_html: clip(body.oldHTML, MAX_HTML),
    new_html: newHTML,
    source:   'soma-edit',
    status:   'pending',
  };

  let res, text;
  try {
    res = await fetch(SUPABASE_URL + '/rest/v1/site_copy_edits', {
      method: 'POST',
      headers: {
        'apikey': PUBLISHABLE,
        'Authorization': 'Bearer ' + PUBLISHABLE,
        'Content-Type': 'application/json',
        /* No `Prefer: return=representation`. That makes PostgREST do an
         * INSERT ... RETURNING, which needs the new row to be visible under a
         * SELECT policy — and this table deliberately has none. The write-only
         * guarantee is strict enough that the writer can't read its own row
         * back, so asking for one turns every insert into an RLS violation
         * (42501, served as 401). Cost the first live edit; worth the property. */
      },
      body: JSON.stringify(row),
    });
    text = await res.text();
  } catch (e) {
    console.error('[copy-edit] store unreachable:', e.message);
    return json(502, { error: 'store unreachable', detail: e.message });
  }

  if (!res.ok) {
    console.error('[copy-edit] store rejected', res.status, text.slice(0, 300));
    return json(502, { error: 'store rejected the edit', status: res.status });
  }

  return json(200, { ok: true });
};
