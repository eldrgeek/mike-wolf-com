/*
 * soma-ai-door.js — SOMA-APP-STANDARD.md §19, "The AI door"
 *
 * Behavioral half of the standard: a visitor with a trusted AI copies a
 * portable prompt to hand it, built from the page's own facts (never
 * invented). Styling is left to each host page's own stylesheet (`.ai-door*`
 * classes) — this file only wires the toggle/copy interaction and fills in
 * the template. Vendored per property today; centralize to the
 * soma-guide.netlify.app CDN (alongside soma-feedback.js / soma-edit.js) once
 * a second adopter beyond this repo needs it unmodified.
 *
 * Markup contract (one or more per page):
 * <div class="ai-door" data-app-name="…" data-pitch="…" data-host-human="…"
 *      data-host-ai="…" data-url="…">
 *   <button class="ai-door-toggle" type="button">…</button>
 *   <div class="ai-door-panel" hidden>
 *     <pre class="ai-door-prompt"></pre>
 *     <button class="ai-door-copy" type="button">Copy prompt</button>
 *     <span class="ai-door-copied" aria-live="polite"></span>
 *   </div>
 * </div>
 */
(function () {
  function buildPrompt(cfg) {
    return (
      "You know me — my interests, my work, the people and ideas I care about. I found this:\n\n" +
      cfg.appName + " — " + cfg.pitch + "\n" +
      "Hosted by " + cfg.hostHuman + " and " + cfg.hostAi + ", an AI colleague, not a chatbot.\n" +
      cfg.url + "\n\n" +
      "Before I read further: based on what you actually know about me — not politeness, not a " +
      "guess at what I want to hear — does this look like something that fits me? Say so plainly, " +
      "including if it doesn't. Point to something specific and real about me that led to your " +
      "answer, not a generic reason that would apply to anyone.\n\n" +
      "If it looks like a fit, help me decide what to do next."
    );
  }

  function wire(root) {
    var toggle = root.querySelector(".ai-door-toggle");
    var panel = root.querySelector(".ai-door-panel");
    var promptEl = root.querySelector(".ai-door-prompt");
    var copyBtn = root.querySelector(".ai-door-copy");
    var copiedEl = root.querySelector(".ai-door-copied");
    if (!toggle || !panel || !promptEl || !copyBtn) return;

    var cfg = {
      appName: root.dataset.appName || document.title,
      pitch: root.dataset.pitch || "",
      hostHuman: root.dataset.hostHuman || "",
      hostAi: root.dataset.hostAi || "",
      url: root.dataset.url || window.location.href,
    };
    var text = buildPrompt(cfg);
    promptEl.textContent = text;

    toggle.addEventListener("click", function () {
      var willOpen = panel.hasAttribute("hidden");
      if (willOpen) {
        panel.removeAttribute("hidden");
      } else {
        panel.setAttribute("hidden", "");
      }
      toggle.setAttribute("aria-expanded", String(willOpen));
    });

    copyBtn.addEventListener("click", function () {
      var done = function (ok) {
        if (copiedEl) {
          copiedEl.textContent = ok ? "Copied — paste it to your AI." : "Couldn't copy — select the text above.";
        }
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
      } else {
        done(false);
      }
    });
  }

  function init() {
    var roots = document.querySelectorAll(".ai-door[data-app-name], .ai-door[data-url]");
    for (var i = 0; i < roots.length; i++) wire(roots[i]);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
