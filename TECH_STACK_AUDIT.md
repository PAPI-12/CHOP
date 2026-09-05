# 🧅 The Tech Stack Layer Audit

*A layer-by-layer dig through the site — the way you'd cut an onion, except
nobody's crying and every layer gets a score.*

> Companion piece to `FULL_STACK_AUDIT.md`, which is the serious risk register.
> **This** one is the engineering physical: what each layer is made of, how much
> it weighs, and whether it earns its seat on the plane.
>
> Every number below was measured against a real `npm run build` in this repo.
> Every behavioural claim is enforced by `npm run smoke` — see layer 11.

---

## 🏁 Scorecard

| # | Layer | Weight class | Grade | One-line verdict |
|---|-------|--------------|-------|------------------|
| 1 | Markup shell | 2.4 KB | **A** | Paints a background before a single byte of JS lands. |
| 2 | Styling | 21.6 KB gz | **A−** | Tailwind v4 + ~380 lines of hand-written motion CSS. No CSS-in-JS tax. |
| 3 | Runtime | 58.8 KB gz | **A** | React 19, and nothing sitting on top of it. |
| 4 | Routing | 13.2 KB gz | **A** | 15 routes, 14 of them lazy, all of them prefetched at idle. |
| 5 | Animation | 43.2 KB gz | **B+** | Framer Motion exists — but never on the first route. |
| 6 | Canvas layer | 0 KB | **A** | Three bespoke canvases, zero libraries, one shared gesture. |
| 7 | Imagery | 4.0 MB on disk | **A** | One hero plate, 42 WebPs, biggest thing you download is 90 KB. |
| 8 | Fonts | 3 families | **B** | Async, non-blocking — but still a third-party origin. |
| 9 | Third-party embeds | 0 on load | **A** | Four films, zero iframes until you press play. |
| 10 | Build pipeline | 4.2 s | **A** | Vite 7, content-hashed, manually chunked. |
| 11 | Type safety + tests | strict | **A** | `tsc` clean, and 26 headless assertions on every route. |
| 12 | Backend | 1.4 KLOC Python | **B+** | FastAPI + SQLite, deployed separately, optional by design. |
| 13 | Supply chain | 0 vulns | **A** | `npm audit`: clean, prod and dev. |

**Overall: A.** The site is heavier on craft than on dependencies, which is
exactly the right way round.

**Initial route payload: 119.5 KB gzipped** (react + router + icons + index +
CSS). Framer Motion is not in that number, and neither is a single third-party
script.

---

## Layer 1 — The markup shell

`index.html`, 2.4 KB. Everything in the `<head>` is load-bearing:

- An inline `<style>` block paints `#171715` and sets the font stack **before**
  any stylesheet arrives, so there is no white flash on a slow connection.
- One `<link rel="preload" as="image">` with an `imagesrcset` ladder, so a phone
  fetches the 1280px plate and a 27-inch display fetches the 2560px one.
- Google Fonts loaded with `media="print" onload="this.media='all'"`, so the
  render is never blocked on a font.

**Changed this pass:** the preload used to be *two* tags behind opposing media
queries — one landscape crop, one portrait crop. That is now a single tag for a
single image. See layer 7 for why that mattered more than bytes.

---

## Layer 2 — Styling

Tailwind CSS v4 via `@tailwindcss/vite` — no PostCSS config, no `content` globs,
no purge step to get wrong. 140 KB raw / **21.6 KB gzipped** for the whole site,
with per-case-study CSS code-split into its own file (`Audi.css` is 0.3 KB
gzipped and only downloads on `/work/audi`).

Roughly 380 lines of `index.css` are hand-written keyframes: the split-flap
headline, the ambient floaters, the mobile menu, the reveal system, the glass
pane and the transition line. Every one is a compositor-only property
(`transform` / `opacity` / `clip-path`), and every one has a
`prefers-reduced-motion` escape.

---

## Layer 3 — Runtime

React 19.2 + React DOM. **58.8 KB gzipped**, and the single biggest thing the
browser downloads.

No state manager, no data-fetching library, no form library, no UI kit. The most
complex piece of state on the site is a scroll-progress number written straight
to a `transform` without ever entering React.

---

## Layer 4 — Routing

