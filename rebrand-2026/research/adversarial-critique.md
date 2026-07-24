# Adversarial Design Critique — rebrand-2026 concept stack

**Target docs:** `concepts/BRAND-KERNEL.md`, `concepts/INTERACTION-DESIGN.md`, `concepts/PAGE-SPICE.md`, `research/collaborator-thesis.md`  
**Role:** Hard pass before v0 build. Not a tone workshop.  
**Authorship:** Grok Build (adversarial critic) · 2026-07-12 · Mike principal  
**Verdict up front:** **GO-WITH-FIXES** — spine is right; circus budget is oversubscribed; 30s thesis is at risk of drowning in charm.

---

## 1. The 30-second test is written better than it is designed

### Failure mode
Thesis §7 asks a cold visitor to answer: *named colleagues, not chatbot user; site is one of them; warm recognition; non-buy next step.*  

What the kernel + interaction + spice stack actually ships in the first viewport is closer to: **characters enter, joke, sprint, ember trail, dual bubbles, SOMA widget, teal peek, living bylines, video dock, typo broom…**  

That is a *catalog of proofs*, not a *sequence of understanding*. If everything is thesis-encoding, nothing is.

### Specific failure
- Hero package in thesis §5.4 is good (≤60 words, three doors).
- Brand kernel then loads avatar bible + sprint + overlays + idle gags as co-equal “locks.”
- Interaction design makes sprint → lightbox → timestamp overlays the “central feature.”
- Page spice piles ushers, living bylines, quiet colleagues, mood filters, shimmy cards.

**A cold visitor can fail claim A (relationship vs instrument) because they only remember a cartoon Mike with a broom.**

### Fix (ship-blocking for v0)
1. **Freeze a 30-second storyboard as the only homepage authority.** Thesis §5.4 becomes canonical; interaction design and spice may only implement beats that appear in it.
2. **One multi-mind exchange in the first fold — max.** Website line + Dee line + one push-back. No sprint, no typo fix, no high-five, no roster chip strip until after first scroll or after tour click.
3. **Success metric on prototype day-1:** five cold readers, timer, verbal quiz from thesis §7. If ≥3 fail question 1, cut motion, not copy.

---

## 2. Over-cute is not a risk column — it is the current default

### Where it goes Disney
| Idea | Why it fails |
|------|----------------|
| Typo that reappears + broom sweep | Collaboration-as-maintenance is smart *as a metaphor*; as a 10px walk cycle it is mascot theater. |
| Mike sits down after 3 min idle; colleague knocks on video glass | Idle gags reward dwellers and punish scanners. Personal site traffic is scanners. |
| Universe card **shimmy** when avatar walks past | Pure charm. Zero thesis. |
| Empty chair in teal in brand photo | Fine as still photography concept; if it becomes UI chrome, cosplay. |
| Avatar eyes track cursor (3px) | Games/portfolio kitsch; competes with reading. |
| High-five teal colleague | Explicitly the “too cute” risk the kernel already named — then listed as idle behavior. |

Kernel risks table says “keep avatar small; jokes short; allow silence.” Avatar bible then specifies: nudge card, fix typo, high-five, peek source, wave at SOMA tab, sprint with ember trail, DOM sticky notes. **The mitigation is aspirational; the inventory is the product.**

### Fix
1. **v0 avatar budget: two states only** — (a) docked static portrait with caption, (b) optional click-to-tour handoff (cross-fade, no sprint trail). Everything else is post-v0 or `prefers-reduced-motion` never-ship.
2. **Cut from v0 entirely:** typo broom, idle sit-down, card shimmy, eye tracking, high-five, ember canvas trail.
3. **One joke seat per viewport** — if hero already has bathos, next scroll cannot also have a gag. Enforce in design review as a checklist item, not a vibe.

---

## 3. Brand incoherence: three narrators, unclear CEO

### Conflict
- Thesis cast: Website (host) · Dee (colleague) · Mike (human anchor, “enters late”).
- Kernel avatar bible: **Mike (roaming)** is the primary motion character; Website is copper copy; colleague is teal sprite.
- Interaction design: Mike sprite in header; colleague docked at SOMA widget; tour overlays both.

**Who is the protagonist of the stage?** Thesis says the *site* is the host. Interaction design makes *Mike-the-sprite* the action hero who sprints into the video box. That recenters the human as mascot and demotes “I am Mike’s website” to static H1.

