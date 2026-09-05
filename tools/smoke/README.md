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
- `run.mjs` — clicks an internal link and asserts the matrix page transition
  actually commits the new route.
- `video.mjs` — asserts **zero** iframes exist before a play button is pressed,
  that the player then loads from `youtube-nocookie.com` with a referrer policy,
  and that `prefers-reduced-motion` navigates instantly.
- `audi.mjs` — opens the campaign-film modal and checks the case-study copy.
- `regressions.mjs` — named guards for behaviour that was reported broken: the
  hero renders one image and no `<picture>` switch, the wordmark always lands on
  the hero and never mid-page, no matrix canvas is portalled loose onto `<body>`,
  and the transition panel carries the code only when the homepage is one end of
  the journey.

`bundle.js` is generated and git-ignored.
