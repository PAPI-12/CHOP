# 🧅 The Tech Stack Layer Audit

*A layer-by-layer dig through papiraborife.com — the way you'd cut an onion, except
nobody's crying and every layer gets a score.*

> Companion piece to `FULL_STACK_AUDIT.md`, which is the serious risk register.
> **This** one is the engineering physical: what each layer is made of, how much
> it weighs, and whether it earns its seat on the plane.
>
> Measured against the build produced by `npm run build` in this repo — real
> numbers from a real `dist/`, not vibes.

---

## 🏁 Scorecard

| # | Layer | Weight class | Grade | One-line verdict |
|---|-------|--------------|-------|------------------|
| 1 | Markup shell | 2.6 KB | **A** | Paints a background before a single byte of JS lands. |
| 2 | Styling | 22 KB gz | **A−** | Tailwind v4 + ~380 lines of hand-written motion CSS. No CSS-in-JS tax. |
| 3 | Runtime | 60 KB gz | **A** | React 19, and nothing sitting on top of it. |
| 4 | Routing | 13 KB gz | **A** | 15 routes, 14 of them lazy, all of them prefetched at idle. |
| 5 | Animation | 44 KB gz | **B+** | Framer Motion exists — but never on the first route. |
| 6 | Canvas layer | 0 KB | **A** | Three bespoke canvases, zero libraries. |
| 7 | Imagery | 4.3 MB on disk | **A−** | 45 WebPs, responsive `srcset`, biggest hero plate is 92 KB. |
| 8 | Fonts | 3 families | **B** | Async, non-blocking — but still a third-party origin. |
| 9 | Third-party embeds | 0 on load | **A** | Four YouTube films, zero iframes until you press play. |
| 10 | Build pipeline | 4.3 s | **A** | Vite 7, content-hashed, manually chunked. |
| 11 | Type safety + tests | strict | **A** | `tsc` clean, and a jsdom harness that boots all 15 routes. |
| 12 | Backend | 1.4 KLOC Python | **B+** | FastAPI + SQLite, deployed separately, optional by design. |
| 13 | Supply chain | 0 vulns | **A** | `npm audit`: clean, prod and dev. |

**Overall: A−.** The site is heavier on craft than on dependencies, which is
exactly the right way round.

---

## Layer 1 — The markup shell

`index.html`, 2.6 KB.

Everything in the `<head>` is there for a reason:

- An inline `<style>` block paints `#171715` and sets the font stack **before**
  any stylesheet arrives, so there is no white flash on a slow connection.
- Two `<link rel="preload" as="image">` tags, each with its own `imagesrcset`
  and a `media` query, so a phone in portrait fetches the 1300px plate and a
  27-inch display fetches the 2560px one. Neither ever fetches the other.
- Google Fonts loaded with the `media="print" onload="this.media='all'"` trick,
  so the render is never blocked on a font.

🟢 **Finding:** nothing to fix.
🟡 **Watch:** the font `<link>` is still a cross-origin dependency. See layer 8.

---

## Layer 2 — Styling

Tailwind CSS v4 via `@tailwindcss/vite` — no PostCSS config, no `content` globs,
no purge step to get wrong. 141 KB raw / **22 KB gzipped** for the entire site,
with per-case-study CSS code-split into its own files (`audi.css` is 0.67 KB and
only downloads on `/work/audi`).

Roughly 380 lines of `index.css` are hand-written keyframes: the split-flap
headline, the ambient floaters, the mobile menu slide, the reveal system, the
condensation pane, and the page transition. Every one of them is a
compositor-only property (`transform` / `opacity` / `clip-path`).

🟢 **Finding:** no runtime style engine, so no per-render style recalculation.
🟢 **Finding:** every `@keyframes` block has a `prefers-reduced-motion` escape.

---

## Layer 3 — Runtime

React 19.2 + React DOM. **60 KB gzipped**, and that is the single biggest thing
the browser downloads.

There is no state manager, no data-fetching library, no form library, no UI kit.
The most complex piece of state on the site is a scroll-progress number that is
written straight to a `transform` without ever entering React.

🟢 **Finding:** `ScrollProgress` is a raw rAF-throttled listener rather than
Framer Motion's `useScroll` + `useSpring`. That single decision keeps the entire
motion runtime off the home page.

---

## Layer 4 — Routing

React Router 7.18.3. 15 routes; only `/` is eagerly bundled. The other 14 are
`React.lazy` and land in their own chunks (Cornetto 54 KB, TauFoods 99 KB,
Vodacom 34 KB…).

**New in this pass:** `useRoutePrefetch()` walks every lazy route and imports it
one chunk per `requestIdleCallback` slice, starting 1.2 s after mount. By the
time anyone clicks a link the chunk is already resident, so:

- the matrix transition never covers an empty Suspense fallback, and
- no route ever "loads" in front of the visitor.

🟢 **Finding:** first-load JS is `react` + `router` + `icons` + `index`
≈ **125 KB gzipped** including CSS. That is a well-behaved number for a site
with this much motion in it.