Also: **Dee vs Claude** is still an open question (thesis §9) but interaction design already ships “Dee/Claude” name tags and Dee-voiced video lines. Public personal brand day-one with an insider codename is either power (for people who know) or confusion (for everyone else).

### Fix
1. **Lock cast hierarchy for v0:** Website speaks first and most; Dee/Claude speaks second and shorter; Mike-as-author is photo/quote/byline — **not** a roaming game character.
2. **Public name rule:** hero and first-fold use **Claude** (or “Claude (Dee in the shop)”) once; full Dee-as-default only after one scroll or on portfolio living bylines. Do not make cold traffic decode SOMA substrate nicknames to pass the thesis test.
3. **Rename “Mike sprite” in specs to “Author mark” or kill roaming Mike** so the site-entity remains the fourth-wall host.

---

## 4. Accessibility: polite ARIA does not fix a motion-first concept

### Gaps
- Sprites + speech bubbles + timestamp overlays + dual-voice blocks + living bylines + optional teal peeks = **cognitive load and focus chaos**, not just motor accessibility.
- `aria-live="polite"` on status changes is correct for incidental updates and **wrong for narrative dialogue** that carries thesis meaning. Screen-reader users will either miss the thesis or get interrupted mid-read.
- Reduced-motion path replaces sprint with cross-fade and turns overlays into footnotes — **good** — but static footnotes below a video are a *second-class thesis*. RM users should get the dual-voice exchange in the **document order of the hero**, not only as video accessories.
- Mobile: sprites “docked as static inline” still compete with SOMA widget + nav. Thesis forbids blocking primary text; mobile chrome already eats attention.
- Color: copper `#b87333` and teal `#2a9d8f` on paper may pass body contrast; **small Mono labels, voice signatures, and bubble text on copper/teal borders need explicit WCAG checks** — not assumed from token poetry.
- “Mute the colleagues” toggle (thesis) is excellent consent UX and is **absent** from interaction design and page spice. That is a regression from research → concept.

### Fix
1. **Thesis-critical copy lives in static HTML first** (hero dialogue as real elements). Motion only *emphasizes* what already exists in the DOM.
2. **Ship “Classic / Colleagues” toggle in v0** (thesis “mute the colleagues”). Classic = single Website or Mike voice; Colleagues = dual blocks + optional sprites. Default can be Colleagues on desktop, Classic on `prefers-reduced-motion` and optionally mobile.
3. **No `aria-live` for dialogue.** Use visible, focusable text. Live regions only for non-essential status (“tour closed”).
4. **Contrast audit on every voice chip, bubble, Mono label** before visual freeze. Ember `#c45c26` on paper for CTAs — check.
5. **Mobile v0:** zero decorative sprites. Dual-voice blocks + tour button only.

---

## 5. Performance risk: “static-first, zero-framework” with a particle hobby

### Lies the stack tells itself
- Interaction design claims static-first, then: rAF cursor tracking, CSS sprint, optional **canvas ember trail**, video lightbox, timestamp-driven DOM overlay loop, idle timers (30s typo, 3min sit-down).
- Avatar assets (2.5D Mike + colleague glyph + wordmark irregularity + OG motion stills) will dominate LCP if not ruthlessly budgeted.
- Literata + Outfit + JetBrains Mono = three webfonts; fine if subsetted, death if full families + avatar sprites + auto video poster chase.
- `getBoundingClientRect` every animation frame for eye tracking is exactly the kind of “lightweight” JS that janks low-end laptops and drains mobile batteries when someone forgets to gate it.

### Fix
1. **Performance budget written into INTERACTION-DESIGN before code:**  
   - LCP < 2.5s on mid mobile, throttled  
   - Total JS for motion layer < 8KB gzipped  
   - No canvas in v0  
   - No continuous rAF unless a user-initiated tour is open  
   - Avatar total weight < 40KB (SVG/CSS preferred over PNG sequences)
2. **Video:** click-to-load only (poster + play). No preload of multi-box kitchen table / dark factory / dispatch aesthetic until after first tour or portfolio. Thesis lists four video boxes; **v0 ships one.**
3. **Delete eye-tracking sample code from the v0 path** or quarantine under `experiments/`. Shipping sample code in a concept doc is how it becomes production by accident.

---

## 6. Concept pile-on: thesis is a buffet, kernel is a lock, spice is a shopping list

### Weakness
Collaborator thesis is strong research and a weak product scope. §5 alone contains: roaming avatars, four video boxes, mute toggle, margin annotations, living bylines, resonance meter, wall ticker, HTML comments, hover authorship split, roster chip strip, hero storyboard.

