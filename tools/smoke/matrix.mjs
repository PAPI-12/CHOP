/**
 * Exercise the real rain effects with a clock, scroll geometry and a recording
 * canvas. Null-canvas smoke tests and source-string checks missed the old
 * clipped hand-off and StrictMode consuming the rain before it was visible.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

const fixture = `
  import { StrictMode } from 'react';
  import { createRoot } from 'react-dom/client';
  import { flushSync } from 'react-dom';
  import { MemoryRouter } from 'react-router-dom';
  import WhatIDo, { type MatrixHandoff } from '../../src/components/WhatIDo';
  import SelectedWork from '../../src/components/SelectedWork';

  const handoff = { current: { source: null, active: false } as MatrixHandoff };
  const root = createRoot(document.getElementById('root')!);
  let generation = 0;
  const render = (remount = false) => {
    if (remount) generation++;
    // A fresh projects array deliberately exercises effect re-runs too.
    const projects = ['ONE', 'TWO', 'THREE'].map(title => ({
      title, subtitle: 'DESIGN', image: '/test.webp', link: '/work/' + title,
    }));
    flushSync(() => root.render(
      <StrictMode>
        <MemoryRouter>
          <div key={generation}>
            <WhatIDo variant={(window as any).matrixVariant} matrixHandoffRef={handoff} />
            <SelectedWork projects={projects} matrixHandoffRef={handoff} />
          </div>
        </MemoryRouter>
      </StrictMode>
    ));
  };
  (window as any).matrixTest = {
    handoff, render, unmount: () => flushSync(() => root.unmount()),
  };
  render();
`;

const bundle = async (mode) => (await build({
  stdin: { contents: fixture, loader: 'tsx', resolveDir: fileURLToPath(new URL('.', import.meta.url)) },
  bundle: true, write: false, format: 'iife', jsx: 'automatic', logLevel: 'silent',
  define: { 'process.env.NODE_ENV': JSON.stringify(mode) },
})).outputFiles[0].text;
const [development, production] = await Promise.all([bundle('development'), bundle('production')]);
const css = fs.readFileSync(new URL('../../src/index.css', import.meta.url), 'utf8');
const matrixSurface = css.match(/\.matrix-rain\s*\{[^}]+\}/)?.[0];
assert.ok(matrixSurface, 'rain has an explicit black surface');

function boot({ touch = false, reduce = false, variant = 'home', mode = 'development' } = {}) {
  const dom = new JSDOM(`<!doctype html><style>${matrixSurface}</style><div id="root"></div>`, {
    url: 'https://papi.example/', pretendToBeVisual: true, runScripts: 'outside-only',
  });
  const { window } = dom;
  const doc = window.document;
  const errors = [];
  window.addEventListener('error', (e) => errors.push(String(e.error || e.message)));
  window.console.error = (...args) => errors.push(args.join(' '));
  window.matrixVariant = variant;
  window.matchMedia = (media) => ({
    media, matches: media.includes('reduce') ? reduce : !touch,
    addEventListener() {}, removeEventListener() {},
  });
  window.innerWidth = touch ? 390 : 1440;
  window.innerHeight = 800;
  let now = 100;
  let id = 0;
  let observations = 0;
  const frames = new Map();
  const timers = new Map();
  const observers = new Set();
  const contexts = new Map();
  Object.defineProperty(window.performance, 'now', { value: () => now });
  window.requestAnimationFrame = (fn) => { frames.set(++id, fn); return id; };
  window.cancelAnimationFrame = (key) => frames.delete(key);
  window.setTimeout = (fn, delay = 0) => { timers.set(++id, { at: now + delay, fn }); return id; };
  window.clearTimeout = (key) => timers.delete(key);

  const sourceTop = 1600;
  const source = () => doc.querySelector('[data-matrix-active]');
  const height = () => source()?.style.height === 'auto' ? 500 : parseFloat(source()?.style.height || '0');
  const rect = (top, h) => new window.DOMRect(0, top, window.innerWidth, h);
  window.HTMLElement.prototype.getBoundingClientRect = function () {
    const top = sourceTop - window.scrollY;
    if (this === source()) return rect(top, height());
    if (this === source()?.firstElementChild) {
      const h = Math.max(window.innerHeight, 480);
      return rect(Math.min(Math.max(0, top), top + height() - h), h);
    }
    if (this.tagName === 'SECTION') return rect(top + height(), touch ? 2400 : 1100);
    return rect(0, 80);
  };
  Object.defineProperties(window.HTMLElement.prototype, {
    clientWidth: { configurable: true, get() { return window.innerWidth; } },
    clientHeight: { configurable: true, get() { return this.getBoundingClientRect().height; } },
  });
  window.scrollTo = (x, y) => {
    window.scrollY = typeof x === 'object' ? x.top ?? 0 : y ?? 0;
    window.dispatchEvent(new window.Event('scroll'));
  };

  window.IntersectionObserver = class {
    constructor(callback, options = {}) {
      this.callback = callback;
      this.margin = options.rootMargin?.includes('20%') ? 0.2 : 0;
      this.targets = new Map();
      observers.add(this);
    }
    observe(target) { observations++; this.targets.set(target, null); this.update(); }
    disconnect() { observers.delete(this); this.targets.clear(); }
    update() {
      for (const [target, previous] of this.targets) {
        const bounds = target.getBoundingClientRect();
        const margin = window.innerHeight * this.margin;
        const visible = bounds.bottom > -margin && bounds.top < window.innerHeight + margin;
        if (visible !== previous) {
          this.targets.set(target, visible);
          this.callback([{ target, isIntersecting: visible }], this);
        }
      }
    }
  };
  window.HTMLCanvasElement.prototype.getContext = function () {
    if (!contexts.has(this)) {
      contexts.set(this, {
        painted: 0, fills: 0, peakAlpha: 0, globalAlpha: 1,
        setTransform() {},
        clearRect() { this.painted = 0; this.peakAlpha = 0; },
        fillText() {
          this.painted++;
          this.fills++;
          this.peakAlpha = Math.max(this.peakAlpha, this.globalAlpha);
        },
      });
    }
    return contexts.get(this);
  };

  // Deterministic initial drops; assertions inspect actual fill/clear calls.
  let seed = 42;
  window.Math.random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  window.eval(mode === 'development' ? development : production);
  const harness = window.matrixTest;
  const advance = (ms = 80) => {
    for (let elapsed = 0; elapsed < ms; elapsed += 1000 / 60) {
      now += 1000 / 60;
      observers.forEach((io) => io.update());
      for (const [key, timer] of [...timers]) {
        if (timer.at <= now && timers.delete(key)) timer.fn();
      }
      const pending = [...frames];
      for (const [key, callback] of pending) if (frames.delete(key)) callback(now);
    }
  };
  const atProgress = (p) => {
    window.scrollTo(0, sourceTop + (height() - window.innerHeight) * p);
    advance();
  };
  const atVisibleHeight = (pixels) => {
    window.scrollTo(0, sourceTop + height() - pixels);
    advance();
  };
  const stageRain = () => source()?.querySelector('canvas.matrix-rain');
  const workRain = () => doc.querySelector('section canvas.matrix-rain');
  const ink = (canvas) => contexts.get(canvas)?.painted ?? 0;
  const isRaining = (overlap = false) => {
    assert.equal(harness.handoff.current.active, true, 'handoff remains active');
    assert.equal(source().dataset.matrixActive, 'true', 'grain stays off throughout the handoff');
    assert.equal(stageRain().style.clipPath, 'none', 'outgoing rain is not clipped shut');
    assert.ok(ink(stageRain()) > 0, 'outgoing canvas draws code');
    assert.ok(contexts.get(stageRain()).peakAlpha > 0.85, 'outgoing code does not fade at the seam');
    if (overlap) {
      assert.notEqual(workRain().style.display, 'none', 'StrictMode has not hidden the incoming canvas');
      assert.ok(ink(workRain()) > 0, 'Selected Work draws rain during the overlap');
      assert.ok(contexts.get(workRain()).peakAlpha > 0.9, 'incoming rain stays at full strength');
    }
  };
  const isDry = () => {
    assert.equal(harness.handoff.current.active, false, 'handoff is inactive');
    assert.equal(source().dataset.matrixActive, 'false', 'grain override is released');
    assert.equal(ink(workRain()), 0, 'Selected Work rain is cleared');
    if (stageRain()) {
      assert.equal(ink(stageRain()), 0, 'outgoing rain is cleared');
      assert.notEqual(stageRain().style.clipPath, 'none', 'matrix is closed');
    }
  };
  const play = () => { atProgress(0.82); advance(11000); isRaining(); };
  const finish = () => {
    harness.unmount();
    assert.equal(harness.handoff.current.source, null, 'unmount releases the source ref');
    assert.equal(harness.handoff.current.active, false, 'unmount ends the shared handoff');
    assert.equal(errors.length, 0, errors.join('\n'));
    window.close();
  };
  return { window, doc, harness, advance, atProgress, atVisibleHeight, stageRain, workRain, isRaining, isDry, play, finish, observations: () => observations };
}

for (const options of [{}, { touch: true }, { mode: 'production' }]) {
  const t = boot(options);
  const label = options.touch ? 'mobile StrictMode' : options.mode === 'production' ? 'production' : 'desktop StrictMode';
  if (!options.mode) assert.ok(t.observations() >= 4, 'development actually replayed both effects');
  t.isDry();
  t.harness.render(); // Parent update before ever reaching the matrix.
  t.advance();
  t.atProgress(0.68);
  t.isDry();
  t.atProgress(0.82);
  t.advance(1600);
  t.isDry(); // No code before the dialogue finishes.
  t.advance(9500);
  t.isRaining();
  for (const canvas of [t.stageRain(), t.workRain()]) {
    assert.equal(t.window.getComputedStyle(canvas).backgroundColor, 'rgb(0, 0, 0)', 'rain background is pure #000000');
  }
  assert.equal(parseFloat(t.workRain().style.height), t.window.innerHeight,
    'incoming drops are seeded in the visible viewport, not far down the mobile card stack');
  // Both old failures occurred here: resetting the terminal at .995, then
  // consuming/closing its rain at .999, before What I Do had even left.
  t.atProgress(0.997);
  t.isRaining();
  t.atProgress(1);
  t.isRaining();
  for (const visible of [790, 400, 80, 1]) {
    t.atVisibleHeight(visible);
    t.isRaining(true);
  }
  t.atVisibleHeight(400);
  t.advance(7000); // No timeout while parked between sections.
  t.isRaining(true);
  t.atVisibleHeight(600); // Reversing inside the overlap must not consume it.
  t.isRaining(true);
  t.harness.render(); // Already-open cards do not turn off the live rain.
  t.advance();
  t.isRaining(true);
  t.window.innerWidth = 1024;
  t.window.dispatchEvent(new t.window.Event('resize'));
  t.advance(300);
  t.isRaining(true);
  t.atVisibleHeight(1);
  t.isRaining(true);
  t.atVisibleHeight(0);
  t.isDry(); // Exact boundary, with no extra quarter-viewport fade/linger.
  assert.ok([...t.doc.querySelectorAll('.wk-card')].every(c => c.dataset.open === '1'), 'projects stay open');
  t.atVisibleHeight(400);
  t.advance(1000);
  t.isDry(); // No second rain after the completed hand-off.
  t.harness.render(true);
  t.advance(1000);
  t.isDry(); // Nor after navigating away and remounting Home.
  t.finish();
  console.log(`PASS  ${label}: continuous rain through continue, pin release and overlap; clears only at full exit`);
}

{
  const t = boot(); // A full page load re-arms the one-shot transmission.
  t.play();
  t.atProgress(0.7); // Deliberately clear the matrix by returning to the skills.
  t.isDry();
  t.atProgress(0.82);
  t.advance(11000);
  t.isDry();
  t.finish();
  console.log('PASS  clearing the matrix phase stops the rain without replaying the transmission');
}
{
  const t = boot();
  t.play();
  t.atVisibleHeight(400);
  t.isRaining(true);
  t.atVisibleHeight(-900); // Jump beyond the source observer's margin in one frame.
  t.atVisibleHeight(400);
  t.isDry();
  t.finish();
  console.log('PASS  fast jumps consume the hand-off even when its last visible frame is skipped');
}
{
  const t = boot();
  t.atVisibleHeight(0); // Skip the entire act, e.g. keyboard End / deep scroll.
  t.advance(1600);
  t.isDry();
  assert.ok([...t.doc.querySelectorAll('.wk-card')].every(c => c.dataset.open === '1'));
  t.finish();
  console.log('PASS  skipping the matrix never starts unrelated rain or hides the projects');
}
{
  const t = boot({ touch: true, reduce: true });
  t.advance(11000);
  t.isDry();
  assert.equal(t.doc.querySelector('[data-matrix-active]').style.height, 'auto');
  assert.equal(t.workRain().style.display, 'none');
  assert.ok([...t.doc.querySelectorAll('.wk-card')].every(c => c.dataset.open === '1'));
  t.finish();
  console.log('PASS  reduced motion retains readable skills and projects without rain or pinning');
}
{
  const t = boot({ variant: 'about' });
  t.atProgress(0.9);
  t.advance(11000);
  t.isDry();
  assert.equal(t.stageRain(), null);
  t.finish();
  console.log('PASS  About remains free of the Matrix effect');
}
