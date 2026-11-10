/**
 * Exercise the About hero title sequence and the takeover that goes with it.
 *
 * `tsc` and `vite build` cannot see any of this: the sequence is a chain of
 * timers and rAF callbacks that only resolves at runtime, and the takeover
 * depends on the player's own phase reaching the page. This mounts the real
 * components, lets the sequence actually run against the clock, and asserts
 * what is on the board at each beat — including that the board grows, since
 * SKELETON UP (11) becomes UNLOCK SKELETON (15) and a fixed-width flip would
 * silently drop the tail.
 */
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const fixture = `
  import { StrictMode } from 'react';
  import { createRoot } from 'react-dom/client';
  import { flushSync } from 'react-dom';
  import { MemoryRouter } from 'react-router-dom';
  import AboutHeroTitle from '../../src/components/AboutHeroTitle';
  import About from '../../src/pages/About';

  const unlocks = [];
  const root = createRoot(document.getElementById('root')!);
  (window as any).titleTest = {
    unlocks,
    mountTitle: () => flushSync(() => root.render(
      <StrictMode><AboutHeroTitle onUnlock={() => unlocks.push('unlock')} /></StrictMode>
    )),
    mountPage: () => flushSync(() => root.render(
      <StrictMode><MemoryRouter><About /></MemoryRouter></StrictMode>
    )),
  };
`;

const bundle = (await build({
  stdin: { contents: fixture, loader: 'tsx', resolveDir: fileURLToPath(new URL('.', import.meta.url)) },
  bundle: true, write: false, format: 'iife', jsx: 'automatic',
  loader: { '.css': 'empty' },
  define: { 'process.env.NODE_ENV': '"development"' },
  logLevel: 'error',
})).outputFiles[0].text;

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'https://papi.example/about', pretendToBeVisual: true, runScripts: 'outside-only',
});
const { window } = dom;
const errors = [];
window.matchMedia = (q) => ({
  media: q,
  matches: /pointer: fine|hover: hover|min-width/.test(q) && !/reduce/.test(q),
  onchange: null, addListener() {}, removeListener() {},
  addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false; },
});
window.IntersectionObserver = class { constructor(cb){ this.cb = cb; } observe(el){ this.cb([{ isIntersecting: true, target: el, intersectionRatio: 1 }], this); } unobserve(){} disconnect(){} takeRecords(){ return []; } };
window.ResizeObserver = class { observe(){} unobserve(){} disconnect(){} };
window.requestIdleCallback = (cb) => window.setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 5 }), 0);
window.cancelIdleCallback = (id) => window.clearTimeout(id);
// Record plays rather than failing on jsdom's unimplemented play().
const plays = [];
window.HTMLMediaElement.prototype.play = function () { plays.push(this); return Promise.resolve(); };
window.HTMLMediaElement.prototype.pause = function () {};
window.HTMLCanvasElement.prototype.getContext = () => null;
Object.defineProperty(window.document, 'fonts', { value: { ready: Promise.resolve(), check: () => true }, configurable: true });
window.addEventListener('error', (e) => errors.push('window error: ' + (e.error?.stack || e.message)));
const origError = window.console.error;
window.console.error = (...a) => { errors.push('console.error: ' + a.map(String).join(' ').slice(0, 300)); origError(...a); };

window.eval(bundle);

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const doc = window.document;

/** what the board is actually showing, tile by tile */
const board = (word) => {
  const flap = doc.querySelector(`[aria-label="${word}"]`);
  // Faces render a non-breaking space, which String#trim would strip and
  // which would silently collapse 'SKELETON UP' into 'SKELETONUP'.
  return flap
    ? [...flap.querySelectorAll('[data-face]')].map((s) => (s.textContent || '').replace(/\u00A0/g, ' ')).join('')
    : null;
};
const tiles = (word) => doc.querySelectorAll(`[aria-label="${word}"] [data-face]`).length;

