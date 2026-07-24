# Current-site audit — mike-wolf.com

**Scope:** Source at `~/Projects/mike-wolf-com/` + live check of https://mike-wolf.com (home, `/portfolio`, `/songs`) · 2026-07-12  
**Purpose:** Baseline for the 2026 rebrand (RALPH R2). What the site *is*, what must keep spirit, what is thin/dated/conflicted, and where secondary-page “spice” can land.

**Authorship:** Grok Build explore pass · source-read + live fetch · Mike = principal

---

## 1. Structure of the site

### Tech stack

| Layer | What it is |
|--------|------------|
| Hosting | **Netlify** — pure static publish |
| Build | `netlify.toml`: `publish = "."`, **empty `command`** — edit HTML directly, no bundler |
| Pages | Three first-class HTML files: `index.html`, `portfolio.html`, `songs.html` |
| Data files | `portfolio-data.json` (inventory snapshot), `portfolio-films.json` (screening-room feed; **not wired into UI**) |
| Media | `videos/` (tour + Spec Explorer walkthrough + posters/VTT); `old-site.png`, `newer-site.png` |
| Edge functions | `netlify/functions/ask.js` (Anthropic Haiku Q&A), `feedback.js` (proxy to soma-infer) |
| Shared widgets (CDN) | `soma-manager.js` + optional `soma-owner.js` / `soma-edit.js` from `soma-guide.netlify.app`; feedback CSS/JS from VPS `feedback-svc` |
| License | MIT (Copyright 2026 Mike Wolf) |

**Implication for rebrand:** Ship by editing HTML/CSS/JSON and redeploying Netlify. No framework migration required unless the rebrand *chooses* one. Shared design tokens are copy-pasted CSS `:root` blocks across pages (drift risk).

### Site map (visitor-facing)

```
/  (index.html)          — narrative home: website-as-character
├── #my-story            — origins, Google Sites → 2026 remake
├── #mike                — About Mike + timeline (“The Arc”)
├── #universe            — “Mike Wolf Universe” card grid
├── #contact             — email + external links
├── portfolio.html       — curated project catalog + Spec Explorer video
├── songs.html           — songs/poems Dec 2025–Mar 2026 (Jan’s list)
└── videos/*             — tour + product walkthrough assets
```

Also present but not pages: `rebrand-2026/` (this program), `scripts/sync-portfolio-films.py`, screenshots of prior incarnations.

### Navigation (inconsistent across pages)

| Link | Home | Portfolio | Songs |
|------|------|-----------|-------|
| Home | ✓ active | ✓ | ✓ |
| My Story | ✓ `#my-story` | ✓ `/#my-story` | — |
| About Mike | ✓ `#mike` | ✓ `/#mike` | ✓ |
| Songs | ✓ | ✓ | ✓ active |
| Portfolio | ✓ | ✓ active | **missing** |
| The Universe | ✓ `#universe` | **missing** | **missing** |
| Say Hello | ✓ `#contact` | ✓ `/#contact` | ✓ |

Songs nav labels “Songs & Poems”; home/portfolio use “Songs.” Home uses `href="#"` for Home; portfolio/songs use `/` or `index.html`. Minor polish debt, not brand-breaking.

### Page roles

1. **Home** — long-form essay-site. Single column `max-width: 640px`. Acts I–V in HTML comments. Self-aware narrator + Claude as interlocutor.
2. **Portfolio** — slightly wider (`760px`). Sectioned project grids. Product walkthrough featured above the fold. Owner-edit hooks (`data-soma-editable`, `SomaEditConfig`).
3. **Songs** — archive/catalog. Month dividers, tags, external media links. **No** soma-manager widget (feedback only).

### Interactive / live systems

- **Scroll reveal** — `IntersectionObserver` + `.reveal` / `.visible` on home + portfolio.
- **Tour / walkthrough lightboxes** — `<dialog>` + video, click-to-open only (explicit no-autoplay).
- **SOMA AI Manager** — floating chat persona:
  - Home: name **“The Website”**, greeting: *“Hi! I'm the site. Ask me anything about Mike, what he's building, or SOMA…”*
  - Portfolio: name **“The Portfolio”**, project-aware greeting.
  - Backed by `ask.js` domain-scoped Haiku system prompt.
