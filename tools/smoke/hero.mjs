/** Rain-pane and bounded-work regressions; exercises the real wipe controller
 * and Hero effects. The pane is the rain photograph itself — drawn once onto a
 * canvas, never a computed glass field — so this guards: the pane is a
 * photograph, the reveal layer stays hidden until rain is showing, the ring
 * squeegees, opaque wipe cores, cached brushes, unique coverage, completion
 * cleanup, no re-fog after late loads or resizes, grain exclusion over the
 * photo, high-DPI effect budgets, clean mobile and reduced-motion modes, and
 * matching cover-aware image/preload candidates. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { setTimeout as wait } from 'node:timers/promises';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

/** 'CULTURE LED CREATIVE ' — including the seam space — is 21 glyphs. */
const RING_GLYPHS = 21;

const code = (await build({
  stdin: {
    resolveDir: fileURLToPath(new URL('.', import.meta.url)), loader: 'tsx',
    contents: `
      import { StrictMode } from 'react';
      import { createRoot } from 'react-dom/client';
      import { flushSync } from 'react-dom';
      import { MemoryRouter } from 'react-router-dom';
      import Hero from '../../src/components/Hero';
      import { createHeroWiper } from '../../src/utils/heroWipe';
      const root = createRoot(document.getElementById('root')!);
      (window as any).heroTest = {
        createHeroWiper,
        mount: () => flushSync(() => root.render(
          <StrictMode><MemoryRouter><div className="mix-grain"><Hero /></div></MemoryRouter></StrictMode>
        )),
        unmount: () => flushSync(() => root.unmount()),
      };
    `,
  },
  bundle: true, write: false, format: 'iife', jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"development"' }, logLevel: 'silent',
})).outputFiles[0].text;