await wait(120);
try {
  // ── the sequence itself ───────────────────────────────────────────────
  window.titleTest.mountTitle();
  await wait(250);

  assert.equal(board('ARCHITECTURE'), 'MAAAADNESSS', 'beat 1: the board opens on MAAAADNESSS, not on the target');
  assert.equal(board('UNLOCK SKELETON'), 'SKELETON UP', 'beat 1: the tail of the line reads SKELETON UP');
  const btn = () => doc.querySelector('button[aria-label]');
  assert.equal(btn().disabled, true, 'the control is inert while it is still flipping');

  // Sampled mid-flap-1: the second word must not have started moving yet.
  // (The gap between the two flips is only 250ms, far too narrow to sample
  // reliably, so prove the ordering here instead.)
  await wait(1250);
  assert.equal(board('UNLOCK SKELETON'), 'SKELETON UP', 'beat 2: SKELETON UP holds while the display word flaps');

  // Beat 2 — MAAAADNESSS flaps into ARCHITECTURE, and the board grows by one.
  await wait(1050);
  assert.equal(board('ARCHITECTURE'), 'ARCHITECTURE', 'beat 2: MAAAADNESSS has flapped into ARCHITECTURE');
  assert.equal(tiles('ARCHITECTURE'), 'ARCHITECTURE'.length, 'the board grew to fit ARCHITECTURE');

  // Beat 3 — no pull-back any more: both words hold their ground. The
  // display word carries the lime and the bottom copy stays bone and still.
  // The colour sits on the tile faces, not on the flap's root span.
  const bigFace = doc.querySelector('[aria-label="ARCHITECTURE"] [data-face]');
  assert.ok(/d7ff4f/.test(bigFace.className), 'beat 3: the display word carries the lime');
  const bottomLeft = [...doc.querySelectorAll('h1 span')].find((n) => n.textContent.trim() === 'OF ART BUILT FROM THE');
  assert.ok(bottomLeft, 'the rest of the line sits bottom-left');
  assert.ok(/f5f3ee/.test(bottomLeft.className), 'the bottom copy is bone, not lime');
  assert.ok(!/blur/.test(bottomLeft.getAttribute('style') || ''), 'the bottom copy does not recede — the pull-back beat is gone');

  // Beat 4 — SKELETON UP flaps into UNLOCK SKELETON (11 -> 15 tiles).
  await wait(2400);
  assert.equal(board('UNLOCK SKELETON'), 'UNLOCK SKELETON', 'beat 4: SKELETON UP has flapped into UNLOCK SKELETON');
  assert.equal(tiles('UNLOCK SKELETON'), 'UNLOCK SKELETON'.length, 'the board grew to fit all 15 tiles');
  assert.equal(btn().disabled, false, 'the control is live once it has finished flipping');

  btn().dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  // The array is constructed inside the jsdom realm, so compare its
  // contents (deepStrictEqual would fail on the differing prototype).
  assert.deepEqual([...window.titleTest.unlocks], ['unlock'], 'clicking UNLOCK SKELETON starts the film');
  console.log('PASS  the display word flaps to ARCHITECTURE and the last word starts the film');

  // ── the takeover on the real page ─────────────────────────────────────
  window.titleTest.mountPage();
  await wait(5200);
  const unlock = doc.querySelector('button[aria-label="Unlock skeleton — play the x-ray sequence"]');
  assert.ok(unlock, 'the real About page exposes UNLOCK SKELETON as a control');
  assert.equal(unlock.disabled, false, 'the control is live on the real page');

  const copy = doc.querySelector('.will-change-\\[opacity\\,transform\\]');
  assert.ok(parseFloat(copy.style.opacity) > 0.5, 'the hero copy is up before the film runs');

  plays.length = 0;
  unlock.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  await wait(200);
  const video = doc.querySelector('video');
  assert.ok(video, 'the page carries the sequence player');
  assert.equal(plays.length, 1, 'clicking UNLOCK SKELETON calls play() on the sequence');

  video.dispatchEvent(new window.Event('playing'));
  await wait(200);
  assert.ok(parseFloat(copy.style.opacity) < 0.05, 'the film takes the hero over: the copy clears while it runs');

  video.dispatchEvent(new window.Event('ended'));
  await wait(200);
  assert.ok(parseFloat(copy.style.opacity) > 0.5, 'the furniture comes back when the film ends');

  // The hero was stripped back to match the homepage: only the nav is
  // constant, everything else that was About-only decoration is gone.
  const hero = doc.querySelector('section');
  const heroText = hero.textContent || '';
  for (const gone of ['Fig. 01', 'Johannesburg', 'Practising since', 'JHB \u00B7 SA', 'About Me', 'design that moves people', 'Art comes 1st']) {
    assert.ok(!heroText.includes(gone), `the hero no longer carries "${gone}"`);
  }
  assert.ok(!/\+/.test(heroText.replace(/\s/g, '')), 'the corner registrations are gone');
  console.log('PASS  clicking it runs the film, the hero copy clears for the takeover, and returns on ended');
  console.log('PASS  the hero is stripped back to the photograph, the headline and the nav');
} finally {
  assert.deepEqual(errors, [], 'no runtime errors or warnings: ' + errors.join(' | '));
  window.close();
}
