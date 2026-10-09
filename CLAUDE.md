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

**Live edit (SOMA §17 / §17a) — added 2026-08-10**
- `index.html` and `songs.html` run the current standard engine: `js/live-edit.js`
  + `js/soma-auth.js` + `netlify/functions/copy-canonize.mjs`. Visit with
  `?edit=1`, sign in as an app admin (`is_app_admin('mike-wolf-com')` — the DB
  is asked, there is no email allow-list), click a sentence, type, Enter.
  **Make canonical** rewrites the string in the HTML file itself via the GitHub
  API; within seconds the push-to-deploy webhook (below) copies master to the
  public site and a logged-out visitor reads it from static HTML. The row goes straight to `retired` — here the page *is* the
  source, so it has genuinely caught up.
- **Two editors live in this repo.** `portfolio.html` and `agi/index.html` still
  run the older `soma-edit.js` from soma-guide (DOM-selector-keyed, files into
  `site_copy_edits`, gate was always cosmetic — see `soma-edit-unlock.js`'s own
  header). It is NOT wired on those pages; two editors on one page would fight
  over the same nodes. The standard's adoption policy says §17 is not a
  retrofit sweep, so they adopt on their next substantial rebuild. Known seam.
- `js/live-edit.js` is **byte-identical** to
  `mike-wolf-library/public/js/live-edit.js`. Everything site-specific is in the
  `window.SOMA_LIVE_EDIT` config the page sets, and the route→file map lives in
  the canonize function. If the two engine files differ, one of them is wrong.
- Anonymous visitors load none of it: the bootstrap at the bottom of
  `index.html` makes zero requests unless `?edit=1`/`#edit`, a sticky opt-in
  flag, or an existing SOMA Auth session is present. Measured: 10 requests, 0
  to supabase.co.

**Where the public site is served from (since 2026-09-07): the VPS, not Netlify**
- `mike-wolf.com` and `www` resolve to the VPS (217.77.6.197). nginx
  (`/etc/nginx/sites-enabled/mike-wolf-com`) serves static files from
  `/var/www/mike-wolf-com`, and proxies only `/.netlify/functions/*` and
  `/api/copy-canonize` to the Netlify project `mike-wolf-com`, which still runs the
  functions and still deploys on every push (nobody browses it).
- **Push to master = deploy, in about 5 seconds.** A GitHub webhook posts each push
  to the estate's `git-deploy` receiver on the VPS (SOMA-APP-STANDARD §20a;
  `~/Projects/_estate/vps/git-deploy/`), which runs
  `/opt/mike-wolf-com-sync/mike-wolf-com-sync.sh`: fetch master into a mirror clone,
  rsync it into the web root. The same script runs from cron every 30 minutes as the
  reconcile loop, in case a webhook delivery is lost. Source of the script:
  `~/Projects/_estate/vps/mike-wolf-com-sync.sh`; proof log
  `/opt/mike-wolf-com-sync/logs/sync-proof.log`; liveness rows
  `vps.pm2.git-deploy` and `vps.cron.mike-wolf-com-sync`. Do not scp pages to the VPS
  by hand: the next sync overwrites anything that is not in git.
- `soma-owner.js` exists only on the VPS. It carries the shared SOMA owner-gate
  secret, so it is gitignored and the pre-push secret gate refuses it; the sync
  protects it from deletion.

**Gotchas**
- Pure static — no build step. Edit HTML directly; the VPS serves the repo files as they are.
- `soma-manager.js` reads `window.SomaManagerConfig`; endpoints default to `/.netlify/functions/{ask,feedback}` which must exist on the deployed site.
- `netlify env` on this account cannot set **scoped** env vars ("Upgrade your Netlify account to set specific scopes"); `GITHUB_TOKEN` is set unscoped via the API. `netlify env:set` also has no `--stdin`, so redirect its output and verify by fingerprint only.