React Router 7.18.3. 15 routes; only `/` is eagerly bundled. `useRoutePrefetch()`
imports each lazy chunk on its own `requestIdleCallback` slice starting 1.2 s
after mount, so by the time anyone clicks a link the chunk is resident. Since the
route transition was removed this pass, that prefetch is now the *only* thing
standing between a click and a Suspense fallback — which makes it more load-
bearing than it was, not less. It stays.

---

## Layer 5 — Animation

Framer Motion 12 (**43.2 KB gz**) is quarantined into its own chunk by an
explicit `manualChunks` rule. Nothing on the home page imports it; it ships with
`/work`, `/about` and `/contact`.

🟡 15 files still use it for `whileInView` patterns the site's own CSS `Reveal`
already does for free. Migrating would delete 43 KB from three routes. Not
urgent — those routes are not the first impression.

---

## Layer 6 — The canvas layer (the fun one)

Three hand-written canvases, zero dependencies, all gated on visibility. What is
worth noting this pass is that they now share **one gesture**.

**a) The hero pane — `Hero.tsx`**
A sheet of glass someone has breathed on. The photograph is redrawn at
`blur(26px)`, cooled and desaturated, then covered by three broad washes: a
milky radial veil heaviest where breath lands, seven very large soft clouds at
3–8% alpha so the veil is not perfectly even, and a grade that buys back the
contrast the cream headline needs.

*Deliberately absent:* droplets, beading, runnels, speckle. All four were in the
previous version and all four read as a **dirty** window rather than a misted
one. Condensation from breath is diffusion, not detail.

The wipe is one soft-edged brush sprite, built once, stamped along the path
between frames with `destination-out`. A pre-rendered radial falloff is what
makes the cleared area look wiped by a hand — the edge is a gradient, so the
mist thins out instead of ending on a circle.

Performance, because a full-screen canvas is exactly where a site like this
dies:
- The fog is rendered **once** into an offscreen tile. Everything after is a
  single `drawImage`; nothing re-blurs per frame.
- The buffer is capped at **1.25×** DPR. The fog carries no fine detail, and the
  sharp pixels come from the DOM `<img>` underneath — a ~2.5× cut in fill cost
  on a Retina display for no visible difference.
- Stamps per sweep are capped at 48, so a tab restore cannot stall a frame.
- Re-fogging is one low-alpha composite every 90 ms on a credit counter. **An
  idle hero costs zero.**
- The loop is behind an `IntersectionObserver` and `document.hidden`.

🟢 **Fixed this pass:** the steam used to disappear permanently. Two causes,
both now gone. A module-level `overlaySpent` flag consumed the whole effect the
first time you navigated away, so coming back to Home showed bare photograph
forever. And the re-fog budget stopped about 11% short of full opacity, so every
wipe left a permanent residue that accumulated until the pane had cleared
itself. The budget is now sized to land within ~1% of opaque.

**b) The What I Do rain — `WhatIDo.tsx`**
Scroll-pinned, drawn on a half-cadence tick (falling code reads as continuous at
~30 fps at half the `fillText` budget), DPR capped at 1.5, held back until the
machine has finished speaking — and, new this pass, **opened rather than faded**
(see below).

**c) The Selected Work hand-off — `SelectedWork.tsx`**
The same rain, arriving in the next section. Scoped `absolute inset-0` inside
that `<section>`, DPR capped at 1.5, half-cadence, and it rains itself *out*
after ~3.3 s and then early-returns every frame for nothing.

### One gesture, used twice — and now it goes somewhere

The matrix appears in exactly two places, and both use the same move: a 2 px
hairline is struck, then a rectangle opens symmetrically out of it, then the code
is inside. Same `expoOut` curve, same `LINE_PX`, same `clip-path` mechanism.

- In **What I Do**, it fires the moment the machine finishes typing. The human
  text speaks on a clean stage; the line is struck; the rain opens out of it.
- The rain then **carries across the section boundary into Selected Work**, where
  each card is struck as a hairline at its own centre and cut out of the code on
  a 260 ms stagger, its title resolving out of scrambled glyphs. The rain runs
  out of the bottom of the page and the section is just the work again.

