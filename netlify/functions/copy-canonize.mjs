/* copy-canonize — SOMA §17 Tier 1 publish for mike-wolf.com.
 *
 * Sibling of mike-wolf-library/netlify/functions/copy-canonize.mjs,
 * silicon-children-site/netlify/functions/copy-canonize.mjs and
 * agi-2026/hub-public-functions/copy-canonize.mjs. The client engine
 * (js/live-edit.js) is byte-identical across those sites; this file is the half
 * that is genuinely per-site, because only the site knows which file on disk
 * holds a given sentence.
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
 *
 * 2026-09-16 (Mike Wolf's estate; Claude Opus 5, CCc): carries the four
 * publish-function fixes in SOMA/standards/soma-live-edit/ADOPT.md §5d, ported
 * from the minds-aligned.org function. Only whole, visible text runs match; an
 * HTML entity in the source matches the character the DOM shows; every read
 * and the commit use one base sha, and the ref update is not forced; a retry
 * that finds the source already saying the new words retires the row. Trap 5
 * (Netlify base directory) does not apply: this site builds from the repo root.
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

// Either spelling of a character is the same sentence to a reader. Named
// entities for the characters these pages actually spell that way; any
// non-ASCII character also matches its numeric forms.
const ENTITY_ALTS = {
  '—': ['&mdash;'],
  '–': ['&ndash;'],
  '’': ['&rsquo;'],
  '‘': ['&lsquo;'],
  '“': ['&ldquo;'],
  '”': ['&rdquo;'],
  '…': ['&hellip;'],
  '→': ['&rarr;'],
  '←': ['&larr;'],
  'á': ['&aacute;'],
  'é': ['&eacute;'],
  '©': ['&copy;'],
  '&': ['&amp;', '&#38;'],
  '<': ['&lt;', '&#60;'],
  '>': ['&gt;', '&#62;'],
  '"': ['&quot;', '&#34;'],
  "'": ['&apos;', '&#39;'],
};
const reEscape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function charPattern(ch) {
  const alts = [...(ENTITY_ALTS[ch] || [])].map(reEscape);
  const cp = ch.codePointAt(0);
  if (cp > 127) {
    const hex = cp.toString(16).replace(/[a-f]/g, (d) => `[${d}${d.toUpperCase()}]`);
    alts.push(`&#0*${cp};`, `&#[xX]0*${hex};`);
  }
  // Longer spellings first, the raw character last: a text ending in "&" would
  // otherwise match the "&" of "&amp;", and the whole-text check then rejects it.
  return alts.length ? `(?:${[...alts, reEscape(ch)].join('|')})` : reEscape(ch);
}

/* Whitespace-flexible, entity-tolerant literal match. The DOM collapses runs
 * of whitespace and the source wraps sentences across lines, so exact-byte
 * matching would fail on every wrapped paragraph. */
export function flexible(literal) {
  let src = '';
  let inSpace = false;
  for (const ch of literal) {
    if (/\s/.test(ch)) {
      if (!inSpace) src += '(?:\\s|&nbsp;)+';
      inSpace = true;
      continue;
    }
    inSpace = false;
    src += charPattern(ch);
  }
  return new RegExp(src, 'g');
}

// Plain text written into HTML: no tags.
const htmlText = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* Regions of a source file a visitor never reads as text: <head> (the engine only
 * walks <body>), <script>, <style> and <title> bodies, comments, and the inside
 * of tags (attributes, meta descriptions). A sentence that only matches in one of
 * these is not the sentence the admin clicked, so those hits are dropped. */
function hiddenRanges(text) {
  const ranges = [];
  for (const re of [/<head\b[^>]*>[\s\S]*?<\/head\s*>/gi, /<(script|style|title)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,
                    /<!--[\s\S]*?-->/g, /<[a-zA-Z\/!][^>]*>/g]) {
    for (const m of text.matchAll(re)) ranges.push([m.index, m.index + m[0].length]);
  }
  return ranges;
}
/* The engine's original_text is one WHOLE text node, so a hit must also be a
 * whole run of text in the source: markup on both sides, whitespace allowed.
 * Otherwise a short heading would match inside a longer sentence. */
function wholeText(text, h) {
  const before = text.slice(Math.max(0, h.index - 200), h.index).replace(/(?:\s|&nbsp;)+$/, '');
  const after = text.slice(h.index + h[0].length, h.index + h[0].length + 200).replace(/^(?:\s|&nbsp;)+/, '');
  const okBefore = before === '' || />$/.test(before);
  const okAfter = after === '' || /^</.test(after);
  return okBefore && okAfter;
}
export const visibleHits = (text, re) => {
  const ranges = hiddenRanges(text);
  return [...text.matchAll(re)].filter((h) =>
    !ranges.some(([a, b]) => h.index >= a && h.index < b) && wholeText(text, h));
};

