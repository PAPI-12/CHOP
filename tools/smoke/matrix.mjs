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

  const handoff = { current: { source: null, active: false, revealed: false } as MatrixHandoff };
  const root = createRoot(document.getElementById('root')!);
  let generation = 0;
  const render = (remount = false) => {
    if (remount) {
      generation++;
      // Navigating away and back re-arms the machine: a fresh ref starts dry,
      // with the matrix not yet revealed and the handoff not yet live.
      handoff.current = { source: null, active: false, revealed: false };
    }
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
  const peak = (canvas) => contexts.get(canvas)?.peakAlpha ?? 0;
  /**
   * The What I Do stage is raining and the hand-off is live. `overlap` adds the
   * guarantee that Selected Work's own canvas is drawing the incoming code at
   * full strength while the two sections share the viewport.
   */
  const isRaining = (overlap = false) => {
    assert.equal(harness.handoff.current.active, true, 'handoff remains active');
    assert.equal(source().dataset.matrixActive, 'true', 'grain stays off throughout the handoff');
    assert.equal(stageRain().style.clipPath, 'none', 'outgoing rain is not clipped shut');
    assert.ok(ink(stageRain()) > 0, 'outgoing canvas draws code');
    assert.ok(peak(stageRain()) > 0.85, 'outgoing code does not fade at the seam');
    if (overlap) {
      assert.notEqual(workRain().style.display, 'none', 'StrictMode has not hidden the incoming canvas');
      assert.ok(ink(workRain()) > 0, 'Selected Work draws rain during the overlap');
      assert.ok(peak(workRain()) > 0.9, 'incoming rain stays at full strength');
    }
  };
  /**
   * The code keeps raining over Selected Work on its own once the matrix has
   * been revealed — even after the What I Do hand-off has gone quiet (it has
   * scrolled fully out of view). Driven by `revealed`, not `active`.
   */
  const isWorkRaining = () => {
    assert.ok(ink(workRain()) > 0, 'Selected Work keeps drawing the code on its own');
    assert.ok(peak(workRain()) > 0.9, 'Selected Work rain stays at full strength');
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
  return { window, doc, harness, advance, atProgress, atVisibleHeight, stageRain, workRain, isRaining, isWorkRaining, isDry, play, finish, observations: () => observations };
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
  // Sit through the transmission: no code before it finishes, then the stage
  // opens into the rain.
  t.atProgress(0.82);
  t.advance(1600);
  t.isDry(); // No code before the dialogue finishes.
  t.advance(9500);
  t.isRaining(); // The stage opens; Selected Work is still below the fold here.
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
  // The code does NOT stop at the What I Do boundary. At the exact seam the
  // stage's hand-off goes quiet, but Selected Work keeps raining on its own.
  t.atVisibleHeight(0);
  t.isWorkRaining();
  assert.equal(t.harness.handoff.current.active, false,
    "the source hand-off ends once What I Do has left, but the code carries on");
  assert.equal(t.doc.querySelector('[data-matrix-active]').dataset.matrixActive, 'false',
    'grain override is released once What I Do leaves');
  t.atVisibleHeight(-400); // What I Do fully scrolled out; Selected Work remains.
  t.isWorkRaining();
  assert.ok([...t.doc.querySelectorAll('.wk-card')].every(c => c.dataset.open === '1'), 'projects stay open');
  // Coming back up into What I Do after the act is spent retires the pin: the
  // section is cut to the skills and the matrix/rain are gone — no blank runway.
  t.atVisibleHeight(600);
  t.advance(1000);
  assert.equal(t.doc.querySelector('[data-matrix-active]').style.height, 'auto',
    'returning to What I Do shortens the section to just the skills');
  t.isDry();
  t.harness.render(true);
  t.advance(1000);
  t.isDry(); // A fresh mount after navigating away re-arms dry.
  t.finish();
  console.log(`PASS  ${label}: rain continues from the reveal through the whole of Selected Work; the stream survives the pin release; returning up cuts the section to the skills`);
}

{
  // Rushing the human text must land on the same outcome as waiting: scroll
  // into the matrix phase, break the courtesy hold with a wheel flick, and
  // jump straight to Selected Work — the code is already raining there because
  // the reveal is a latch, not something the dialogue has to finish first.
  const t = boot();
  t.atProgress(0.82);
  t.advance(1600);
  t.window.dispatchEvent(new t.window.WheelEvent('wheel', { deltaY: 900 }));
  t.advance();
  t.atVisibleHeight(400);
  t.isWorkRaining();
  assert.equal(t.harness.handoff.current.active, false,
    'rushing the dialogue leaves the hand-off quiet until the act resolves');
  t.finish();
  console.log('PASS  rushing the human text still reveals the code over Selected Work');
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
  // Jump straight past the source observer's margin into Selected Work, then
  // bounce within Selected Work (never re-entering What I Do). The reveal latch
  // means a fast jump never drops the stream: the code keeps raining over the
  // work, driven by `revealed` not `active`.
  t.atVisibleHeight(-900);
  t.isWorkRaining();
  t.atVisibleHeight(-400);
  t.isWorkRaining();
  t.finish();
  console.log('PASS  fast jumps never drop the rain: the reveal latch carries the stream over Selected Work');
}
{
  const t = boot();
  t.atVisibleHeight(0); // Skip the entire act, e.g. keyboard End / deep scroll.
  t.advance(1600);
  // Rushing straight to the end still reveals the code over Selected Work —
  // the same outcome as waiting through the human text.
  t.isWorkRaining();
  assert.ok([...t.doc.querySelectorAll('.wk-card')].every(c => c.dataset.open === '1'));
  t.finish();
  console.log('PASS  skipping/rushing to the matrix still reveals the code over Selected Work and the projects');
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
{
  // The About hero→practice wipe is scroll-driven: a thin vertical origin
  // line is struck where the hero headline begins, the skills are revealed
  // through an opening that first grows left-to-right to a full-width band
  // and then vertically, and the section's own black background is the panel.
  const t = boot({ variant: 'about' });
  const line = () => t.doc.querySelector('.reveal-line');
  const stack = () => t.doc.querySelector('.reveal-stack');
  t.atProgress(0.01);
  assert.ok(line(), 'a thin origin line is struck for the About wipe');
  assert.ok(parseFloat(line().style.opacity) > 0.5, 'the origin line is lit as the wipe is born');
  assert.notEqual(stack().style.clipPath, 'none', 'the skills are clipped shut at the start');
  assert.ok(parseFloat(stack().style.opacity) < 0.3, 'the skills start nearly invisible');
  t.atProgress(0.12);
  assert.notEqual(stack().style.clipPath, 'none', 'the reveal window is still open mid-wipe');
  assert.ok(parseFloat(stack().style.opacity) > 0.3, 'the skills are emerging mid-wipe');
  assert.ok(parseFloat(line().style.opacity) < 1, 'the origin line dims as the band opens');
  t.atProgress(0.3);
  assert.equal(stack().style.clipPath, 'none', 'the wipe fully reveals the skills');
  assert.equal(parseFloat(stack().style.opacity), 1, 'the skills are fully visible at the end');
  assert.equal(t.stageRain(), null, 'About stays free of the matrix rain');
  t.isDry();
  t.finish();
  console.log('PASS  About hero→practice wipe is scroll-driven: a left origin line opens into the skills against the section black');
}
