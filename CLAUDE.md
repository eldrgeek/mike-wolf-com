---
district: personal-sites
status: active
capabilities: [netlify, netlify-functions, soma-manager]
last_reviewed: 2026-06-23
---

# mike-wolf-com — Mike's personal portfolio site (mike-wolf.com), a "self-aware website" narrating Mike + Claude's collaboration

**Where work happens:** `index.html` · `portfolio.html` (+ `portfolio-data.json`) · `songs.html` · `soma-manager.js` (the embedded AI-manager widget) · `netlify/functions/`

**Skills**
- gap: a shared `deploy-astro-netlify-site` skill — static-HTML + Netlify-functions deploy is repeated across the whole personal-sites district
- gap: a shared `soma-manager-widget` skill — `soma-manager.js` + `netlify/functions/{ask,feedback}` is copy-pasted into several sites here

**Depends on / used by:** standalone static site. Shares the SOMA AI-manager widget pattern with `silicon-children` and `ai-wtf`.

**Gotchas**
- Pure static — `netlify.toml` has empty build command, `publish = "."`. Edit HTML directly; no build step.
- `soma-manager.js` reads `window.SomaManagerConfig`; endpoints default to `/.netlify/functions/{ask,feedback}` which must exist on the deployed site.
