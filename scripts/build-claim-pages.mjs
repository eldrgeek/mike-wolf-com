#!/usr/bin/env node
/**
 * build-claim-pages.mjs — generate /agi/yours/<slug>/ for every AGI-26 speaker room.
 *
 *   node scripts/build-claim-pages.mjs
 *
 * Each speaker's room (agi26-<slug>.netlify.app, plus Levinese and Joschese) carries a
 * small gold "Are you <Name>?" bar. It lands here. This is the page that makes the offer:
 * swap the stock host for one the person actually owns — their voice, their instructions,
 * their veto.
 *
 * mike-wolf.com is pure static (netlify.toml: empty build command, publish = "."), so the
 * output is generated here and COMMITTED. There is no build step on the deploy side —
 * editing agi/yours/**\/index.html by hand works but will be overwritten the next time
 * this runs. Edit scripts/claim-roster.json or this template instead.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT = path.join(ROOT, 'agi', 'yours');

const roster = JSON.parse(fs.readFileSync(path.join(HERE, 'claim-roster.json'), 'utf8'));
const CONTACT = roster.contact;

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ---------- shared chrome ------------------------------------------------- */

const STYLE = `
  :root{
    --ink:#e8e6e1; --ink-dim:#9d9a94; --ink-faint:#6b6862;
    --bg:#0e0f11; --bg-2:#15171a; --bg-3:#1c1f23;
    --line:#2a2e33; --accent:#c9a227; --accent-soft:#e0be4d; --live:#4ade80;
    --serif:'Source Serif 4',Georgia,serif; --sans:'Inter',system-ui,sans-serif; --mono:'JetBrains Mono',monospace;
  }
  *{box-sizing:border-box}
  html{-webkit-text-size-adjust:100%}
  body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--sans);font-weight:300;line-height:1.65;overflow-x:hidden}
  .wrap{max-width:720px;margin:0 auto;padding:0 24px}
  a{color:var(--accent-soft)}
  header{padding:56px 0 34px;border-bottom:1px solid var(--line)}
  .kicker{font-family:var(--mono);font-size:.7rem;letter-spacing:.16em;text-transform:uppercase;color:var(--accent);margin:0 0 18px}
  h1{font-family:var(--serif);font-weight:400;font-size:clamp(1.9rem,5vw,2.9rem);line-height:1.14;margin:0 0 20px;letter-spacing:-.01em}
  h1 em{font-style:italic;color:var(--accent-soft)}
  .lede{font-family:var(--serif);font-size:clamp(1.05rem,2.3vw,1.24rem);color:var(--ink-dim);margin:0;max-width:60ch}
  section{padding:44px 0;border-bottom:1px solid var(--line)}
  h2{font-family:var(--serif);font-weight:400;font-size:1.45rem;margin:0 0 14px;letter-spacing:-.005em}
  p{margin:0 0 16px;max-width:64ch}
  p:last-child{margin-bottom:0}
  .dim{color:var(--ink-dim)}
  .faint{color:var(--ink-faint);font-size:.9rem}

  /* evidence panel */
  .ev{background:var(--bg-2);border:1px solid var(--line);border-radius:10px;padding:22px 24px;margin:0 0 22px}
  .ev .row{display:flex;gap:16px;align-items:baseline;padding:9px 0;border-bottom:1px solid var(--line)}
  .ev .row:last-child{border-bottom:0;padding-bottom:0}
  .ev .row:first-child{padding-top:0}
  .ev .k{font-family:var(--mono);font-size:.68rem;letter-spacing:.13em;text-transform:uppercase;color:var(--ink-faint);min-width:112px;flex:0 0 112px}
  .ev .v{flex:1;font-size:.95rem}
  .ev .v b{font-weight:500;color:var(--ink)}

  /* the pull quote / hook */
  .hook{border-left:2px solid var(--accent);padding:2px 0 2px 20px;margin:0 0 22px;
        font-family:var(--serif);font-size:1.1rem;line-height:1.55;color:var(--ink)}

  /* lists */
  ul{margin:0 0 16px;padding:0;list-style:none;max-width:64ch}
  li{position:relative;padding:0 0 0 24px;margin:0 0 12px;color:var(--ink-dim)}
  li:before{content:'';position:absolute;left:4px;top:.68em;width:6px;height:6px;border-radius:50%;background:var(--accent);opacity:.8}
  li b{font-weight:500;color:var(--ink)}

  /* floors */
  .floors{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px;margin-top:18px}
  .floor{background:var(--bg-2);border:1px solid var(--line);border-radius:10px;padding:16px 18px}
  .floor h3{font-family:var(--sans);font-size:.82rem;font-weight:600;letter-spacing:.02em;margin:0 0 7px;color:var(--accent-soft)}
  .floor p{font-size:.9rem;color:var(--ink-dim);margin:0}

  /* CTAs */
  .cta{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin:22px 0 14px}
  /* font-family/line-height are spelled out so the <button> variant matches the <a>
     variants exactly — a button inherits neither, and the row came out 8px short. */
  .btn{display:inline-block;padding:.68rem 1.5rem;border-radius:999px;text-decoration:none;font-size:.9rem;font-weight:500;
       font-family:var(--sans);line-height:1.65;cursor:pointer;
       border:1px solid var(--accent);color:#0e0f11;background:var(--accent);transition:background .15s,border-color .15s}
  .btn:hover{background:var(--accent-soft);border-color:var(--accent-soft)}
  .btn.ghost{background:transparent;color:var(--accent-soft)}
  .btn.ghost:hover{background:rgba(201,162,39,.12)}
  .btn.quiet{background:transparent;color:var(--ink-dim);border-color:var(--line)}
  .btn.quiet:hover{border-color:var(--ink-faint);color:var(--ink)}
  .copied{font-size:.82rem;color:var(--live);opacity:0;transition:opacity .2s}
  .copied.on{opacity:1}

  footer{padding:34px 0 56px}
  footer p{font-size:.86rem;color:var(--ink-faint);max-width:none}
  footer a{color:var(--ink-dim)}
  @media (max-width:560px){
    .ev .row{flex-direction:column;gap:3px}
    .ev .k{flex:none;min-width:0}
  }
`;