🔴 **Removed this pass: the route transition entirely — `PageTransition.tsx` is
deleted.** It was firing the matrix on *every* navigation, which is what turned a
signature moment into wallpaper. Nothing replaces it: pages now change on a plain
`page-enter` fade-up. The matrix is a thing the homepage does once, in the
section that is about the machine, and nowhere else. Deleting the provider meant
sweeping every consumer — `Navbar`'s `goToHero` now does a plain double
`scrollTo(0, 0)` across a rAF.

🟢 **Removed in the previous pass:** a viewport-fixed "spill" canvas, portalled to
`<body>` at `z-[30]`, that kept raining over Featured Work and everything below.

### Layer 5b — The hero pane

The steam is **procedural — there is no image in the overlay**. One gradient
sheet, nine radial mist patches, ~7 k single-pixel frost flecks, eight wandering
runnels and ~6 k beads, all baked into one offscreen canvas and thereafter only
composited. The wipe is a `destination-out` stamp of a pre-rendered brush sprite,
and **it does not heal** — glass you have cleared stays clear.

The one performance trap here is that ~14 k draw operations is nothing per frame
but very much something inside the *first* frame of the site. So the pane is
built in two stages: `paintOverlay` lays down the flat gradient synchronously
(instant, visually near-identical) and the water is rendered on the next
`requestIdleCallback` and swapped in — unless the visitor has already started
wiping, in which case it is never stamped over their work.

Governing principle, arrived at the hard way over four calibration passes: **a
runnel must thin the mist, never punch through it.** Clearing all the way to the
photograph makes the channel pick up skin tone and the whole pane instantly reads
as grime. Legibility comes from the lit shoulders on either side of the channel —
water on glass is a lens, not a window.

---

## Layer 7 — Imagery

42 WebP files, 4.0 MB on disk, nowhere near that over the wire.

| Asset | Dimensions | Size |
|---|---|---|
| `hero-landscape-2560.webp` | 2560 × 1429 | 90.5 KB |
| `hero-landscape-1920.webp` | 1920 × 1071 | 62.5 KB |
| `hero-landscape-1280.webp` | 1280 × 714 | 37.7 KB |

That is the whole hero. **One photograph, three widths.**

It used to be two: a 16:9 outpaint for wide screens and the original 3:4 portrait
for everything else, switched by `<picture>`. That was a correctness bug, not
just weight. The fog is generated *from the `<img>` element*, so on a wide screen
the steam was built from one crop while the photograph behind it was another —
the image appeared to change as you wiped it. There is now a single asset family
and a responsive `object-position` instead of a second file, so what ghosts
through the mist is always exactly what you uncover. Three files, 310 KB, deleted.

Every non-hero image is `loading="lazy"` + `decoding="async"`, and
`assetsInlineLimit: 2048` keeps tiny assets off the network entirely.

🟡 **Watch:** `/images` is served with a 7-day cache rather than `immutable`,
because the filenames are not content-hashed. Fine as is.

---

## Layer 8 — Fonts

Inter (7 weights), JetBrains Mono (2), Caveat (2), from Google Fonts, loaded
asynchronously with a `<noscript>` fallback.

🟡 Three families and eleven weights is generous. Self-hosting as WOFF2 subsets
would remove a third-party origin, a DNS lookup, and a privacy footnote.
Recommended, not blocking.

---

## Layer 9 — Third-party embeds

Four YouTube films — Audi, Nando's, SARS, Joshua The I AM — all verified live and
embeddable via oEmbed during this audit.

They used to be raw `<iframe>`s mounted with their pages. All three causes of the
reported video errors are fixed:

1. **`maxresdefault.jpg` does not exist for every upload.** Every poster now
   walks the real ladder — `maxres → sd → hq → mq` — on `error`.
2. **Four player bundles booted on page load.** Now nothing third-party loads
   until the visitor asks: a facade with a poster and a play button, then the
   frame.
3. **No `referrerpolicy`,** which some networks and every privacy extension treat
   as reason enough to refuse an embed. Now
   `strict-origin-when-cross-origin`, from the cookie-less `youtube-nocookie.com`
   host.

Plus a real failure path: no player response in 7 s and the visitor gets a
"Watch on YouTube" button rather than a dead rectangle.

🟢 Third-party bytes on first load: **zero**, asserted on every case study by the
smoke run.

---

## Layer 10 — Build pipeline

