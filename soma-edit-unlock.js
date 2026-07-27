/* soma-edit-unlock.js — turn on in-place editing without needing a sign-in.
 *
 * soma-edit.js (SOMA-APP-STANDARD §17) only mounts for an "editor", which it
 * defines as isAdmin() || isOwner(). On /agi/ the only path to isAdmin() was a
 * live SOMA Auth session whose email matched a hardcoded allowlist — four things
 * (Supabase client, session restore, email match, CDN race) that all had to land
 * before Mike could edit his own sentence. When any one missed, the ✎ bar simply
 * never appeared and there was nothing on screen to say why.
 *
 * This takes the other door: isOwner(). The unlock is a URL flag, remembered in
 * localStorage, so it survives navigation and works signed out.
 *
 *   /agi/?edit=1   unlock, and drop straight into edit mode
 *   /agi/?edit=0   lock again (clears the flag on this browser)
 *
 * Security note, stated plainly rather than implied: this gate was always
 * cosmetic. netlify/functions/feedback.js does not check the Authorization
 * header the page sends — it proxies to soma-infer with a server-side token. So
 * the auth gate never protected the filing endpoint, and unlocking client-side
 * editing gives a visitor nothing they couldn't already do in devtools. What it
 * does NOT do is change what anyone else sees: edits live in this browser's
 * localStorage draft until a build lands them in source.
 */
(function () {
  'use strict';
  if (typeof document === 'undefined') return;

  var KEY = 'soma_edit_owner';
  var q = location.search + location.hash;
  var asked = /[?#&]edit(=1)?\b/.test(q) && !/[?#&]edit=0\b/.test(q);

  try {
    if (/[?#&]edit=0\b/.test(q)) localStorage.removeItem(KEY);
    else if (asked) localStorage.setItem(KEY, '1');
  } catch (_) {}

  var unlocked = false;
  try { unlocked = localStorage.getItem(KEY) === '1'; } catch (_) {}
  if (!unlocked) return;

  /* isOwner() rather than SOMA_IS_ADMIN: the agi page's paintAuth() rewrites
   * SOMA_IS_ADMIN every time the auth state changes and would stomp us back to
   * false the moment it resolves a signed-out session. */
  window.SOMA_EDIT_UNLOCKED = true;
  var prior = window.SomaOwner;
  window.SomaOwner = {
    isOwner: function () { return true; },
    lock: function () {
      try { localStorage.removeItem(KEY); } catch (_) {}
      window.SomaOwner = prior;
      try { window.SomaEdit.exit(); } catch (_) {}
      location.reload();
    }
  };

  /* soma-edit.js is deferred and polls for ~5s; either it finds us or this
   * finds it. Keep signalling until its bar is actually mounted. */
  var tries = 0;
  var iv = setInterval(function () {
    try { window.dispatchEvent(new Event('soma-owner:activated')); } catch (_) {}
    if (window.SomaEdit && window.SomaEdit.isActive()) {
      clearInterval(iv);
      if (asked) { try { window.SomaEdit.enter(); } catch (_) {} }
    } else if (++tries > 40) {
      clearInterval(iv);
    }
  }, 300);
}());