- **Feedback** — Netlify function + VPS feedback-svc; portfolio also exposes owner-edit / “Suggest a change.”
- **Console easter eggs** (home only): styled `console.log` welcoming source inspectors.

---

## 2. Current brand signals

### Thesis (the one sentence)

> A self-aware website, continuous since 2018, remade in 2026 *with* Claude as collaborator—not replaced—tells Mike’s story while proving human–AI co-creation by being one.

Meta description: *“I am Mike's website. I have existed since 2018. I have recently met Claude, an AI, and together we have rebuilt me.”*

### Tone of copy

| Register | Where | Example |
|----------|--------|---------|
| **Website voice** — warm, slightly vain, philosophical, affectionate | Home body, copper voice blocks | *“I love you, Claude!”* / *“I was one of the lucky few ideas that my author acted on”* |
| **Claude voice** — careful, meta, collaborative dignity | Teal voice blocks | *“Mike didn't ask me to ‘build a website.’ He introduced me to you… and asked me to help you evolve.”* |
| **Human biography** — plain, dense, lightly comic | About Mike | *“a possibilist… good outcomes are not certain, but they are possible”* |
| **JTS deadpan** — absurd product names as if enterprise | Portfolio JTS / Lovable / Bolt | *“Zero revenue. Maximum amusement.”* / *“The name is the pitch.”* |
| **Intimate / grief-honest** | Timeline, songs | *“Grief and gratitude, inseparable.”* / Bobbi songs and Jan poems |
| **Jan as co-curator** | Songs | *“This page is her list, made navigable.”* |

Humor modes: self-reference, fourth-wall, enterprise parody, toilet-seat songs next to elegies, *“His favorite band is Gogol Bordello. That may tell you a lot about him.”*

### Visual style

**Palette** (shared CSS vars):

| Token | Hex / value | Role |
|-------|-------------|------|
| `--bg` | `#faf8f4` | Warm paper |
| `--ink` | `#1a1a2e` | Near-navy body |
| `--warm` | `#3d2c1e` | Serif body text |
| `--copper` | `#b87333` | Website brand / accents / active nav |
| `--teal` | `#2a9d8f` | Claude / secondary / links |
| `--muted` / `--light` | greys | Meta, footers |

**Typography:**

- **Literata** — display + long-form body (literary essay feel)
- **Outfit** — UI/nav/sans
- **JetBrains Mono** — labels, years, section kicker (`h3` uppercase tracking)

**Layout:** Essay column, not marketing hero. Fixed frosted nav (`backdrop-filter: blur(12px)`). Cards: white surface, 1px rule borders, copper hover lift. Voice blocks = left border + tinted wash (copper vs teal).

**Imagery:** Almost none beyond old screenshots, video posters, and type. No photo of Mike on home. Brand is *word + system color*, not photography.

### Self-referential mechanics (load-bearing brand tech)

1. **Website as first person** — “I am Mike's website!” / version 4 footer.
2. **Two-voice dialogue** — Website (copper) ↔ Claude (teal).
3. **Continuity over reboot** — *“Not replaced — remade… But I am still me.”*
4. **HTML comments as character** — *“Hello. I am the source code… I have been rewritten. I am better now.”*
5. **Console address to developers.**
6. **Tour video that describes the site in third person** while the site narrates liking that: *“I get described in the third person. It's strange, and I like it.”*
7. **Living AI widget** as the voice continuing after the essay ends.
8. **Reader-as-co-author lineage** — metanovel, *You (The Reader)*, mirrored in feedback/ask affordances.

### Interaction patterns

- Smooth scroll + soft fade-up reveals
- Card hover (border copper, `translateY(-2px)`)
- Dialog video lightboxes (tour, Spec Explorer)
- External-link universe/project cards (new tab)
- Floating SOMA manager + site feedback
- Portfolio owner-edit path (Mike/SOMA, not public narrative)

---

## 3. What's working / load-bearing (must keep spirit of)