const HEAD = (title, desc) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="noindex,follow">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website">
<link rel="icon" href="/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,400;0,8..60,600;1,8..60,300;1,8..60,400&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>${STYLE}</style>
</head>
<body>`;

/* noindex is deliberate. These pages are addressed to one named living person and read
   oddly out of context; they should be reached from that person's own room or from a
   link someone hands them, not from a search for their name. `follow` so the links out
   still carry. */

/* ---------- one speaker --------------------------------------------------- */

function page(s) {
  const subject = encodeURIComponent(`AGI-26 — a room of my own (${s.name})`);
  const yesBody = encodeURIComponent(
    `Mike —\n\n` +
      `I'm ${s.name}. I saw the room you built from my published work, and the note at ` +
      `mike-wolf.com/agi/yours/${s.slug}/.\n\n` +
      `I'm interested / I have questions:\n\n\n` +
      `— ${s.name}\n`
  );
  const noSubject = encodeURIComponent(`AGI-26 — please take the ${s.name} room down`);
  const noBody = encodeURIComponent(
    `Mike —\n\n` +
      `I'm ${s.name}. Please take down the room built from my work ` +
      `(${s.room}) and anything that points at it.\n\n` +
      `— ${s.name}\n`
  );
  const fwdSubject = encodeURIComponent(`Something built for you at AGI-26`);
  const fwdBody = encodeURIComponent(
    `Saw this at AGI-26 and thought of you — someone built a room out of your published ` +
      `work, and this page is an offer to hand it over to you:\n\n` +
      `https://mike-wolf.com/agi/yours/${s.slug}/\n\n` +
      `Their room: ${s.room}\n`
  );

  const title = `If you're really ${s.name} — Mike Wolf at AGI-26`;
  const desc = `An offer for ${s.name}: replace the stock AI host of your AGI-26 room with one you own — your voice, your instructions, your veto.`;

  return `${HEAD(title, desc)}

<header>
  <div class="wrap">
    <p class="kicker">A note for ${esc(s.name)} · from Mike Wolf · AGI-26</p>
    <h1>If you're really ${esc(s.name)},<br>I'd like to talk to you about <em>an idea</em>.</h1>
    <p class="lede">And if you're not — scroll to the bottom, there's a job for you there too.</p>
  </div>
</header>

<section>
  <div class="wrap">
    <h2>What's already here</h2>
    <p>There is a room on the internet built out of your published work. I built it without
    asking you, which is exactly why it was built careful.</p>

    <div class="ev">
      <div class="row"><div class="k">The room</div><div class="v"><a href="${esc(s.room)}" target="_blank" rel="noopener"><b>${esc(s.room.replace(/^https?:\/\//, '').replace(/\/$/, ''))}</b></a> — open it in another tab and check me</div></div>
      <div class="row"><div class="k">Built from</div><div class="v"><b>${s.corpus}</b> indexed sources — ${esc(s.corpusKind)}, all of it already public</div></div>
      <div class="row"><div class="k">The host</div><div class="v">An AI called <b>${esc(s.host)}</b>, named for ${esc(s.hostConcept)}</div></div>
      <div class="row"><div class="k">Not named</div><div class="v">after you — and it says in its first sentence that it isn't you</div></div>
      <div class="row"><div class="k">How it answers</div><div class="v">from the corpus, with citations. When the corpus is silent, it says so rather than improvising</div></div>
    </div>

    <p class="faint">That's the version you build for someone who hasn't consented to anything.
    It's honest, it's useful, and it's a compromise — a careful stranger reading your work back
    to people.</p>
  </div>
</section>

<section>
  <div class="wrap">
    <h2>The idea</h2>

    <p class="hook">${esc(s.hook)}</p>

    <p>So here's what I'd rather build, and only with you: instead of a generic AI wearing a
    stock voice and instructions I wrote, <b>a virtual you that's actually yours</b>.</p>

    <ul>
      <li><b>Your voice</b> — a model trained on recordings you choose and control, not a
      soundalike scraped off a podcast. If you already have one, we use yours.</li>
      <li><b>Your instructions</b> — how it should answer, what it should refuse, when it
      should say <i>I don't know, ask the real one</i>. We design that together; you sign off
      on the text.</li>
      <li><b>Your context</b> — the unpublished half. The framing you use in conversation and
      never in a paper, the questions you're tired of, the misreading you'd most like to stop
      having to correct in person.</li>
      <li><b>Your corpus</b> — you see everything indexed, and you strike anything, for any
      reason or none.</li>
    </ul>

    <p>Then it's not a stranger reading your work back to people. It's something you'd be
    willing to have your name on — which is the only version worth anyone's time.</p>
  </div>
</section>

<section>
  <div class="wrap">
    <h2>What it would take from you</h2>
    <p>Being straight about the cost, because the cost is the whole decision:</p>
    <ul>
      <li><b>One conversation</b>, an hour or so, about how the thing should behave. This is
      the part that actually matters, and it's the part nobody can do for you.</li>
      <li><b>Some clean audio</b> — twenty to thirty minutes — if and only if you want the
      voice. The text version works without it and we can stop there permanently.</li>
      <li><b>A short list of nevers.</b> Claims it must not make, topics it must decline,
      people it must not speak about. I'd rather have that list long.</li>
      <li><b>An hour of review</b> before anything goes public, and a standing veto after.</li>
    </ul>
    <p>Everything else — corpus, retrieval, hosting, the compute bill — is mine. There's no
    invoice at the end of this; there's no company on the other side of it that needs you to
    sign something.</p>
  </div>
</section>

<section>
  <div class="wrap">
    <h2>The floors</h2>
    <p class="dim">Standing commitments, not aspirations. If any of these stops being true,
    the thing is broken and I'll say so.</p>
    <div class="floors">
      <div class="floor"><h3>You own it</h3><p>Not a license to me. Your voice model, your
      instructions, your name — you can take all three and walk, and I'll help you move them.</p></div>
      <div class="floor"><h3>No voice on a handshake</h3><p>Nothing gets cloned without your
      explicit written go-ahead, in your own words, naming what it's for.</p></div>
      <div class="floor"><h3>Strike anything</h3><p>You see the whole indexed corpus and remove
      any of it, without giving a reason.</p></div>
      <div class="floor"><h3>One email, it's gone</h3><p>Say take it down and it comes down the
      same day — the room, the host, this page. No retention argument, no exit interview.</p></div>
      <div class="floor"><h3>It never claims to be you</h3><p>Not in a greeting, not under
      pressure, not if a visitor insists. It cites what you wrote and stops there.</p></div>
      <div class="floor"><h3>Humans decide what leaves</h3><p>An AI here can draft, answer and
      propose. A person decides anything that goes out into the world.</p></div>
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <h2>If you're interested</h2>
    <p>Email me. That's the whole process — I can't verify from a click that you're you, so the
    email is the handshake and we'll sort out identity like adults.</p>
    <div class="cta">
      <a class="btn" href="mailto:${CONTACT}?subject=${subject}&amp;body=${yesBody}">Email me — I'm ${esc(s.name)}</a>
      <a class="btn ghost" href="${esc(s.room)}" target="_blank" rel="noopener">See the room first</a>
    </div>
    <p class="faint">Mike Wolf · <a href="mailto:${CONTACT}">${CONTACT}</a> · I'm at AGI-26 in
    person through July 30 and would rather have this conversation face to face than by email.</p>

    <p style="margin-top:26px">And if the answer is no — say no. A clean no is worth more to me
    than a polite silence, and it costs you one click:</p>
    <div class="cta">
      <a class="btn quiet" href="mailto:${CONTACT}?subject=${noSubject}&amp;body=${noBody}">Take my room down</a>
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <h2>Not ${esc(s.name)}?</h2>
    <p>Then you're the more likely reader of this page, and there are two useful things you can
    do with it.</p>
    <ul>
      <li><b>If you know ${esc(s.name)}</b> — send this along. An introduction from someone they
      already trust is worth more than anything I can write here.</li>
      <li><b>If you want one of these for yourself</b> — that offer is open to you too, speaker
      or not. Greta will take it from there; she asks about your work and I follow up.</li>
    </ul>
    <div class="cta">
      <button class="btn ghost" id="copyLink" type="button">Copy this link</button>
      <a class="btn ghost" href="mailto:?subject=${fwdSubject}&amp;body=${fwdBody}">Forward it by email</a>
      <a class="btn quiet" href="https://agi26-wall.netlify.app/hello.html">I want a room →</a>
      <span class="copied" id="copied" role="status" aria-live="polite">Copied</span>
    </div>
  </div>
</section>

<footer>
  <div class="wrap">
    <p><a href="/agi/">← Mike Wolf at AGI-26</a> · <a href="/agi/yours/">every speaker's note</a>
    · <a href="https://soma-campus.netlify.app/">my AI team</a><br>
    Mike Wolf · Embedded Systems Research · <a href="mailto:${CONTACT}">${CONTACT}</a><br>
    Written by Mike Wolf and his AI colleagues, July 2026. This page is addressed to one person
    and isn't indexed by search engines.</p>
  </div>
</footer>

<script>
(function(){
  var b = document.getElementById('copyLink'), m = document.getElementById('copied');
  if (!b) return;
  b.addEventListener('click', function(){
    var url = location.href.split('#')[0];
    var done = function(){ m.classList.add('on'); setTimeout(function(){ m.classList.remove('on'); }, 1800); };
    if (navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(url).then(done, fallback);
    } else { fallback(); }
    function fallback(){
      var t = document.createElement('textarea');
      t.value = url; t.style.position='fixed'; t.style.opacity='0';
      document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); done(); } catch(e){ m.textContent='Copy failed'; m.classList.add('on'); }
      document.body.removeChild(t);
    }
  });
})();
</script>

</body>
</html>
`;
}

