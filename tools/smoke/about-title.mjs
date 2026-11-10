/**
 * Exercise the About hero title sequence and the takeover that goes with it.
 *
 * `tsc` and `vite build` cannot see any of this: the sequence is a chain of
 * timers and rAF callbacks that only resolves at runtime, and the takeover
 * depends on the player's own phase reaching the page. This mounts the real
 * components, lets the sequence actually run against the clock, and asserts
 * what is on the board at each beat — including that the board grows, since
 * MADNESS (7) becomes SKELETON (8) and a fixed-width flip would silently drop
 * the tail.
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

  // ARCHITECTURE is plain type now; the only board is SKELETON, and it opens
  // on MADNESS.
  assert.equal(board('SKELETON'), 'MADNESS', 'beat 1: the board opens on MADNESS, not on the target');
  const arch = [...doc.querySelectorAll('h1 span')].find((n) => n.textContent.trim() === 'ARCHITECTURE');
  assert.ok(arch, 'ARCHITECTURE is on the board');
  assert.equal(doc.querySelectorAll('[aria-label="ARCHITECTURE"]').length, 0,
    'ARCHITECTURE is plain type — the split-flap moved to SKELETON');
  const upLock = doc.querySelector('[aria-label="UP"]');
  assert.ok(upLock, 'the headline ends in the U+P lockup');
  // Three layers: U behind, P over it, and a clipped U woven back in front.
  // Without the clip the two letters merely stack, which is not a lockup.
  const [uEl, pEl, weave] = upLock.children;
  assert.equal(uEl.textContent.trim(), 'U', 'the lockup is built from a U');
  assert.equal(pEl.textContent.trim(), 'P', '...and a P');
  assert.ok(/-ml-/.test(pEl.className), 'the P is pulled into the U');
  assert.ok(weave && /clip-path/.test(weave.className), 'a clipped U weaves back in front of the P');
  assert.ok(/1\.3em/.test(uEl.className), 'the U is the bigger of the two');
  assert.equal(doc.querySelectorAll('h1 button').length, 0, 'the headline carries no control — the film runs from the player');
  assert.equal(doc.querySelectorAll('h1 [aria-hidden].bg-\\[\\#d7ff4f\\]').length, 0,
    'no rule between the rows');
  // The tree: the width of each row, not the size of its type, is what has
  // to grow — the rows differ hugely in length. jsdom has no Tailwind
  // stylesheet, so the vw figure is read off the class and multiplied by the
  // row's width in em to get the rendered width.
  const W = { A:.72,B:.72,C:.72,D:.78,E:.62,F:.6,G:.78,H:.78,I:.32,J:.5,K:.72,L:.58,
    M:.92,N:.78,O:.82,P:.68,Q:.82,R:.72,S:.66,T:.62,U:.76,V:.72,W:.98,X:.68,Y:.66,Z:.62,' ':.34 };
  const em = (t) => (t === 'UP'
    ? W.U * 1.3 + W.P - 0.57                        // the woven lockup
    : [...t].reduce((a, c) => a + (W[c] ?? 0.62), 0) - 0.04 * t.length);
  const tierOf = (el) => {
    const m = /text-\[clamp\([^,]+,([\d.]+)vw/.exec(el.className);
    return m ? parseFloat(m[1]) : NaN;
  };
  const row = (t) => [...doc.querySelectorAll('h1 span')].find((n) => n.textContent.trim() === t);
  const upEl = doc.querySelector('[aria-label="UP"]');
  const upParent = upEl.parentElement;
  const rows = [
    ['THE', row('THE')],
    ['ARCHITECTURE', arch],
    ['ART BUILT', row('ART BUILT')],
    ['FROM THERE', row('FROM THERE')],
    // SKELETON is the flap board, so the size class sits on the board's own
    // root rather than on the row wrapper around it.
    ['SKELETON', doc.querySelector('[aria-label="SKELETON"]')],
    ['UP', upParent],
  ];
  for (const [label, el] of rows) assert.ok(el, `the ${label} row is rendered`);
  const width = ([label, el]) => em(label) * tierOf(el);
  for (let i = 1; i < rows.length - 1; i += 1) {
    const [below, w] = [rows[i][0], width(rows[i])];
    const above = width(rows[i - 1]);
    assert.ok(w > above, `${below} (${w.toFixed(1)}) is wider than ${rows[i - 1][0]} (${above.toFixed(1)})`);
  }
  // UP is the stem: a trunk hanging under the base, so narrower than it.
  const stem = width(rows[5]);
  assert.ok(stem < width(rows[4]), `UP (${stem.toFixed(1)}) is narrower than SKELETON — it is the stem`);
  assert.equal(upParent.nextElementSibling, null, 'UP is the last row');
  assert.ok(upParent.compareDocumentPosition(row('SKELETON')) & 2, 'SKELETON precedes UP in the document');

  // Beat 2 — MAAAADNESSS flaps into ARCHITECTURE, and the board grows by one.
  await wait(2300);
  assert.equal(board('SKELETON'), 'SKELETON', 'beat 2: MADNESS has flapped into SKELETON');
  assert.equal(tiles('SKELETON'), 'SKELETON'.length, 'the board grew to fit SKELETON');

  // Beat 3 — no pull-back any more: both words hold their ground. The
  // display word carries the lime and the bottom copy stays bone and still.
  // The colour sits on the tile faces, not on the flap's root span. The
  // hierarchy is the homepage hero's, read top to bottom: display word bone,
  // lead tan, closing word lime.
  const skelFace = doc.querySelector('[aria-label="SKELETON"] [data-face]');
  assert.ok(/d7ff4f/.test(skelFace.className), 'beat 3: SKELETON has settled lime');
  assert.ok(/f5f3ee/.test(arch.className), 'ARCHITECTURE is bone');
  assert.ok(/d7ff4f/.test(arch.className) === false, 'ARCHITECTURE is not lime — lime is the closing word');
  const leadLines = [...doc.querySelectorAll('h1 span')].filter(
    (n) => n.textContent.trim() === 'ART BUILT' || n.textContent.trim() === 'FROM THERE',
  );
  assert.equal(leadLines.length, 2, 'the rest of the line is set as display lines, not a caption');
  const bottomLeft = leadLines[0];
  assert.ok(/d7c4aa/.test(bottomLeft.className), 'the lead is tan');
  assert.equal(doc.querySelectorAll('[data-face]').length, 'SKELETON'.length,
    'only SKELETON is a split-flap board — every other row is plain type');
  assert.ok(!/blur/.test(bottomLeft.getAttribute('style') || ''), 'the bottom copy does not recede — the pull-back beat is gone');

  console.log('PASS  the tree: six rows widening downward, UP the stem, no rule');

  // ── the takeover on the real page ─────────────────────────────────────
  window.titleTest.mountPage();
  await wait(2400);
  const unlock = [...doc.querySelectorAll('button')].find((b) => /X-ray mode/i.test(b.textContent || ''));
  assert.ok(unlock, 'the player exposes its own control');
  assert.ok(doc.querySelector('[aria-label="UP"]'), 'the shipped hero ends in the U+P lockup');

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
  console.log('PASS  the player control runs the film, the hero copy clears for the takeover, and returns on ended');
  console.log('PASS  the hero is stripped back to the photograph, the headline and the nav');
} finally {
  assert.deepEqual(errors, [], 'no runtime errors or warnings: ' + errors.join(' | '));
  window.close();
}
