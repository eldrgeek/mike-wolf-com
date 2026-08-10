/* copy-canonize — SOMA §17 Tier 1 publish for mike-wolf.com.
 *
 * Sibling of mike-wolf-library/netlify/functions/copy-canonize.mjs. The client
 * engine (js/live-edit.js) is byte-identical between the two sites; this file
 * is the half that is genuinely per-site, because only the site knows which
 * file on disk holds a given sentence.
 *
 * mike-wolf.com is plain static HTML, so this is the EASY case: the page IS
 * the source. One layer, one file, one literal string swap, one commit —
 * GitHub, then Netlify auto-deploy from master, then a logged-out visitor
 * reads the new words out of the same HTML file an admin edited. No override
 * is ever served at runtime and no database is on the read path.
 *
 * (The Library needed two layers because its dictionary is generated from
 * upstream sources; see that file's header. Nothing here is generated.)
 *
 * NOT WIRED HERE, on purpose: portfolio.html and /agi/ still run the older
 * soma-edit.js from soma-guide, which is DOM-selector-keyed and files into
 * site_copy_edits. Two editors on one page would fight over the same nodes.
 * The standard's adoption policy is explicit that §17 is not a retrofit sweep
 * — those pages adopt this on their next substantial rebuild.
 */

const APP = 'mike-wolf-com';
const SUPABASE_URL = 'https://omfwcodoimjmbrhssvfl.supabase.co';
const ANON_KEY = 'sb_publishable_vi2qDWjozUJ5mi9dwirkLA_rj6UaqLf';
const REPO = process.env.GITHUB_REPO || 'eldrgeek/mike-wolf-com';
const BRANCH = process.env.GITHUB_BRANCH || 'master';
const GH = 'https://api.github.com';

// route -> the file that actually holds the words. Tried first; if the string
// isn't there we fall back to the full list, because a route can be wrong
// (someone edits on a URL that a redirect served) but the string cannot.
const ROUTE_FILES = {
  '/': 'index.html',
  '/songs': 'songs.html',
  '/songs/': 'songs.html',
};
const ALL_FILES = ['index.html', 'songs.html'];

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

/* Whitespace-flexible literal match: the DOM collapses runs of whitespace and
 * the HTML source wraps sentences across lines. Exact-byte matching would fail
 * on every wrapped paragraph, which is most of them. */
function flexible(literal) {
  const escaped = literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(escaped.replace(/\s+/g, '\\s+'), 'g');
}

function patch(text, originalText, newText, occurrence) {
  const hits = [...text.matchAll(flexible(originalText))];
  if (hits.length === 0) {
    // Idempotent: already saying the new thing is "done", not "failed".
    const already = [...text.matchAll(flexible(newText))].length > 0;
    return { changed: false, text, reason: already ? 'already-applied' : 'no-match' };
  }
  let hit;
  if (hits.length === 1) hit = hits[0];
  else if (occurrence < hits.length) hit = hits[occurrence];
  else return { changed: false, text, reason: `ambiguous:${hits.length}-matches` };
  return { changed: true, text: text.slice(0, hit.index) + newText + text.slice(hit.index + hit[0].length) };
}

async function gh(token, path, init = {}) {
  const res = await fetch(GH + path, {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      accept: 'application/vnd.github+json',
      'user-agent': 'soma-live-edit',
      ...(init.headers || {}),
    },
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`github ${init.method || 'GET'} ${path} -> ${res.status} ${body.slice(0, 200)}`);
  return body ? JSON.parse(body) : null;
}

async function readFile(token, path) {
  try {
    const r = await gh(token, `/repos/${REPO}/contents/${encodeURI(path)}?ref=${BRANCH}`);
    return Buffer.from(r.content, 'base64').toString('utf8');
  } catch (e) {
    if (String(e.message).includes('-> 404')) return null;
    throw e;
  }
}

