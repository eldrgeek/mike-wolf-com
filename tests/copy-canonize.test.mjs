// Matcher tests for netlify/functions/copy-canonize.mjs, run against the REAL
// pages (index.html, songs.html), not fixtures. Every case below is a sentence
// the pre-2026-09-16 matcher got wrong on these files.
//
//   node --test tests/copy-canonize.test.mjs
//
// SOMA/standards/soma-live-edit/ADOPT.md §5d, traps 1, 2 and 4. Trap 3 (one base
// sha, non-forced ref update) is GitHub API wiring and is proven end to end, not
// here.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { flexible, visibleHits, patch } from '../netlify/functions/copy-canonize.mjs';

const read = (f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const index = read('index.html');
const songs = read('songs.html');
const hits = (text, s) => visibleHits(text, flexible(s));

test('trap 1: text that also appears in <head> matches only the body copy', () => {
  // <meta name="description" content="I am Mike Wolf's website. …"> comes first.
  const h = hits(index, "I am Mike Wolf's website.");
  assert.equal(h.length, 1);
  assert.ok(h[0].index > index.indexOf('</head>'));
  const r = patch(index, "I am Mike Wolf's website.", 'TEST WORDS', 0);
  assert.ok(r.changed);
  assert.match(r.text, /<meta name="description" content="I am Mike Wolf's website\./);
});

test('trap 1: <title> text is not a match, and occurrence picks among body copies', () => {
  // <title>Mike's Songs &amp; Poems …</title>, then the nav link, then the <h1><em>.
  const h = hits(songs, 'Songs & Poems');
  assert.equal(h.length, 2);
  const r = patch(songs, 'Songs & Poems', 'TEST WORDS', 1);
  assert.ok(r.changed);
  assert.match(r.text, /<h1>Mike's <em>TEST WORDS<\/em><\/h1>/);
  assert.match(r.text, /class="active">Songs &amp; Poems<\/a>/);
});

test('trap 1: a short text node does not match inside longer sentences', () => {
  assert.equal(hits(index, 'at').length, 1);      // was 188
  assert.equal(hits(index, 'Mike').length, 1);    // was 33
  assert.equal(hits(songs, 'Suno').length, 2);    // was 17: "Listen on Suno", URLs, prose
});

test('trap 1: comments are not copy', () => {
  assert.equal(hits(index, 'Hello. I am the source code. Version 5. I talk less about myself now. It was time.').length, 0);
});

test('trap 2: an HTML entity in the source matches the character the DOM shows', () => {
  assert.equal(hits(songs, 'December 2025 — March 2026').length, 1);   // &mdash;
  assert.equal(hits(songs, 'Bikin\' in Bogotá').length, 1);            // &aacute;
  assert.equal(hits(songs, '← Back home').length, 1);                   // &larr;
  assert.equal(hits(index, 'Tell Greta →').length, 1);                  // &rarr;
  assert.equal(hits(index, 'Special content & news').length, 1);        // &amp;
});

test('trap 2: new words are written as text, never as markup', () => {
  const r = patch(index, 'Special content & news', 'A <b> & B', 0);
  assert.ok(r.changed);
  assert.ok(r.text.includes('<h3>A &lt;b&gt; &amp; B</h3>'));
});

test('trap 2: a text ending in "&" is found where the file spells it "&amp;"', () => {
  // Found 2026-09-16: the raw "&" was tried before "&amp;", so the match stopped
  // at the "&" and the whole-text check rejected it. The undo could not land.
  const edited = patch(index, 'Special content & news', 'Special content &', 0);
  assert.ok(edited.changed);
  assert.ok(edited.text.includes('<h3>Special content &amp;</h3>'));
  const undone = patch(edited.text, 'Special content &', 'Special content & news', 0);
  assert.ok(undone.changed, undone.reason);
  assert.equal(hits(undone.text, 'Special content & news').length, 1);
});

test('trap 4: edit, undo, and a retry of the undo', () => {
  const was = 'December 2025 — March 2026';
  const now = 'December 2025 — March 2026 (test)';
  const edited = patch(songs, was, now, 0);
  assert.ok(edited.changed);
  assert.equal(hits(edited.text, now).length, 1);
  assert.equal(hits(edited.text, was).length, 0);

  const undone = patch(edited.text, now, was, 0);
  assert.ok(undone.changed);
  assert.equal(hits(undone.text, was).length, 1);

  // The admin clicks again after a lost response: the source already says it.
  const retry = patch(undone.text, now, was, 0);
  assert.equal(retry.changed, false);
  assert.equal(retry.reason, 'already-applied');
});