These are the brand kernel. Rebrand should evolve them, not sand them off.

1. **Self-aware continuity** — The 2018→2019→2026 arc with screenshots. Proof of *entity*, not product churn.
2. **Website ↔ Claude dialogue** — Embodies Silicon Children / co-creation without a manifesto dump at the top.
3. **“Remade not replaced”** — Explicit anti-disposable-AI framing; matches SOMA/Silicon Children doctrine.
4. **Possibility + humor + grief** in one About section without collapsing into either TED-talk or joke-only.
5. **Universe card map** — Serious (ESR, Silicon Children) and absurd (JTS, metanovel) as *feature not bug*.
6. **Footer as character** — *“I am mike-wolf.com, version 4… My essence is unchanged… favorite band is still Gogol Bordello.”*
7. **Show-don’t-tell video** — Site tour + Spec Explorer walkthrough align with SOMA app-standard tour pattern.
8. **Jan’s curatorial voice on Songs** — Human co-presence; not only AI collab.
9. **Portfolio footer thesis** — *“Joint human-AI work is the whole story — that's not a footnote, it's the point.”*
10. **Warm paper / copper / teal / Literata** — Already a coherent, ownable visual system; rebrand can heighten, not throw away.

---

## 4. What's dated, thin, or conflicted

### Structural / product debt

| Issue | Detail |
|-------|--------|
| **`portfolio-data.json` not driving the UI** | Hand-authored HTML grids vs JSON inventory (41 rows; ~37 published, 4 unpublished). CLAUDE.md implies coupling; runtime does not load the JSON. Drift inevitable. |
| **`portfolio-films.json` unused** | Two public films (SOMA explainer, Legends tour) + sync script; **no Screening Room section** on portfolio.html. Dead capability. |
| **Portfolio = tool dump after a strong open** | Philosophy/SOMA sections are sharp; Lovable (11) + Bolt (24) become long link farms. Tool-first sectioning (“Built with Lovable/Bolt”) undercuts *why* and *who for*. |
| **Spec Explorer featured but not in catalog sections** | Hero walkthrough has no matching project card or deep link in Philosophy/SOMA/Client grids. |
| **Nav inconsistency** | Songs omits Portfolio; Portfolio/Songs omit Universe. Weakens multi-page “one character, many rooms.” |
| **Songs lacks Website/Claude voice** | Clean archive; brand thesis almost disappears after the Jan note. |
| **CSS triplication** | Same design system pasted thrice — rebrand will thrash if not extracted. |
| **Dual feedback paths** | Netlify `feedback` function *and* VPS `feedback-svc` scripts; easy to confuse which is canonical. |
| **Ask-system prompt drift** | `ask.js` still defines SOMA as *“Shared Orchestration & Memory Architecture”* while estate/SOMA canon moved to *Society of Minds Aligned* (and related redefinition). Also: *“born 1955”* vs home *“83 years old”* — ages don’t align (2026 − 1955 ≈ 71). Fix before the widget becomes a lying narrator. |

### Tone / content thin spots

| Issue | Detail |
|-------|--------|
| **Thin positioning language on many cards** | From JSON raw prompts: *“im wanting to start a new project”*, *“Build a parody e-commerce site called mushroom madness.”* Portfolio rewrites some into witty blurbs; others remain name-only energy (*macho-glue*, *condommints*). |
| **YeshID vs Yeshie** | Portfolio lists “YeshID Landing Page” (IAM startup). Estate glossary: Yeshie ≠ YeshID. Fine if intentional client work; easy to confuse visitors inside Mike’s universe. |
| **AI-WTF dual homes** | `ai-wtf.org` + `ai-wtf.lovable.app` both appear — second-home story is explained once; still looks like duplicate inventory. |
| **Serious/sacred next to fart memecoin** | On purpose (JTS), but without stronger framing sections, first-time visitors may not know which “Mike” they’re meeting. Universe cards help; portfolio scroll can undo it. |
| **Privacy / intimacy on Songs** | Toilet-seat jokes, Bobbi elegies, Jan love poems are brand-true *and* intimate. Rebrand should be intentional about what’s public, not accidental. |
| **“970+ posts” / age claims** | Living stats age poorly; “83” + unrenamed “70 Years Old. WTF!” is a joke *if* ages stay consistent. |
| **Google Sites screenshots** | Essential for continuity; look dated by design. Keep as *artifacts*, not visual identity. |
| **No face, no logo, no mark** | Works for essay-site; thin for roaming-avatar / video-collaborator rebrand goals (RALPH mission). |