async function boot({ width = 1200, height = 800, dpr = 1, touch = false, reduce = false, mount = true } = {}) {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', {
    url: 'https://papi.example/', pretendToBeVisual: true, runScripts: 'outside-only',
  });
  const { window } = dom;
  const doc = window.document;
  window.innerWidth = width;
  window.innerHeight = height;
  window.devicePixelRatio = dpr;
  const errors = [];
  window.addEventListener('error', e => errors.push(String(e.error || e.message)));
  window.console.error = (...args) => errors.push(args.join(' '));
  window.matchMedia = q => ({
    matches: q.includes('reduce') ? reduce : !touch, media: q,
    addEventListener() {}, removeEventListener() {},
  });
  window.IntersectionObserver = class {
    constructor(cb) { this.cb = cb; }
    observe(target) { this.cb([{ target, isIntersecting: true }]); }
    unobserve() {}
    disconnect() {}
  };
  window.HTMLElement.prototype.getBoundingClientRect = function () {
    return this.id === 'hero'
      ? new window.DOMRect(0, -window.scrollY, window.innerWidth, Math.max(window.innerHeight, 540))
      : new window.DOMRect(0, 0, 0, 0);
  };
  let loaded = false;
  Object.defineProperties(window.HTMLImageElement.prototype, {
    complete: { configurable: true, get: () => loaded },
    naturalWidth: { configurable: true, get: () => loaded ? 1904 : 0 },
    naturalHeight: { configurable: true, get: () => loaded ? 1328 : 0 },
  });
  let resolveFonts;
  Object.defineProperty(doc, 'fonts', { value: { ready: new Promise(resolve => { resolveFonts = resolve; }) } });
  let id = 0;
  let now = 100;
  const frames = new Map();
  const idle = new Map();
  const staleIdle = [];
  window.requestAnimationFrame = cb => { frames.set(++id, cb); return id; };
  window.cancelAnimationFrame = key => frames.delete(key);
  window.requestIdleCallback = cb => { idle.set(++id, cb); staleIdle.push(cb); return id; };
  window.cancelIdleCallback = key => idle.delete(key);
  Object.defineProperty(window.performance, 'now', { value: () => now });
  const contexts = new Map();
  const gradients = [];
  let imageDataCalls = 0;
  window.HTMLCanvasElement.prototype.getContext = function () {
    if (contexts.has(this)) return contexts.get(this);
    const stack = [];
    const ctx = {
      canvas: this, globalAlpha: 1, globalCompositeOperation: 'source-over',
      paints: 0, erases: 0, draws: 0, strokes: 0, clears: 0, photoDraws: 0,
      save() { stack.push([this.globalAlpha, this.globalCompositeOperation]); },
      restore() { [this.globalAlpha, this.globalCompositeOperation] = stack.pop(); },
      setTransform() {}, beginPath() {}, moveTo() {}, lineTo() {}, arc() {}, ellipse() {},
      clearRect() { this.clears++; },
      fillRect() { this.paints++; },
      fill() { if (this.globalCompositeOperation === 'destination-out') this.erases++; else this.paints++; },
      stroke() {
        this.strokes++;
        if (this.globalCompositeOperation === 'destination-out') {
          this.erases++;
          this.core = { alpha: this.globalAlpha, color: this.strokeStyle, cap: this.lineCap, width: this.lineWidth };
        }
      },
      drawImage(image) {
        this.draws++;
        if (image.tagName === 'IMG') this.photoDraws++;
        if (this.globalCompositeOperation === 'source-over') this.paints++;
        else this.erases++;
      },
      createLinearGradient() { return { addColorStop() {} }; },
      createRadialGradient() {
        const stops = [];
        gradients.push(stops);
        return { addColorStop: (offset, color) => stops.push([offset, color]) };
      },
      createImageData: (w, h) => { imageDataCalls++; return { data: new Uint8ClampedArray(w * h * 4) }; },
      putImageData() {},
      getImageData() { throw new Error('GPU readback is not allowed in the wipe path'); },
    };
    contexts.set(this, ctx);
    return ctx;
  };
  window.eval(code);
  if (mount) { window.heroTest.mount(); await wait(40); }
  const advance = (count = 30) => {
    for (let i = 0; i < count; i++) {
      now += 1000 / 60;
      for (const [key, callback] of [...frames]) if (frames.delete(key)) callback(now);
    }
  };
  advance();
  const pointer = (x, y) => {
    const event = new window.MouseEvent('pointermove', { clientX: x, clientY: y });
    Object.defineProperty(event, 'pointerType', { value: 'mouse' });
    window.dispatchEvent(event);
    advance();
  };
  const flushIdle = () => { for (const [key, cb] of [...idle]) if (idle.delete(key)) cb(); };
  const imageLoaded = () => { loaded = true; doc.querySelector('img.hero-photo')?.dispatchEvent(new window.Event('load')); };
  const resize = async (w, h = height) => {
    window.innerWidth = w;
    window.innerHeight = h;
    window.dispatchEvent(new window.Event('resize'));
    advance();
    await wait(220);
    advance();
  };
  const canvas = () => doc.querySelector('canvas.hero-rain');
  const close = () => {
    if (mount) window.heroTest.unmount();
    staleIdle.forEach(cb => cb()); // Even an already-queued callback must be harmless.
    assert.equal(errors.length, 0, errors.join('\n'));
    window.close();
  };
  return { window, doc, contexts, gradients, pointer, advance, canvas, flushIdle, staleIdle, idle, resolveFonts, imageLoaded, resize, close, imageDataCalls: () => imageDataCalls };
}