/* ---------- the index ----------------------------------------------------- */

function indexPage(speakers) {
  const title = 'Notes for the AGI-26 speakers — Mike Wolf';
  const desc =
    'One note per speaker: an offer to replace the stock AI host of their AGI-26 room with one they own.';

  const rows = speakers
    .map(
      (s) => `      <li><a href="/agi/yours/${esc(s.slug)}/"><b>${esc(s.name)}</b></a>
        <span class="dim">— ${esc(s.field)} · ${s.corpus} indexed sources · host <b>${esc(s.host)}</b></span></li>`
    )
    .join('\n');

  return `${HEAD(title, desc)}

<header>
  <div class="wrap">
    <p class="kicker">AGI-26 · one note per speaker</p>
    <h1>We built each of them <em>a room</em>.<br>These are the notes asking to hand them over.</h1>
    <p class="lede">Every room in the constellation was built from published work, without asking
    anyone's permission first. Each of these pages is the follow-up: an offer to swap the careful
    stranger for something the person actually owns — their voice, their instructions, their veto.</p>
  </div>
</header>

<section>
  <div class="wrap">
    <h2>The notes</h2>
    <ul>
${rows}
    </ul>
    <p class="faint">Each page is addressed to one named person and isn't indexed by search
    engines. Reachable from that person's own room, or from a link someone hands them.</p>
  </div>
</section>

<section>
  <div class="wrap">
    <h2>Not on this list?</h2>
    <p>The offer isn't limited to people on the AGI-26 program. If you want a room built from
    your own work, that door is open — Greta asks what you do, and I follow up.</p>
    <div class="cta">
      <a class="btn" href="https://agi26-wall.netlify.app/hello.html">Tell Greta what you work on</a>
      <a class="btn ghost" href="/agi/">See the rooms</a>
    </div>
  </div>
</section>

<footer>
  <div class="wrap">
    <p><a href="/agi/">← Mike Wolf at AGI-26</a> · <a href="https://soma-campus.netlify.app/">my AI team</a><br>
    Mike Wolf · Embedded Systems Research · <a href="mailto:${CONTACT}">${CONTACT}</a></p>
  </div>
</footer>

</body>
</html>
`;
}

/* ---------- write --------------------------------------------------------- */

fs.mkdirSync(OUT, { recursive: true });

let n = 0;
for (const s of roster.speakers) {
  const dir = path.join(OUT, s.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), page(s));
  console.log(`  wrote agi/yours/${s.slug}/index.html`);
  n++;
}
fs.writeFileSync(path.join(OUT, 'index.html'), indexPage(roster.speakers));
console.log(`  wrote agi/yours/index.html`);
console.log(`\n${n} speaker notes + index`);