### Conflicted brand stories (pick or reconcile)

1. **Is the homepage the Website, or Mike?** Copy oscillates: *“He's the interesting one, really”* vs title *Who is Mike?* vs footer *I am mike-wolf.com*.
2. **Claude vs Dee** — Home says Claude; portfolio says *Dee (Claude)*. Fine for insiders; outsiders need one primary public name + optional alias.
3. **SOMA acronym** — Widget/docs lag estate rename.
4. **Portfolio as proof of volume vs proof of thesis** — Volume (86 Bolt projects, 24 live) is impressive *and* dilutes the Silicon Children signal.

---

## 5. How portfolio, songs, and videos relate to the homepage thesis

### Homepage thesis (recap)

The site is a **continuous self-aware entity** that introduces Mike, points at creations, amuses/informs, and models **human–AI collaboration with continuity**.

### `portfolio.html` — “What we've *built*”

- **Supports thesis when:** Opening credits joint work with Dee/SOMA; Philosophy & Community + SOMA Ecosystem sections; JTS as intentional absurdity; footer *joint work is the point*; Spec Explorer *show-don’t-tell* of real capability.
- **Weakens thesis when:** Tool-sourced sections (Lovable/Bolt) read like an app-store dump; no Website narrator; Spec Explorer orphaned; films JSON unused; little fourth-wall spice.
- **Relationship:** Portfolio is the **proof pile**. Home is the **soul**. Currently soul points weakly at proof (Universe has Songs but Portfolio is nav-only; Portfolio doesn’t echo “I am the website”).

### `songs.html` — “Mike's *Songs & Poems*”

- **Supports thesis when:** Range (love, loss, Bogota rap, toilet seat) matches *serious + absurd as feature*; Jan as human collaborator mirrors Claude as silicon collaborator; *January 27* / Bobbi material gives weight the jokes need.
- **Weakens thesis when:** Almost no self-referential site voice; no Claude; no link back into Silicon Children / SOMA; nav doesn’t complete the site graph.
- **Relationship:** Songs is the **heart register** of the Universe card “Music.” Home promises *Suno, YouTube, and the middle of the night* — Songs delivers that promise literally.

### `videos/`

| Asset | Role vs thesis |
|-------|----------------|
| `tour-visitor-2026-07-03.mp4` + poster/VTT | Meta: site describes being described. Peak fourth-wall. |
| `spec-explorer-walkthrough.mp4` + captions | Competence: not only jokes — real product craft. |
| `portfolio-films.json` targets (SOMA explainer, Legends tour) | Would deepen SOMA/priority-app story; **currently not on-page**. |

Videos are the rebrand’s natural home for **roaming avatar + video-box collaborator** (RALPH) without abandoning essay DNA.

---

## 6. Existing CLAUDE.md / AGENTS.md guidance

### `CLAUDE.md` (canonical; last_reviewed 2026-06-23)

- District: `personal-sites`; status active; capabilities: netlify, netlify-functions, soma-manager.
- Framing: *“Mike's personal portfolio site (mike-wolf.com), a ‘self-aware website’ narrating Mike + Claude's collaboration.”*
- Work surfaces: `index.html`, `portfolio.html` (+ `portfolio-data.json`), `songs.html`, soma-manager pattern, `netlify/functions/`.
- **Skill gaps called out:** shared deploy skill for static+Netlify district; shared soma-manager widget skill (copy-pasted across personal-sites).
- **Gotchas:** pure static; `SomaManagerConfig`; endpoints `/.netlify/functions/{ask,feedback}`.

### `AGENTS.md`

- One line: *See CLAUDE.md — single source of context for this repo.*

### `rebrand-2026/RALPH.md`