{
  const t = await boot({ mount: false });
  const canvas = t.doc.createElement('canvas');
  const ctx = canvas.getContext('2d');
  let starts = 0;
  let completions = 0;
  const wiper = t.window.heroTest.createHeroWiper(ctx, {
    width: 1200, height: 800, onStart: () => starts++, onComplete: () => completions++,
  });
  for (let i = 0; i < 100; i++) {
    wiper.erase(1, 100 + i % 2 * 5, 100, 30);
    wiper.erase(2, 200 + i % 2 * 5, 100, 44);
  }
  assert.equal(t.gradients.length, 2, 'alternating ring/letter radii reuse cached brushes');
  assert.equal(starts, 1);
  assert.equal(completions, 0, 'repeatedly rubbing one area cannot clear the whole photograph');
  assert.ok(t.gradients.every(stops => stops[0][1] === 'rgba(0,0,0,1)' && stops[1][1] === 'rgba(0,0,0,1)'), 'brush has a fully opaque core');
  for (let i = 0; i < 40; i++) wiper.erase(100 + i, 40, 40, 20 + i * 2);
  assert.ok([...t.contexts.keys()].filter(c => c !== canvas && c.width > 1).length <= 24, 'many actor sizes cannot grow the brush cache without bound');
  assert.equal(completions, 0, 'different brush sizes over the same corner still do not complete the pane');
  wiper.erase(3, 0, 200, 30);
  const before = ctx.draws;
  wiper.erase(3, 1200, 200, 30);
  assert.ok(ctx.draws - before <= 48, 'fast sweeps cap sprite work');
  assert.equal(ctx.core.alpha, 1, 'the continuous path removes every trace of the rain');
  assert.equal(ctx.core.color, '#000000');
  assert.equal(ctx.core.cap, 'round');
  assert.equal(ctx.globalCompositeOperation, 'source-over', 'compositing state is restored');
  const strokes = ctx.strokes;
  wiper.resetStroke(3);
  wiper.erase(3, 1100, 700, 30);
  assert.equal(ctx.strokes, strokes, 're-entering the hero never connects an old cursor trail');
  for (let y = 20; y < 800; y += 35) {
    wiper.resetStroke(4);
    wiper.erase(4, 0, y, 30);
    wiper.erase(4, 1200, y, 30);
  }
  assert.equal(wiper.complete, true, 'a mostly wiped pane finishes completely clear');
  assert.equal(completions, 1);
  assert.equal(ctx.clears, 1);
  const finishedDraws = ctx.draws;
  wiper.erase(5, 400, 400, 90);
  assert.equal(ctx.draws, finishedDraws, 'completed glass does no further drawing');
  assert.ok([...t.contexts.keys()].filter(c => c !== canvas).every(c => c.width === 1 && c.height === 1), 'brush backing stores are released');
  assert.equal(ctx.photoDraws, 0, 'wiping never redraws/resamples the high-resolution photographs');
  wiper.dispose();
  t.close();
  console.log('PASS  opaque wipe core, continuous fast strokes, cached brushes, unique coverage and zero work after clearing');
}

{
  const t = await boot();
  const canvas = t.canvas();
  assert.ok(canvas, 'desktop starts with the rain pane over the photograph');
  const photos = [...t.doc.querySelectorAll('#hero img.hero-photo')];
  assert.equal(photos.length, 2, 'the hero layers the rain window and the clear photograph');
  const [rain, clear] = photos;
  assert.ok(/hero-rain-window/.test(rain.getAttribute('src')), 'the base plate is the rain window');
  assert.ok(/hero-clear/.test(clear.getAttribute('src')), 'the reveal layer is the clear photograph');
  assert.equal(clear.style.visibility, 'hidden', 'the reveal stays hidden until the pane is showing rain');
  assert.equal(t.imageDataCalls(), 0, 'the pane is a photograph, not a computed glass field');
  assert.equal(t.idle.size, 0, 'no deferred pane work is scheduled');

  const ctx = t.contexts.get(canvas);
  const drawsBefore = ctx.photoDraws;
  t.imageLoaded();
  t.advance();
  assert.ok(ctx.photoDraws > drawsBefore, 'the pane draws the rain photograph itself');
  assert.equal(clear.style.visibility, '', 'the reveal is armed once the pane is showing rain');
  const earring = t.doc.querySelector('.hero-earring');
  assert.ok(earring, 'the earring is on the photograph');
  assert.ok(earring.style.transform.length > 0 && earring.style.opacity === '1', 'the earring is pinned on the lobe in image space');

  const paints = ctx.paints;
  t.pointer(180, 160);
  t.pointer(600, 160);
  assert.ok(ctx.erases > 0, 'the real Hero wires its cursor to the wiper');
  assert.equal(t.idle.size, 0, 'wiping schedules no deferred work');
  t.staleIdle.forEach(cb => cb());
  t.resolveFonts();
  await wait(0);
  t.advance();
  assert.equal(ctx.paints, paints, 'idle/font completion never repaints cleared glass');
  await t.resize(1000);
  assert.equal(canvas.style.visibility, 'hidden', 'resize finishes the wipe instead of re-fogging the window');
  assert.equal(canvas.width * canvas.height, 1, 'completed overlay releases its large buffer');
  await t.resize(600);
  assert.equal(t.canvas(), null, 'narrow layout has no interactive overlay');
  assert.equal(t.doc.querySelectorAll('#hero img.hero-photo').length, 1, 'narrow layout keeps only the rain window');
  await t.resize(1200);
  assert.equal(t.canvas().style.visibility, 'hidden', 'returning to desktop does not re-fog the window');

  t.window.scrollY = 300;
  t.window.dispatchEvent(new t.window.Event('scroll'));
  t.advance();
  const grain = t.doc.querySelector('.mix-grain');
  assert.equal(grain.style.getPropertyValue('--hero-grain-inset'), '500px', 'grain starts below the visible photo');
  t.window.scrollY = 900;
  t.window.dispatchEvent(new t.window.Event('scroll'));
  t.advance();
  assert.equal(grain.style.getPropertyValue('--hero-grain-inset'), '0px', 'other sections retain their texture');
  t.window.heroTest.unmount();
  assert.equal(grain.style.getPropertyValue('--hero-grain-inset'), '', 'navigation removes the scoped grain mask');
  t.close();
  console.log('PASS  photograph pane, hidden reveal, StrictMode, late callbacks, responsive remounts and scrolling preserve the wipe');
}

