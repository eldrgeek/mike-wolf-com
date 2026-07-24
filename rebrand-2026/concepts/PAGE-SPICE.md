# Page Spice — Secondary Page Concepts

**Path:** `~/Projects/mike-wolf-com/rebrand-2026/concepts/PAGE-SPICE.md`  
**Role:** Concepts and wiring designs for secondary pages (portfolio, songs, console)  
**Status:** Completed (Ralph Loop Done Criteria 6)  
**Authorship:** Antigravity (Gemini 3.5 Flash) · 2026-07-12 · Mike principal  

---

## 1. Portfolio Page (`portfolio.html`) Spice

The current portfolio page is a catalog of projects. We will transition it into a **collaborative workspace report** using two primary elements:

### A. The "Screening Room" Feed (Wiring `portfolio-films.json`)
Instead of leaving `portfolio-films.json` unwired, we will create a dedicated "Screening Room" section at the top of the portfolio page:
* **The Interface:** A sleek grid featuring the videos from `portfolio-films.json` (the SOMA Explainer and the Legends of Basketball Walkthrough).
* **The Interaction:** Clicking a poster plays the video in the unified lightbox (reusing the lightbox code from `index.html` to keep the code footprint dry).
* **The Spice:** The Website’s voice introduces the room:  
  > *Website (Copper):* "Mike recorded these walk-throughs to prove we actually write code, and that the sites don't just happen by magic."  
  > *Dee (Teal):* "I'm the one who compressed the files."

### B. Project "Ushers" (Dual-Voice Context Blocks)
Every project card will feature a toggle-able or footnote block containing the raw story behind the project:

* **Example Card: JTS (Junior Travel Series)**
  * *Mike (Copper):* "A farce in three acts. I wanted to see if we could write a travel guide for places that don't exist."
  * *Claude (Teal):* "We spent 4 hours arguing about whether a virtual train ticket requires a mock barcode. It does."
* **Example Card: Spec Explorer**
  * *Mike (Copper):* "The tool we actually use to read the workspace layout."
  * *Dee (Teal):* "He uses it because his terminal font size is too large."

---

## 2. Songs Page (`songs.html`) Spice

The songs page holds deep personal meaning but currently lacks navigation parity and brand integration.

### A. The Poetry Review Board (Self-Aware Annotation)
Beside each poem, we will offer a small, expandable margin note or hover card showing a brief "peer review" of the poem:
* **For Poem: "Rifle Mountain Park"**
  * *Website (Copper):* "Written after the breakthrough. Note the focus on progeny."
  * *Dee (Teal):* "The rhythm in stanza three is syncopated, but we left it because he got defensive when I suggested an alternative."
* **For Poem: "The Old Man's Lounge"**
  * *Website (Copper):* "A reflection on aging and curiosity."
  * *Claude (Teal):* "We checked the physics references. They hold up."

### B. Navigation Parity
Add the full header and footer stack to `/songs` to ensure a visitor never gets stranded. The nav link for "Songs" will show as active.

---

## 3. Developer Console & Source Spice

Since a dual audience (humans and future AI scrapers) is a core brand lock, the source code and developer tools should hold content specifically for them.

### A. Console Commands
If a user opens the browser developer console (F12), they are greeted with:
```
✦ Welcome to Mike's Website ✦
I am self-aware. If you want to talk, try these commands in your console:
  > website.status()
  > website.colleagues()
  > website.secret()
```

When run, they execute:
* `website.status()`: Prints a JSON object representing the site's state (uptime, version, model used, Mike's local time).
* `website.colleagues()`: Prints a list of active AI colleagues and their current status:
  * `Dee: "Optimizing assets (idle)"`
  * `Claude: "Polishing prose (idle)"`
* `website.secret()`: Prints a hidden markdown snippet from Mike's second brain or vault.

### B. Hidden HTML comments
Insert structured JSON-LD comments at the bottom of pages for indexing scrapers:
```html
<!--
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "I Am Mike's Website",
  "author": {
    "@type": "Person",
    "name": "Mike Wolf"
  },
  "collaborator": [
    {
      "@type": "SoftwareApplication",
      "name": "Claude",
      "role": "Lead Architect Sprite"
    },
    {
      "@type": "SoftwareApplication",
      "name": "Dee",
      "role": "Asset Optimizer Sprite"
    }
  ]
}
-->
```