Kernel claims “decisive · not a menu” then inherits half the menu. Page spice adds portfolio/songs systems that are right for secondary pages but reinforce the habit of **additive cleverness**.

**Result:** no one can answer “what is v0?” without arguing.

### Fix — explicit v0 cut line

| In v0 | Out of v0 (park with ticket) |
|-------|------------------------------|
| Hero dual-voice ≤60 words + three doors | Roaming / sprint / ember trail |
| One tour video, click-only, static dual captions under player | Timestamp sprite pop-ups in lightbox |
| Copper/teal blocks + living byline pattern | Resonance meter, wall ticker, hover authorship % |
| Portfolio: cluster by why + dual-voice usher + bylines | Quiet colleague sticky, card shimmy |
| Songs: copper opening + nav parity | Monthly teal song line, mood filters if half-built |
| `brand.css` tokens, age/SOMA string fix | Page-with-eyes mark polish, empty-chair photoshoot |
| Classic/Colleagues toggle + reduced-motion parity | Idle state machines, typo maintenance gag |

If it is not in the left column, it does not block “site remade.”

---

## 7. Copy spine: hero line is good; secondary lines fight

### Issues
- **“I am Mike’s website. We build with colleagues, not tools.”** — Strong. Passes thesis. Keep.
- Support **“Named, remembered, allowed to push back.”** — Good telegram; slightly slogan-y next to first-person site voice (who is naming whom?).
- Continuity **“Born 2018. Remade 2026. Still me.”** vs secondary OG **“Self-aware since 2018…”** — same beat thrice. Feels like the brand is anxious you missed the clever bit.
- Thesis also recommends longer hero-adjacent sentence about Mike and AI colleagues — **competing heroes**. Kernel already picked; thesis still lists six taglines as if undecided. Kill the menu in kernel or readers will reopen the vote.

### Fix
1. One hero, one support, one continuity line — **delete alternate heroes from build docs** or mark them `archive/`.
2. Support line in Website voice: *“I have colleagues. They have names. They push back.”* — keeps first person, matches H1.
3. Continuity appears once (footer or post-first-scroll), not hero + OG + timeline triple stamp.

---

## 8. Portfolio/Songs spice is mostly right — and still tool-frame adjacent

### Good
Clustering by *why*, living bylines, Spec Explorer as competence stage, Jan/Fergus framing on songs, no roaming Mike on songs. These fix real audit failures.

### Still weak
- “Quiet colleague — one teal peek per session” on empty descriptions is cute QA, not visitor value. Internal dogfood ≠ public spice.
- Mood filters (grief · joy · absurd · love · WTF) on songs risk **music-app chrome** the doc itself warns against, unless they are pure text tags with zero pill UI.
- Universe “named-host glyph when SOMA host exists” assumes cold visitors know what a host pair is. Without a one-line gloss, glyphs are lore badges for insiders.

### Fix
1. Empty-description teal peek: **authoring-time only** (CMS/dev), not production visitor UI.
2. Mood: plain text links or heading groups; no filter chrome in v0 unless tags already work and look like a table of contents.
3. Host glyphs: only with visible name string (“Bill · AI host”) — never icon-only.

---

## 9. Fourth-wall ethics: strong on paper, under-specified in interaction

Thesis guardrails (name human, name silicon, push-back on camera, no autoplay, bathos hatch) are the best part of the research pack. Interaction design implements **gags and a tour**, not a **visible don’t-satisfice beat**.

Without one on-page correction (Website overclaims → Claude softens, or Mike quote slightly wrong → colleague fixes), the site performs multi-voice theater without proving push-back rights. That fails claim A at the behavioral layer.

### Fix
**Mandatory v0 content beat (static HTML, above the fold or immediately below):**  
Website: “We build the future of collaboration.”  
Colleague: “Almost right. We build *our* collaboration in public. The future can wait.”  
Mike (byline or photo caption): stays human, does not re-argue.  

That single exchange does more thesis work than the broom.

---

## 10. Visual system: distinctive but one step from costume shop