{
  const t = await boot({ width: 3840, height: 2160, dpr: 3 });
  const c = t.canvas();
  assert.ok(c.width * c.height <= 3_000_000, '4K/Retina effect buffer stays within its pixel budget');
  const ctx = t.contexts.get(c);
  const paints = ctx.paints;
  t.pointer(100, 100);
  t.imageLoaded();
  assert.equal(ctx.paints, paints, 'a late photograph decode never repaints the committed pane');
  t.close();
  console.log('PASS  high-DPI pane has a fixed pixel budget independent of the sharp photographs');
}

for (const options of [{ touch: true, width: 390 }, { reduce: true }]) {
  const t = await boot(options);
  assert.ok(t.doc.querySelector('img.hero-photo'), 'every visitor gets the rain-window photograph');
  assert.equal(t.doc.querySelectorAll('#hero img.hero-photo').length, 1, 'no reveal layer without a cursor');
  assert.equal(t.canvas(), null, 'no pane without a cursor');
  assert.equal(t.doc.querySelector('.hero-ring'), null, 'no ring without a cursor');
  assert.ok(t.doc.querySelector('.hero-earring'), 'the earring is there too');
  assert.equal(t.idle.size, 0, 'no deferred work is scheduled');
  t.close();
}
console.log('PASS  touch and reduced motion land on the unbroken rain window, earring included');

{
  const t = await boot();
  const photos = [...t.doc.querySelectorAll('img.hero-photo')];
  const head = new JSDOM(fs.readFileSync(new URL('../../index.html', import.meta.url), 'utf8'));
  const preloads = [...head.window.document.querySelectorAll('link[rel="preload"][as="image"]')];
  assert.equal(preloads.length, 2, 'both hero plates are preloaded');
  for (const photo of photos) {
    const preload = preloads.find(p => p.getAttribute('imagesrcset') === photo.getAttribute('srcset'));
    assert.ok(preload, `a preload matches the ${photo.getAttribute('src')} family`);
    assert.equal(preload.getAttribute('imagesizes'), photo.getAttribute('sizes'));
    assert.equal(photo.getAttribute('sizes'), 'max(100vw, 142svh, 767px)', 'portrait screens select for the actual object-cover width');
    assert.equal(photo.getAttribute('width'), '1904');
    assert.equal(photo.getAttribute('height'), '1328');
    assert.equal(photo.getAttribute('loading'), 'eager');
    assert.equal(photo.getAttribute('decoding'), 'async');
    for (const candidate of photo.getAttribute('srcset').split(',')) {
      const [url, descriptor] = candidate.trim().split(/\s+/);
      const file = fs.readFileSync(new URL('../../public' + url, import.meta.url));
      assert.ok(file.byteLength < 200 * 1024, 'each hero WebP stays below 200 KB');
      // The existing lossy WebP's VP8 frame header stores its real width here.
      assert.equal(file.toString('ascii', 12, 16), 'VP8 ');
      assert.equal(file.readUInt16LE(26) & 0x3fff, parseInt(descriptor), 'srcset width matches the actual file, not an invented upscale');
    }
  }
  const [rain, clear] = photos;
  assert.equal(rain.getAttribute('fetchpriority'), 'high', 'the rain window keeps the high priority');
  assert.notEqual(clear.getAttribute('fetchpriority'), 'high', 'the reveal never competes with the first paint');
  head.window.close();
  t.close();
  console.log('PASS  cover-aware responsive images/preloads, aligned plates, accurate dimensions and small payloads');
}
