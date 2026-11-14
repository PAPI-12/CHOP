/**
 * Exercise skeleton mode on the About page.
 *
 * `tsc` and `vite build` cannot see any of this: whether a section is showing
 * its surface or its structure is component state, and the switch is a
 * click handler. This mounts the real page, throws every switch, and asserts
 * what each section is showing in both states.
 *
 * The beats:
 *   1. four sections start on their surface, and every switch reads off
 *   2. the hero switch swaps the photograph for the bones
 *   3. the practice switch outlines the display type and draws the
 *      construction lines under it
 *   4. the experience switch outlines the roles and grows the spine
 *   5. the switches are independent — throwing one does not move another
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
  import About from '../../src/pages/About';

  const root = createRoot(document.getElementById('root')!);
  (window as any).pageTest = {
    mount: () => flushSync(() => root.render(
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
window.HTMLMediaElement.prototype.play = function () { return Promise.resolve(); };
window.HTMLMediaElement.prototype.pause = function () {};
window.HTMLCanvasElement.prototype.getContext = () => null;
Object.defineProperty(window.document, 'fonts', { value: { ready: Promise.resolve(), check: () => true }, configurable: true });
window.addEventListener('error', (e) => errors.push('window error: ' + (e.error?.stack || e.message)));
const origError = window.console.error;
window.console.error = (...a) => { errors.push('console.error: ' + a.map(String).join(' ').slice(0, 300)); origError(...a); };

window.eval(bundle);

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const doc = window.document;

const switches = () => [...doc.querySelectorAll('button[role="switch"]')];
const byLabel = (text) => switches().find((b) => (b.getAttribute('aria-label') || '') === text);
const click = (el) => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
/** the hero plate, whichever of the two it is currently showing */
const heroImg = () => doc.querySelector('img[src*="about-hero"]');
const ruleCount = () => doc.querySelectorAll('.skel-rule').length;
const spineCount = () => doc.querySelectorAll('.skel-spine').length;
const nodeCount = () => doc.querySelectorAll('.skel-node').length;
const outlined = () => [...doc.querySelectorAll('.skel-stroke')];
const h3s = () => [...doc.querySelectorAll('h3')];
/** the five practice titles, which exist as DOM regardless of scroll state */
const skillTitle = (t) => h3s().find((h) => h.textContent.replace(/ /g, ' ').trim() === t);
const roleTitle = (t) => h3s().find((h) => h.textContent.trim() === t);

await wait(120);
try {
  window.pageTest.mount();
  await wait(400);

  // ── beat 1: every section starts on its surface ──────────────────────
  assert.equal(switches().length, 4, 'all four sections carry a switch');
  assert.ok(
    switches().every((s) => s.getAttribute('aria-checked') === 'false'),
    'every switch starts off — the page opens on the surface',
  );
  assert.ok(
    switches().every((s) => s.getAttribute('role') === 'switch'),
    'the switches announce themselves as switches, not plain buttons',
  );
  assert.ok(
    /about-hero-idle/.test(heroImg().getAttribute('src')),
    'the hero idles on the photograph',
  );
  assert.equal(outlined().length, 0, 'nothing is outlined at rest');
  assert.equal(ruleCount(), 0, 'no construction lines at rest');
  assert.equal(spineCount(), 0, 'no spine at rest');
  assert.equal(nodeCount(), 0, 'no nodes at rest');

  console.log('PASS  four sections start on the surface, every switch reads off');

  // ── beat 2: the hero swaps the photograph for the bones ──────────────
  click(byLabel('Skeleton mode for the hero'));
  await wait(120);
  assert.equal(byLabel('Skeleton mode for the hero').getAttribute('aria-checked'), 'true',
    'the hero switch reads on');
  assert.ok(
    /about-hero-skeleton/.test(heroImg().getAttribute('src')),
    `the hero now idles on the bones plate, got ${heroImg().getAttribute('src')}`,
  );

  console.log('PASS  the hero switch swaps the photograph for the subject\'s bones');

  // ── beat 3: the practice outlines its type and draws the rules ───────
  click(byLabel('Skeleton mode for What I Do'));
  await wait(150);
  assert.equal(byLabel('Skeleton mode for What I Do').getAttribute('aria-checked'), 'true',
    'the practice switch reads on');
  const ux = skillTitle('UX/UI DESIGN');
  assert.ok(ux, 'the practice titles are on the page');
  assert.ok(ux.className.includes('skel-stroke'), 'the skill title is outlined');
  assert.equal(ux.style.color, 'transparent', 'the fill has been taken away');
  assert.equal(ux.style.getPropertyValue('--skel-stroke').trim(), '#f5f3ee',
    'the stroke keeps the skill\'s own colour');
  // Three construction lines: cap, x-height, baseline.
  assert.equal(ruleCount(), 3, 'cap, x-height and baseline are drawn');

  console.log('PASS  the practice switch outlines the type and draws the construction lines');

  // ── beat 4: experience grows a spine and outlines the roles ──────────
  click(byLabel('Skeleton mode for Experience'));
  await wait(150);
  assert.equal(byLabel('Skeleton mode for Experience').getAttribute('aria-checked'), 'true',
    'the experience switch reads on');
  const role = roleTitle('UI/UX Designer');
  assert.ok(role, 'the roles are on the page');
  assert.ok(role.className.includes('skel-stroke'), 'the role is outlined');
  assert.equal(role.style.color, 'transparent',
    'the role fill is taken away inline, not left to the cascade');
  assert.equal(spineCount(), 1, 'the list grows one spine');
  assert.equal(nodeCount(), 8, 'one node per entry');

  console.log('PASS  the experience switch outlines the roles and grows a spine with a node per entry');

  // ── beat 5: the switches are independent ─────────────────────────────
  // The hero, practice and experience are on; the CTA must still be off.
  assert.equal(byLabel('Skeleton mode for the closing section').getAttribute('aria-checked'),
    'false', 'throwing one section does not move another');
  assert.equal(switches().filter((s) => s.getAttribute('aria-checked') === 'true').length, 3,
    'exactly the three that were thrown are on');

  // Throw the hero back off: the photograph returns and nothing else moves.
  click(byLabel('Skeleton mode for the hero'));
  await wait(120);
  assert.ok(/about-hero-idle/.test(heroImg().getAttribute('src')),
    'switching the hero back restores the photograph');
  assert.equal(ruleCount(), 3, 'the practice lines survive the hero switching back');
  assert.equal(nodeCount(), 8, 'the experience nodes survive the hero switching back');

  // Everything off again: the page is back exactly where it started.
  for (const s of ['Skeleton mode for What I Do', 'Skeleton mode for Experience']) {
    if (byLabel(s).getAttribute('aria-checked') === 'true') click(byLabel(s));
  }
  await wait(150);
  assert.equal(outlined().length, 0, 'all off: nothing is outlined');
  assert.equal(ruleCount(), 0, 'all off: no construction lines');
  assert.equal(spineCount(), 0, 'all off: no spine');
  assert.equal(nodeCount(), 0, 'all off: no nodes');
  assert.equal(switches().filter((s) => s.getAttribute('aria-checked') === 'true').length, 0,
    'every switch reads off again');

  console.log('PASS  the switches are independent and every section returns to its surface');
} finally {
  assert.deepEqual(errors, [], 'no runtime errors or warnings: ' + errors.join(' | '));
  window.close();
}