export function patch(text, originalText, newText, occurrence) {
  const hits = visibleHits(text, flexible(originalText));
  if (hits.length === 0) {
    // Idempotent: already saying the new thing is "done", not "failed".
    const already = visibleHits(text, flexible(newText)).length > 0;
    return { changed: false, text, reason: already ? 'already-applied' : 'no-match' };
  }
  let hit;
  if (hits.length === 1) hit = hits[0];
  else if (occurrence < hits.length) hit = hits[occurrence];
  else return { changed: false, text, reason: `ambiguous:${hits.length}-matches` };
  return {
    changed: true,
    text: text.slice(0, hit.index) + htmlText(newText) + text.slice(hit.index + hit[0].length),
  };
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

// Read at a COMMIT sha, never at the branch name: right after a commit, a read by
// branch name can return the previous version, and a patch built on that would
// silently undo the edit before it.
// Is `sha` still the branch head? Checked with a write, not a read: GitHub
// answers a same-sha non-forced update with 200 and an out-of-date one with
// 422, and neither moves the branch.
async function isHead(token, sha) {
  try {
    await gh(token, `/repos/${REPO}/git/refs/heads/${BRANCH}`, {
      method: 'PATCH', body: JSON.stringify({ sha, force: false }),
    });
    return true;
  } catch (e) {
    if (String(e.message).includes('-> 422')) return false;
    throw e;
  }
}

async function readFile(token, path, sha) {
  try {
    const r = await gh(token, `/repos/${REPO}/contents/${encodeURI(path)}?ref=${sha}`);
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

  // One base commit for the whole operation: every read, the new tree and the
  // commit's parent all come from it, and the ref update below is not forced.
  const baseSha = (await gh(token, `/repos/${REPO}/git/ref/heads/${BRANCH}`)).object.sha;

  const preferred = ROUTE_FILES[row.route];
  const candidates = preferred ? [preferred, ...ALL_FILES.filter((f) => f !== preferred)] : ALL_FILES;

  const changes = [];
  const skipped = [];
  for (const path of candidates) {
    const text = await readFile(token, path, baseSha);
    if (text === null) { skipped.push(`${path}:absent`); continue; }
    const r = patch(text, row.original_text, row.new_text, row.occurrence || 0);
    if (!r.changed) { skipped.push(`${path}:${r.reason}`); continue; }
    changes.push({ path, content: r.text });
    break;   // the string lives in exactly one page; stop at the first hit
  }

  let sha = null;
  if (changes.length) {
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
    try {
      await gh(token, `/repos/${REPO}/git/refs/heads/${BRANCH}`, {
        method: 'PATCH', body: JSON.stringify({ sha: commit.sha, force: false }),
      });
    } catch (e) {
      // Someone else moved the branch between our read and our write. Nothing
      // was published; the row stays a draft, and saying so beats clobbering.
      if (String(e.message).includes('-> 422')) {
        return json(409, { ok: false, error: 'the site changed while publishing — publish again' });
      }
      throw e;
    }
    sha = commit.sha;
  }

  // Nothing committed, so nothing above proved the base sha was the branch
  // head. A stale read right after someone else's commit would make an undo
  // look "already applied" and retire it unpublished. A non-forced ref update
  // to the same sha is a no-op when it is the head and a 422 when the branch
  // has moved on, so it checks through the same path a commit would.
  if (!sha && !(await isHead(token, baseSha))) {
    return json(409, { ok: false, error: 'the site changed while publishing — publish again' });
  }

  // A retry after a lost response finds the source already saying the new
  // words. That is a source that has caught up (read back, not assumed), so it
  // retires the row like a fresh commit would.
  const caughtUp = !sha && skipped.find((s) => s.endsWith(':already-applied'));

  // The page IS the source here, so once the commit lands the source has
  // genuinely caught up — this is the one place a row can honestly go straight
  // to `retired` (§17a R4: and it is never promotable again).
  await sb(`/rest/v1/copy_overrides?id=eq.${encodeURIComponent(body.id)}`, {
    method: 'PATCH',
    headers: { prefer: 'return=minimal' },
    body: JSON.stringify(
      sha || caughtUp
        ? { status: 'retired', canonical_at: new Date().toISOString(),
            retired_at: new Date().toISOString(), note: sha ? `commit:${sha}` : caughtUp }
        : { status: 'canonical', canonical_at: new Date().toISOString(),
            note: `pending:${skipped.join(', ')}` }
    ),
  });

  return json(200, {
    ok: true, committed: Boolean(sha), sha, alreadyApplied: Boolean(caughtUp),
    files: changes.map((c) => c.path), skipped,
    reason: changes.length ? null : (skipped.join(', ') || 'no candidate files'),
  });
};

// Functions 2.0 path routing — and the reason this endpoint is not swallowed
// by any SPA-style catch-all: function paths are matched before redirects.
export const config = { path: '/api/copy-canonize' };
