# Smoke harness

A headless DOM run of the real application bundle. It exists because the two
failure modes this site is most exposed to — a runtime crash inside an
animation effect, and a third-party embed that never loads — are both invisible
to `tsc` and to `vite build`.

```bash
npm run smoke
```

Builds `src/App` with esbuild, boots it in jsdom with the browser APIs jsdom
lacks (`matchMedia`, `IntersectionObserver`, `ResizeObserver`,
`requestIdleCallback`) and `getContext()` deliberately returning `null` so every
canvas guard is exercised, then reports:

- `routes.mjs` — mounts all 15 routes and fails on any thrown error,
  `console.error`, or an ErrorBoundary fallback.
- `run.mjs` — clicks an internal link and asserts the new route renders.
- `video.mjs` — asserts **zero** iframes exist before a play button is pressed,
  that the player then loads from `youtube-nocookie.com` with a referrer policy,
  and that `prefers-reduced-motion` navigates instantly.
- `audi.mjs` — opens the campaign-film modal and checks the case-study copy.
- `regressions.mjs` — named guards for behaviour that was reported broken: the
  hero renders one image and no `<picture>` switch, the wordmark always lands on
  the hero and never mid-page, no matrix canvas is portalled loose onto `<body>`,
  and route changes never display a Matrix transition panel.
- `matrix.mjs` — runs the real What I Do / Selected Work effects with simulated
  scroll geometry, a controlled clock and a recording canvas (rather than a
  null context). Checks desktop and touch, development StrictMode effect replay
  and production, continuous rain after Continue and pin release, pauses and
  reversals within the overlap, the last visible pixel / complete exit boundary,
  clearing the matrix by scrolling back, fast jumps, remounts, pure-black
  backgrounds, reduced motion and the rain-free About variant. Its small test
  bundle is built in memory; no browser install is needed.

- `hero.mjs` — mounts the real Hero in StrictMode and guards the
  one-photograph rain window: a single `<img>` with no canvas pane, earring
  or deferred pane work over it, the CULTURE LED CREATIVE ring's orbit
  layout and pointer follow, responsive ring drop/restore, grain exclusion
  over the photograph, clean touch and reduced-motion modes, and matching
  cover-aware image/preload candidates. Also checks the WebP headers and
  payload sizes; no image processing or browser dependency is required.

`bundle.js` is generated and git-ignored. Run focused checks with
`node tools/smoke/matrix.mjs` or `node tools/smoke/hero.mjs`.