export default async (req) => {
  if (req.method !== 'POST') return json(405, { ok: false, error: 'POST only' });

  const jwt = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
  if (!jwt) return json(401, { ok: false, error: 'no bearer token' });

  let body;
  try { body = await req.json(); } catch { return json(400, { ok: false, error: 'bad json' }); }
  if (!body?.id) return json(400, { ok: false, error: 'missing id' });

  const sb = (path, init = {}) =>
    fetch(`${SUPABASE_URL}${path}`, {
      ...init,
      headers: {
        apikey: ANON_KEY, authorization: `Bearer ${jwt}`,
        'content-type': 'application/json', ...(init.headers || {}),
      },
    });

  // Admin gate: ask the DB the same question RLS asks. No email allow-list.
  const adminRes = await sb('/rest/v1/rpc/is_app_admin', {
    method: 'POST', body: JSON.stringify({ target_app: APP }),
  });
  if (!(adminRes.ok && (await adminRes.json()) === true)) {
    return json(403, { ok: false, error: 'not an admin for ' + APP });
  }

  const rowRes = await sb(`/rest/v1/copy_overrides?id=eq.${encodeURIComponent(body.id)}&select=*`);
  const row = (rowRes.ok ? await rowRes.json() : [])[0];
  if (!row) return json(404, { ok: false, error: 'row not found' });
  if (row.app !== APP) return json(400, { ok: false, error: 'wrong app' });
  // §17a R4 — retired is never promotable.
  if (row.status === 'retired') return json(409, { ok: false, error: 'retired rows are not promotable' });

  const token = process.env.GITHUB_TOKEN;
  if (!token) return json(500, { ok: false, error: 'GITHUB_TOKEN not configured' });

  const preferred = ROUTE_FILES[row.route];
  const candidates = preferred ? [preferred, ...ALL_FILES.filter((f) => f !== preferred)] : ALL_FILES;

  const changes = [];
  const skipped = [];
  for (const path of candidates) {
    const text = await readFile(token, path);
    if (text === null) { skipped.push(`${path}:absent`); continue; }
    const r = patch(text, row.original_text, row.new_text, row.occurrence || 0);
    if (!r.changed) { skipped.push(`${path}:${r.reason}`); continue; }
    changes.push({ path, content: r.text });
    break;   // the string lives in exactly one page; stop at the first hit
  }

  let sha = null;
  if (changes.length) {
    const ref = await gh(token, `/repos/${REPO}/git/ref/heads/${BRANCH}`);
    const baseSha = ref.object.sha;
    const baseCommit = await gh(token, `/repos/${REPO}/git/commits/${baseSha}`);
    const tree = [];
    for (const c of changes) {
      const blob = await gh(token, `/repos/${REPO}/git/blobs`, {
        method: 'POST', body: JSON.stringify({ content: c.content, encoding: 'utf-8' }),
      });
      tree.push({ path: c.path, mode: '100644', type: 'blob', sha: blob.sha });
    }
    const newTree = await gh(token, `/repos/${REPO}/git/trees`, {
      method: 'POST', body: JSON.stringify({ base_tree: baseCommit.tree.sha, tree }),
    });
    const commit = await gh(token, `/repos/${REPO}/git/commits`, {
      method: 'POST',
      body: JSON.stringify({
        message:
          `copy(live-edit): "${row.new_text.replace(/\s+/g, ' ').slice(0, 60)}"\n\n` +
          `SOMA §17 in-place edit made canonical on ${row.route}.\n` +
          `was: ${row.original_text.replace(/\s+/g, ' ').slice(0, 200)}\n` +
          `now: ${row.new_text.replace(/\s+/g, ' ').slice(0, 200)}\n` +
          `override: ${row.id}\n`,
        tree: newTree.sha, parents: [baseSha],
      }),
    });
    await gh(token, `/repos/${REPO}/git/refs/heads/${BRANCH}`, {
      method: 'PATCH', body: JSON.stringify({ sha: commit.sha }),
    });
    sha = commit.sha;
  }

  // The page IS the source here, so once the commit lands the source has
  // genuinely caught up — this is the one place a row can honestly go straight
  // to `retired` (§17a R4: and it is never promotable again).
  await sb(`/rest/v1/copy_overrides?id=eq.${encodeURIComponent(body.id)}`, {
    method: 'PATCH',
    headers: { prefer: 'return=minimal' },
    body: JSON.stringify(
      sha
        ? { status: 'retired', canonical_at: new Date().toISOString(),
            retired_at: new Date().toISOString(), note: `commit:${sha}` }
        : { status: 'canonical', canonical_at: new Date().toISOString(),
            note: `pending:${skipped.join(', ')}` }
    ),
  });

  return json(200, {
    ok: true, committed: Boolean(sha), sha,
    files: changes.map((c) => c.path), skipped,
    reason: changes.length ? null : (skipped.join(', ') || 'no candidate files'),
  });
};

// Functions 2.0 path routing — and the reason this endpoint is not swallowed
// by any SPA-style catch-all: function paths are matched before redirects.
export const config = { path: '/api/copy-canonize' };