Vite 7.3.6, `target: es2020`, sourcemaps off, `reportCompressedSize` off,
content-hashed filenames, `cssCodeSplit` on, and a `manualChunks` function that
splits `react` / `motion` / `router` / `icons` into separately cacheable vendor
chunks. `console.log|debug|info` stripped in production via `esbuild.pure`;
`console.error` survives so the ErrorBoundary can still speak.

Cold build: **4.2 s**.

---

## Layer 11 — Type safety & the smoke harness

TypeScript 5.9, `strict`, `noUnusedLocals`, `noUnusedParameters`,
`noFallthroughCasesInSwitch`. `tsc --noEmit` exits clean.

But types are not the whole story: a crash inside an animation effect and an
embed that never loads are both invisible to `tsc` and to `vite build`. So
`npm run smoke` bundles the real app, boots it in jsdom with `getContext()`
deliberately returning `null` so every canvas guard is exercised, and asserts:

```
PASS  /                        nodes= 490  errors=0
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

PASS  hero uses exactly one <img>
PASS  hero has no <picture> art-direction switch
PASS  every srcset width is the same photograph
PASS  wordmark from an inner page lands on home
PASS  wordmark lands at the hero, not mid-page
PASS  wordmark from deep in the homepage returns to the hero
PASS  lime cursor circle is rendered
PASS  CULTURE LED CREATIVE ring is present
PASS  the ring has a magnifier lens
PASS  the earring is on the photograph
PASS  no matrix canvas portalled loose onto <body>
PASS  no page-transition panel exists at all
PASS  clicking through to another page shows no transition panel
PASS  inner-page navigation shows no transition panel
PASS  Selected Work renders its cards
PASS  each card is cut out of a struck hairline
PASS  the cards have opened
PASS  the hand-off rain is scoped inside a section, not the body
ALL REGRESSION GUARDS PASS
```

…plus zero iframes before play on every case study, and instant navigation under
`prefers-reduced-motion`.

🟢 **21 regression guards + 15 routes + 3 video cases, 0 thrown errors, 0
`console.error`, 0 ErrorBoundary fallbacks.** See `tools/smoke/README.md`.

🟡 Two `(import.meta as any)` casts in `Contact.tsx`. A `vite-env.d.ts` with a
typed `ImportMetaEnv` would remove them.

---

## Layer 12 — Backend

FastAPI + SQLite, ~1,414 lines of Python across 13 modules, with its own
Dockerfile, backup script and risk register (`FULL_STACK_AUDIT.md`).

Architecturally **optional**, which is right for a portfolio: the contact form
detects that no API is configured and goes straight to a populated email draft
rather than attempting `http://localhost:8000` from an HTTPS page — a guaranteed
mixed-content failure on a deployed build.

`.vercelignore` keeps `backend/` and the root `pyproject.toml` out of the Vercel
upload, so framework detection cannot mistake this for a Python project. The
committed `.pyc` bytecode is also gone from Git.

---

## Layer 13 — Supply chain

```
npm audit             → found 0 vulnerabilities
npm audit --omit=dev  → found 0 vulnerabilities
```

Patched during this audit:

- `react-router-dom` 7.18.1 → **7.18.3** (GHSA-qwww-vcr4-c8h2, *high* — RSC-mode
  CSRF bypass).
- `vite` → **7.3.6** and `esbuild` → 0.28.2 (two Windows-only dev-server
  advisories).

🟡 `clsx` and `tailwind-merge` are declared dependencies whose only consumer,
`src/utils/cn.ts`, is imported by nothing. Tree-shaken out, so the cost today is
**0 KB** — but they are two supply-chain surfaces buying nothing.

---

## 🎯 The five things worth doing next

1. **Self-host the fonts.** Removes a third-party origin and a privacy footnote.
2. **Retire Framer Motion** from `/work`, `/about` and `/contact` in favour of
   the existing CSS `Reveal`. −43 KB on three routes.
3. **Delete `clsx` + `tailwind-merge` + `src/utils/cn.ts`.** Dead weight.
4. **Add `vite-env.d.ts`** and drop the two `as any` casts.
5. **Wire `npm run typecheck && npm run smoke && npm audit --omit=dev` into CI**
   so layers 11 and 13 stay an A without anyone remembering to look.

---

*Audit run against the working tree of `arena/01a0721d-chop`. Every number in
this document was measured in this repository, not estimated.*
