/**
 * Exercise the About hero title and the launch that goes with it.
 *
 * `tsc` and `vite build` cannot see any of this: the sequence is a chain of
 * timers and rAF callbacks that only resolves at runtime, and the takeover
 * depends on the player's own phase reaching the page. This mounts the real
 * components, lets the sequence actually run against the clock, and asserts
 * what is on the board at each beat.
 *
 * The beats, in order:
 *
 *   1. the page opens on the new line — ARCHITECTURE / OF ART BUILT FROM THE
 *      / MADNESS / UP — as plain type. No split-flap board exists yet, and
 *      there is no THE row
 *   2. launching locks the U and P and arms the rockets, and the film waits
 *      for the block to clear the frame
 *   3. when the film ends the block comes back down carrying X's
 *   4. the X's land and split-flap into the line — the first time SKELETON
 *      is ever written — and the U and P come apart again
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
      <StrictMode><AboutHeroTitle /></StrictMode>
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

/** what a board is actually showing, tile by tile */
const board = (word) => {
  const flap = doc.querySelector(`[aria-label="${word}"]`);
  // Faces render a non-breaking space, which String#trim would strip and
  // which would silently collapse 'SKELETON UP' into 'SKELETONUP'.
  return flap
    ? [...flap.querySelectorAll('[data-face]')].map((s) => (s.textContent || '').replace(/ /g, ' ')).join('')
    : null;
};

// Advance widths in em for Inter Black uppercase, the same table the
// component's tiles are cut from. jsdom resolves no Tailwind stylesheet, so
// the vw figure is read off the class and multiplied by the row's width in
// em to get the rendered width.
const W = { A:.72,B:.72,C:.72,D:.78,E:.62,F:.6,G:.78,H:.78,I:.32,J:.5,K:.72,L:.58,
  M:.92,N:.78,O:.82,P:.68,Q:.82,R:.72,S:.66,T:.62,U:.76,V:.72,W:.98,X:.68,Y:.66,Z:.62,' ':.34 };