---

## Layer 5 — Animation

Framer Motion 12 is in the tree (**44 KB gz**) but it is quarantined into its own
`motion` chunk by an explicit `manualChunks` rule, and nothing on the home page
imports it. It ships with `/work`, `/about` and `/contact`.

🟡 **Finding:** 15 files still import it, mostly for `initial/whileInView/animate`
patterns that the site's own CSS `Reveal` component already does for free.
Migrating those would delete 44 KB from three routes.
**Not urgent — those routes are not the first impression.**

---

## Layer 6 — The canvas layer (the fun one)

Three hand-written canvases, zero dependencies, all of them gated on visibility:

**a) The hero pane — `Hero.tsx`**
A sheet of fogged shower glass in front of the portrait: the same photograph
drawn at `blur(20px)`, cooled and dimmed, then beaded with ~1,400 condensation
droplets and a handful of runnels that have already tracked down the glass.
The cursor ring and every physics-displaced letter squeegee it clear with
`destination-out`; a faint wet rim gets shouldered out to the edge of each
stroke; and because the room is humid, the mist creeps back over anything that
was wiped.

Performance notes, because a full-screen canvas is exactly where a site like
this dies:
- The fog is rendered **once** into an offscreen tile. Every later operation is a
  single `drawImage` — nothing re-blurs per frame.
- The buffer is capped at **1.25×** device pixel ratio instead of 2×. The fog is
  a defocused blur; the sharp pixels come from the DOM `<img>` underneath, so the
  extra resolution was paying for nothing. That is a ~2.5× cut in fill cost on a
  Retina display.
- Re-fogging is one low-alpha composite every 120 ms, on a credit counter that
  stops the work entirely once the pane has recovered. **An idle hero costs
  zero.**
- The whole loop is behind an `IntersectionObserver` and `document.hidden`.

**b) The What I Do rain — `WhatIDo.tsx`**
Scroll-pinned, drawn on a half-cadence tick (falling code reads as continuous at
~30 fps, at half the `fillText` budget), DPR capped at 1.5, and now held back
until the machine has finished speaking.

**c) The transition panel — `PageTransition.tsx`**
Full-viewport rain that only exists for ~1 second at a time. Clipped with
`clip-path: inset()` rather than scaled, so the glyphs keep their true size while
the rectangle opens.

🟢 **Finding:** three non-trivial effects, **0 KB** of library code.

---

## Layer 7 — Imagery

45 WebP files, 4.3 MB on disk, and — crucially — nowhere near that over the wire.

| Asset | Dimensions | Size |
|---|---|---|
| `hero-landscape-2560.webp` | 2560 × 1429 | 92 KB |
| `hero-landscape-1920.webp` | 1920 × 1071 | 64 KB |
| `hero-landscape-1280.webp` | 1280 × 714 | 39 KB |
| `hero-portrait-1700.webp` | 1700 × 2277 | 142 KB |
| `hero-portrait-1300.webp` | 1300 × 1741 | 101 KB |
| `hero-portrait-900.webp` | 900 × 1205 | 66 KB |

A 2560px hero for 92 KB is the headline number here. Every non-hero image is
`loading="lazy"` + `decoding="async"`, and `assetsInlineLimit: 2048` keeps tiny
assets out of the network entirely.

🟢 **Finding:** the old hero plate's out-of-focus brown foreground blob is gone;
both orientations are re-rendered clean, sharp and edge-to-edge.
🟡 **Watch:** `/images` is served with a 7-day cache header rather than
`immutable`, because the filenames are not content-hashed. Fine as is; hash them
if they start changing often.

---

## Layer 8 — Fonts

Inter (7 weights), JetBrains Mono (2), Caveat (2), all from Google Fonts,
loaded asynchronously with a `<noscript>` fallback.

🟡 **Finding:** three families and eleven weights is generous. Self-hosting them
as WOFF2 subsets would remove a third-party origin, remove a DNS lookup, and
remove the privacy footnote from the audit. **Recommended, not blocking.**

---

## Layer 9 — Third-party embeds

Four YouTube films: Audi, Nando's, SARS, Joshua The I AM. All four verified live
and embeddable via the oEmbed endpoint during this audit.

They used to be raw `<iframe>`s mounted with their pages. That is where the
reported video errors came from, and all three causes are now fixed:

1. **`maxresdefault.jpg` does not exist for every upload.** Every poster now
   walks YouTube's real ladder — `maxres → sd → hq → mq` — on `error`, so a tile
   can no longer render as a broken rectangle.
2. **Four player bundles booted on page load,** whether or not anyone pressed
   play. Now nothing third-party loads until the visitor asks: a facade with a
   poster and a play button, then the frame.
3. **No `referrerpolicy`,** which some networks and every privacy extension
   treat as reason enough to refuse an embed. Now
   `strict-origin-when-cross-origin`, matching what YouTube's own oEmbed markup
   returns, and served from the cookie-less `youtube-nocookie.com` host.

Plus a genuine failure path: if the player has not reported back in 7 s, the
visitor gets a "Watch on YouTube" button instead of a dead rectangle.