- Mission: map AMG visual-brand methodology onto Mike; **self-referential, fourth-wall-breaking** site; **roaming avatar + video-box collaborator characters**.
- This audit is queue item **R2**.

**Guidance implication:** Keep self-aware collaboration thesis; rebrand is allowed to grow interaction design beyond three static pages, but estate still treats the site as static+Netlify unless skills/architecture change.

---

## 7. Live site notes (inferred from source + live fetch)

Verified 2026-07-12 against:

- https://mike-wolf.com  
- https://mike-wolf.com/portfolio  
- https://mike-wolf.com/songs  

| Observation | Note |
|-------------|------|
| **Live ≈ source** | Home narrative, portfolio sections, songs archive match repo HTML. |
| **Deploy model works** | No build step; Netlify serves root HTML cleanly. |
| **Pretty paths** | Live serves `/portfolio` and `/songs` (not only `.html`); internal links mix `portfolio.html`, `songs.html`, and `/#…`. |
| **Tour + Spec Explorer** | Present on live home/portfolio. |
| **External universe links** | ESR, Substack, siliconchildren.org, JTS, AI-WTF, Amazon metanovel — live in markup. |
| **Widget / feedback** | Scripts present on home + portfolio; songs has feedback-svc only. Runtime health of Haiku key / VPS not verified in this pass. |
| **CDN dependency** | `soma-guide.netlify.app` + `vpsmikewolf.duckdns.org` — live brand depends on those staying up. |

No separate “marketing site” vs “repo site” fork observed: **repo is the site.**

---

## 8. `portfolio-data.json` skim — list & positioning language

**Shape:** Array of project objects: `name`, `slug`/`id`, `url`, `custom_domain`, `description`, `published`, `http_status`, `source` (`lovable` | `bolt` | `netlify`), `checked` (mostly `2026-06-12`).