const sum = (t) => [...t].reduce((a, c) => a + (W[c] ?? 0.62), 0);
const em = (t) => (t === 'UP' ? W.U + W.P - 0.34 : sum(t));   // no row carries tracking
const tierOf = (el) => {
  const m = /text-\[clamp\([^,]+,([\d.]+)vw/.exec(el.className);
  return m ? parseFloat(m[1]) : NaN;
};
const rowEl = (t) => [...doc.querySelectorAll('h1 span')].find((n) => n.textContent.trim() === t);
const widthOf = (label, el) => em(label) * tierOf(el);

await wait(120);
try {
  // ── beat 1: the page opens on the new line, as plain type ─────────────
  window.titleTest.mountTitle();
  await wait(250);

  const arch = rowEl('ARCHITECTURE');
  assert.ok(arch, 'ARCHITECTURE is on the board');
  const line = rowEl('OF ART BUILT FROM THE');
  assert.ok(line, 'OF ART BUILT FROM THE is ONE line, not split across rows');
  const madness = rowEl('MADNESS');
  assert.ok(madness, 'the bottom word reads MADNESS before the film has run');
  assert.equal(rowEl('SKELETON'), undefined,
    'SKELETON is not written until the Xs land — it is not on the page yet');
  // THE is gone from the top of the stack.
  const theRow = [...doc.querySelectorAll('h1 > span')].find((n) => n.textContent.trim() === 'THE');
  assert.equal(theRow, undefined, 'the leading THE row has been removed');
  // ...and the old two-row split is gone with it.
  assert.equal(rowEl('OF ART BUILT'), undefined, 'OF ART BUILT is no longer a row of its own');
  assert.equal(rowEl('FROM THE'), undefined, 'FROM THE is no longer a row of its own');

  // No board is mounted yet: the flap belongs to the landing, not the idle.
  assert.equal(doc.querySelectorAll('[data-face]').length, 0,
    'beat 1: nothing is a split-flap board at rest — the line is plain type');

  // The headline: ARCHITECTURE measures the same as SKELETON, and the long
  // line sits a little under both.
  const skelSize = tierOf(madness);                    // MADNESS holds SKELETON's slot
  const wArch = widthOf('ARCHITECTURE', arch);
  const wSkel = em('SKELETON') * skelSize;
  const wLine = widthOf('OF ART BUILT FROM THE', line);
  assert.ok(Math.abs(wArch - wSkel) / wSkel < 0.02,
    `ARCHITECTURE (${wArch.toFixed(1)}) is the same width as SKELETON (${wSkel.toFixed(1)})`);
  assert.ok(wLine < wSkel && wLine > wSkel * 0.8,
    `OF ART BUILT FROM THE (${wLine.toFixed(1)}) is slightly smaller than SKELETON (${wSkel.toFixed(1)})`);

  const upLock = doc.querySelector('[aria-label="UP"]');
  assert.ok(upLock, 'the headline ends in the U+P lockup');
  const [uEl, pEl, weave] = upLock.children;
  assert.equal(uEl.textContent.trim(), 'U', 'the lockup is built from a U');
  assert.equal(pEl.textContent.trim(), 'P', '...and a P');
  assert.equal(pEl.dataset.docked, 'false', 'the P waits clear of the U at rest');
  assert.ok(weave && /clip-path/.test(weave.className), 'a clipped U weaves back in front of the P');
  const scale = (el) => /text-\[([\d.]+)em\]/.exec(el.className)?.[1] ?? '1';
  assert.equal(scale(uEl), scale(pEl), 'the U and the P are the same size');
  assert.equal(doc.querySelectorAll('h1 button').length, 0, 'the headline carries no control');

  // Colour: bone, tan, lime for the closing word, lime for the stem.
  assert.ok(/f5f3ee/.test(arch.className), 'ARCHITECTURE is bone');
  assert.ok(/d7c4aa/.test(line.className), 'the long line is tan');
  assert.ok(/d7ff4f/.test(madness.className), 'MADNESS carries the closing-word lime');

  console.log('PASS  the line: ARCHITECTURE / OF ART BUILT FROM THE / MADNESS / UP, no THE row');

  // ── beats 2-4, on the real page ───────────────────────────────────────
  window.titleTest.mountPage();
  await wait(2400);
  const unlock = [...doc.querySelectorAll('button')].find((b) => /Launch Madness/i.test(b.textContent || ''));
  assert.ok(unlock, 'the player control reads Launch Madness');
  const copy = doc.querySelector('.will-change-\\[opacity\\,transform\\]');
  assert.ok(parseFloat(copy.style.opacity) > 0.5, 'the hero copy is up before the film runs');

  plays.length = 0;
  unlock.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  await wait(300);
  const lockup = () => doc.querySelector('[aria-label="UP"]');
  assert.equal(lockup().dataset.rocket, 'true', 'the U and P become rockets on launch');
  assert.equal(lockup().querySelectorAll('[data-nose="true"]').length, 2,
    'an arrow off the U and one off the P');
  assert.equal(lockup().querySelector('[data-docked]').dataset.docked, 'true',
    'the U and P have come together for the launch');
  const h1 = () => doc.querySelector('h1');
  assert.equal(h1().dataset.launched, 'true', 'the title launches');
  assert.equal(plays.length, 0, 'the film waits for the title to clear');

  await wait(1900);
  const video = doc.querySelector('video');
  assert.ok(video, 'the page carries the sequence player');
  assert.equal(plays.length, 1, 'once the title has cleared, play() runs the sequence');
  // The launch no longer flaps MADNESS into SKELETON, so it still reads
  // MADNESS while the film is running.
  assert.equal(rowEl('MADNESS') !== undefined, true, 'MADNESS holds through the launch');

  video.dispatchEvent(new window.Event('playing'));
  await wait(200);
  assert.ok(parseFloat(copy.style.opacity) < 0.05, 'the film takes the hero over while it runs');

  // ── beat 3: the block comes back down carrying Xs ─────────────────────
  video.dispatchEvent(new window.Event('ended'));
  await wait(400);
  assert.ok(parseFloat(copy.style.opacity) > 0.5, 'the furniture comes back when the film ends');
  assert.equal(h1().dataset.launched, 'false', 'the title returns once the film ends');
  assert.equal(lockup().dataset.rocket, 'false', 'the U and P go back to being letters');
  assert.equal(h1().dataset.revealed, 'false', 'the Xs hold — the flip waits for the block to land');
  const xs = board('SKELETON');
  assert.ok(xs && /^X+$/.test(xs), `beat 3: every row comes down as Xs, got ${JSON.stringify(xs)}`);
  assert.equal(board('ARCHITECTURE'), 'X'.repeat('ARCHITECTURE'.length),
    'ARCHITECTURE comes down as Xs too');
  assert.equal(board('OF ART BUILT FROM THE'), 'X'.repeat('OF ART BUILT FROM THE'.length),
    'the long line comes down as Xs too');

  // ── beat 4: the Xs land and split-flap the line out ───────────────────
  await wait(2600);
  assert.equal(h1().dataset.revealed, 'true', 'the Xs have landed and the flip has run');
  assert.equal(board('ARCHITECTURE'), 'ARCHITECTURE', 'ARCHITECTURE flaps in');
  assert.equal(board('OF ART BUILT FROM THE'), 'OF ART BUILT FROM THE', 'the long line flaps in');
  assert.equal(board('SKELETON'), 'SKELETON',
    'SKELETON appears for the first time, out of the Xs — not out of MADNESS');
  assert.equal(rowEl('MADNESS'), undefined, 'MADNESS is gone once SKELETON has landed');
  // ...and the U and P come apart again, so the stem reads UP.
  assert.equal(lockup().querySelector('[data-docked]').dataset.docked, 'false',
    'the U and P separate back into UP when it lands');
  assert.ok(/d7ff4f/.test(doc.querySelector('[aria-label="SKELETON"] [data-face]').className),
    'SKELETON has settled lime');

  console.log('PASS  the block comes back down as Xs and split-flaps the new layout out');
  console.log('PASS  SKELETON appears only on the landing, and the U and P separate into UP');

  // The hero was stripped back to match the homepage: only the nav is
  // constant, everything else that was About-only decoration is gone.
  const hero = doc.querySelector('section');
  const heroText = hero.textContent || '';
  for (const gone of ['Fig. 01', 'Johannesburg', 'Practising since', 'JHB · SA', 'About Me', 'design that moves people', 'Art comes 1st']) {
    assert.ok(!heroText.includes(gone), `the hero no longer carries "${gone}"`);
  }
  assert.ok(!/\+/.test(heroText.replace(/\s/g, '')), 'the corner registrations are gone');
  console.log('PASS  the hero is stripped back to the photograph, the headline and the nav');
} finally {
  assert.deepEqual(errors, [], 'no runtime errors or warnings: ' + errors.join(' | '));
  window.close();
}