🟢 **Finding:** third-party bytes on first load: **zero**.

---

## Layer 10 — Build pipeline

Vite 7.3.6, `target: es2020`, sourcemaps off, `reportCompressedSize` off,
content-hashed filenames, `cssCodeSplit` on, and a `manualChunks` function that
splits `react` / `motion` / `router` / `icons` into separately cacheable
vendor chunks.

`console.log`, `console.debug` and `console.info` are stripped from production
via `esbuild.pure` — `console.error` survives, so the ErrorBoundary can still
speak.

Build time: **~4.3 s** cold.

---

## Layer 11 — Type safety & the smoke harness

TypeScript 5.9, `strict: true`, `noUnusedLocals`, `noUnusedParameters`,
`noFallthroughCasesInSwitch`. `tsc --noEmit` exits clean.

🟡 **Finding:** two `(import.meta as any)` casts in `Contact.tsx`. Adding a
`vite-env.d.ts` with a typed `ImportMetaEnv` would remove them.

**But types are not the whole story.** The two failure modes this site is most
exposed to — a crash inside an animation effect, and an embed that never loads —
are invisible to both `tsc` and `vite build`. So this audit left behind a
harness: `npm run smoke` bundles the real app, boots it in jsdom with
`getContext()` deliberately returning `null` so every canvas guard is exercised,
and asserts:

```
PASS  /                        nodes= 491  errors=0
PASS  /work                    nodes= 208  errors=0
PASS  /about                   nodes= 287  errors=0
PASS  /contact                 nodes= 123  errors=0
PASS  /resume                  nodes= 269  errors=0
PASS  /privacy                 nodes=  82  errors=0
PASS  /work/cornetto           nodes= 514  errors=0
PASS  /work/tau-foods          nodes=1506  errors=0
PASS  /work/louis-vuitton      nodes= 202  errors=0
PASS  /work/audi               nodes= 197  errors=0
PASS  /work/nandos             nodes= 377  errors=0
PASS  /work/joshua             nodes= 228  errors=0
PASS  /work/vodacom            nodes= 492  errors=0
PASS  /work/sars               nodes= 160  errors=0
PASS  /does-not-exist          nodes=  61  errors=0

TOTAL ERRORS: 0
```

…plus: a link click really does commit the new route through the matrix panel;
**zero** iframes exist on any case study until a play button is pressed;
`prefers-reduced-motion` navigates instantly with no panel at all.

🟢 **Finding:** 15 routes, 0 thrown errors, 0 `console.error`, 0 ErrorBoundary
fallbacks. See `tools/smoke/README.md`.

---

## Layer 12 — Backend

FastAPI + SQLite, ~1,414 lines of Python across 13 modules, with its own
Dockerfile, backup script and 13-layer risk register (`FULL_STACK_AUDIT.md`).

Architecturally it is **optional**, which is the right call for a portfolio: the
contact form now detects that no API is configured and goes straight to a
populated email draft rather than attempting `http://localhost:8000` from an
HTTPS page — which was a guaranteed mixed-content failure on a deployed build.

🟢 **Finding:** `.vercelignore` keeps `backend/` and the root `pyproject.toml`
out of the Vercel upload, so framework detection cannot mistake this for a
Python project.

---

## Layer 13 — Supply chain

```
npm audit             → found 0 vulnerabilities
npm audit --omit=dev  → found 0 vulnerabilities
```

Patched during this audit:

- `react-router-dom` 7.18.1 → **7.18.3** (GHSA-qwww-vcr4-c8h2, *high* — RSC-mode
  CSRF bypass).
- `vite` 7.3.2 → **7.3.6** and `esbuild` → 0.28.2 (two Windows-only dev-server
  advisories: `server.fs.deny` bypass and an NTLMv2 disclosure via `launch-editor`).

🟡 **Finding:** `clsx` and `tailwind-merge` are declared dependencies whose only
consumer, `src/utils/cn.ts`, is imported by nothing. They are tree-shaken out of
the bundle, so the cost today is **0 KB** — but they are two supply-chain
surfaces buying nothing. Delete when convenient.

🟡 **Finding:** `lucide-react` is pinned at 1.24.0 while 1.41.0 is current. No
advisory, no rush; it is 7 KB in its own chunk.

---

## 🎯 The five things worth doing next

1. **Self-host the fonts.** Removes a third-party origin and a privacy footnote.
2. **Retire Framer Motion** from `/work`, `/about` and `/contact` in favour of
   the existing CSS `Reveal`. −44 KB on three routes.
3. **Delete `clsx` + `tailwind-merge` + `src/utils/cn.ts`.** Dead weight.
4. **Add `vite-env.d.ts`** and drop the two `as any` casts.
5. **Wire `npm run typecheck && npm run smoke && npm audit --omit=dev` into CI**
   so layers 11 and 13 stay an A without anyone remembering to look.

---

*Audit run against the working tree of `arena/01a0721d-chop`. Every number in
this document was measured in this repository, not estimated.*