- Paper/copper/teal is a real brand (not SaaS purple). Good.
- Ember as fifth accent for motion/CTA is justified only if motion stays; if motion is cut for v0, **ember collapses into copper** or exists only on Play. Five chromatic “meanings” is a lot for a personal site.
- “i-dot is a tiny ✦” and “page-with-eyes” mark: clever dual-audience joke; **favicon-scale eyes go uncanny or unreadable**. Prefer solid ✦ or simple page glyph at 16px; eyes only at ≥32px or in hero.
- 2.5D “recognizably 80s-something… martial-arts readiness” author avatar is a **commission and likeness risk** (age, dignity, uncanny). Kernel correctly bans photoreal puppet — still easy to ship something embarrassing.

### Fix
1. v0 color: paper, ink, warm body, copper, teal, muted, rule. **Ember optional, CTA-only.**
2. Favicon: wordmark initial or ✦, not eyes.
3. Author visual v0: **existing real photo crop or simple monoline mark**, not new character bible art. Commission stylized Mike only after copy/IA prototype passes the 30s quiz.

---

## 11. Organizational / production risk

- Docs authored by multiple agents same day (Grok, Antigravity/Gemini, explore fleet). Tone locks are coherent; **scope locks are not**. Ralph “completed” interaction design reads like a feature complete fantasy for a personal homepage.
- “North star: the site runs around adjusting the furniture” actively fights “allow silence” and “secondary pages: ushers not circus.” North star should be **relationship visible in form**, not furniture gags.

### Fix
Rewrite north star for build:

> Joint human–AI work is visible in how the page speaks (named voices, push-back, honest attribution). Charm is optional. Clarity is not.

---

## 12. What is actually strong (so we don’t burn it)

- Collaborator thesis claims A/B/C and anti-slogans are sharp and non-corporate.
- Hero line and dual-audience HTML comments are load-bearing and differentiated.
- “Home = circus, other pages = ushers” is the correct operational rule — if enforced.
- Tour click-only, no chatbot jail, bathos permission, Silicon Children link-out not absorb — correct product boundaries.
- Portfolio recluster by why fixes a real brand leak (tool-frame).
- Reduced-motion footnotes idea is the right *direction* (parity), needs elevation to first-class content.

Do not rewrite the philosophy. **Rewrite the scope.**

---

## Verdict

### **GO-WITH-FIXES**

Build v0. Do not build the full interaction state machine.

**Ship-blocking fixes (must complete before calling v0 “on brand”):**

1. Canonical 30s storyboard only (thesis §5.4); kill competing tagline menus in build docs.  
2. v0 motion: docked/static + one click-to-tour; no roam, sprint, canvas, eye-track, typo broom, idle sitcoms.  
3. Static HTML dual-voice + one visible push-back beat; motion never sole carrier of thesis.  
4. Classic/Colleagues toggle; reduced-motion and mobile default to Classic content parity.  
5. Cast hierarchy: Website hosts; public “Claude” (Dee optional second mention); no roaming Mike mascot.  
6. One tour video only; performance budget + font subset + no continuous rAF.  
7. Portfolio/Songs: ushers + bylines + nav parity; no production “QA sprite.”  
8. Cold-reader 30s quiz before polish pass on avatars/mark.

**If those eight are rejected in favor of full avatar circus:** flip to **NO-GO** until scope is cut — not because the thesis is wrong, but because the site will be remembered as a mascot portfolio and fail its own success criteria.

**GO (unconditional)** only after a prototype passes thesis §7 with cold readers.

---

## 12-bullet executive summary

1. **Thesis is clearer than the design** — first fold is a charm inventory, not a 30s understanding path.  
2. **Over-cute is default** (broom, high-five, shimmy, eye-track, idle sit) despite the kernel’s own warning.  
3. **Cast hierarchy is incoherent** — thesis: Website hosts; interaction: Mike-sprite is action hero.  
4. **Dee/Claude public naming is unresolved** and already leaking into specs — confuses cold traffic.  
5. **Accessibility is underspecified** — `aria-live` dialogue and motion-as-thesis fail screen-reader and RM users.  
6. **“Mute colleagues” consent toggle is research gold and missing from interaction/spice.**  
7. **Performance story is self-contradictory** — static-first + canvas trails + rAF + multi-video is not static-first.  
8. **Scope is a buffet** — no one can define v0 without a hard cut table.  
9. **Missing mandatory push-back beat** — multi-voice without don’t-satisfice is costume, not proof.  
10. **Hero copy is strong; secondary lines and tagline menus dilute it.**  
11. **Portfolio/Songs direction is mostly right**; kill visitor-facing QA peeks and lore-only host icons.  
12. **Verdict: GO-WITH-FIXES** — ship dual-voice + one tour + push-back + ushers; park the circus until the 30s quiz passes.