**Rough counts:** ~41 entries; **37** `published: true`; **4** unpublished (Ink Stories, Abdul's Spice Routes, Beary Bubble Timer, Shadow Strength Empire).

### Source mix (positioning by *how built*)

- **Lovable** — chat-to-app parody/business/personal (Mushroom Madness, Abdul’s, macho-glue, condommints, sienaisnine, Free Will Folly, etc.). Descriptions often *prompt residue*: *“I want to build a website for abdul's cooking business.”*
- **Bolt** — larger set; many still carry Bolt boilerplate description: *“Starter project for Node.js, a JavaScript runtime built on Chrome's V8…”* — useless for public positioning; HTML cards paper over this with human blurbs.
- **Netlify** — e.g. Fund for Catholic Genius (satire with strong deadpan HTML copy).

### Positioning spectrum (useful for rebrand clustering)

| Cluster | Examples | Language energy |
|---------|----------|-----------------|
| Philosophy / advocacy | Silicon Children, AI-WTF, Free Will Folly, One and Many | Kinship, elders, free will, unity/multiplicity |
| SOMA / tools | Izzy, Playmaker, SOMA Review, Spec Explorer (video only) | Infrastructure, dramaturgy, review loops |
| Client / community | Legends, Lutomski, Joy of Internet, Greg Foster sites | Belonging, craft, civic, sports transitions |
| JTS / parody | FartCoin, Schlokta/OKTA memes, Honey Truth, Condom Mints | Zero revenue, enterprise honesty, name-is-the-pitch |
| Personal / family | junekittay, sienaisnine, songs ecosystem | Care, nine-ness, love |

**Rebrand opportunity:** Drive portfolio from structured data with **curated blurb + cluster + “why this exists”**, not tool vendor. Keep tool as a filter chip, not primary H2.

---

## 9. Recommendations — “spice” on secondary pages

Fit: **fourth-wall / AI-collaborator brand** without turning Songs or Portfolio into another full essay clone.

### Portfolio spice

1. **Open with a micro voice-block** — Website: *“These are the things my author and his silicon collaborators made. I am not all of them. I am proud of most of them.”* Claude/Dee: one dry line about curation vs hoarding.
2. **Cluster by *why*, not *which AI IDE*** — Philosophy · Companions · Clients · JTS · Experiments. Tool (Lovable/Bolt) as badge.
3. **Wire `portfolio-films.json`** — “Screening Room” with SOMA explainer + Legends tour; Website can say *“I also show movies now.”*
4. **Adopt Spec Explorer into a card** — Don’t strand the best proof asset.
5. **“Probably shouldn’t be public” footnote** becomes a joke section — *The Vault of Things That Shipped Anyway* with 3 teaser titles, not 24 equal cards.
6. **Portfolio persona in the widget** already exists — deepen with project-aware lines and refusal jokes (*“I don’t rank FartCoin against Silicon Children. That’s Mike’s job.”*).
7. **Hover / card easter eggs** — occasional mono caption *“Ship status: amused”* on JTS cards.

### Songs spice

1. **Website usher intro** — *“I do not sing. I host the ones who do.”* Keep Jan’s note as teal human co-voice.
2. **Claude footnote on one AI-collab track** — e.g. *January 27* already links a Claude conversation; frame it as co-writing without stealing authorship.
3. **Mood filters** — Love / Grief / Travel / Toilet & other true things — fourth-wall: *“Yes, those are real categories.”*
4. **Nav parity** — Add Portfolio + Universe so Songs feels like a room in the house, not a detached Substack export.
5. **Optional tiny player chrome** that still links out to Suno — “I refuse to host audio; bandwidth is undignified for a page of my breeding.” (on-brand vanity)
6. **Soma-manager on Songs** — persona *“The Songbook”* or keep *The Website* with music-scoped system prompt.

### Cross-page spice (avatar / video-box — RALPH-aligned)

1. **Same two characters everywhere** — Website (copper) + Collaborator (teal). Avatar can roam; video-box plays tour clips / project walkthroughs in-context.
2. **Console greetings on all pages** — Portfolio: *“You opened the workshop.”* Songs: *“You opened the night pages.”*
3. **Version line** — Footer version token shared; secondary pages admit *“I am a wing of version 4.”*
4. **Don’t over-animate** — Current restraint (reveal + hover) is adult. Spice = *voice* and *selective* motion, not confetti.
5. **Preserve intimacy gates** — Songs can remain quieter; spice ≠ volume.

### What not to do

- Don’t kill the essay home for a generic “founder OS” landing.
- Don’t make every page a joke; grief and ACIM/martial-arts seriousness are part of the brand.
- Don’t rename away “I am Mike’s website” without a stronger first line.
- Don’t let portfolio volume shout over Silicon Children / ESR / love-story spine.

---

## 10. Priority fixes before or during rebrand

| Priority | Fix |
|----------|-----|
| P0 | Align **age / birth year** and **SOMA definition** in `ask.js` with public copy and SOMA-STATE |
| P0 | Nav graph: every page links Home · Story · Mike · Songs · Portfolio · Universe · Contact |
| P1 | Either **render `portfolio-data.json`** or stop treating it as source of truth; same for **films** |
| P1 | Re-section portfolio by thesis clusters; demote tool vendors |
| P1 | Add Website/Claude micro-voices to Portfolio + Songs |
| P2 | Extract shared CSS / tokens |
| P2 | Single feedback pipeline documentation |
| P2 | Spec Explorer + Screening Room as first-class portfolio media |

---

## 11. One-page judgment for the rebrand team

**What you have:** A rare personal site with a durable literary device (self-aware page + AI interlocutor), a coherent warm-print visual system, and real proof surfaces (portfolio, songs, video) that already live.

**What the rebrand must protect:** Continuity, two-voice dialogue, remade-not-replaced, serious/absurd range, Jan + Claude as different kinds of co-authors, copper/teal dual brand.

**What the rebrand must fix:** Secondary pages that go quiet or dump links; data/UI disconnect; narrator fact drift; missing avatar/video character system that RALPH wants; portfolio structure that argues “I use AI tools” louder than “we build a universe together.”

**North star line already on the site (keep or evolve, don’t discard):**

> *Joint human-AI work is the whole story — that's not a footnote, it's the point.*

---

*End of audit · file: `rebrand-2026/research/current-site-audit.md` · RALPH R2*
