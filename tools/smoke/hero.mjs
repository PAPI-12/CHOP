/** One-photograph rain-window regressions. The wet glass is baked into the
 * single hero image — no canvas pane, no second blurred copy of the portrait,
 * nothing to wipe — so this exercises the real Hero effects in StrictMode:
 * the ring cursor's orbit and pointer follow, responsive interactivity, grain
 * exclusion over the photograph, clean touch/reduced-motion modes, and the
 * cover-aware responsive image/preload candidates. */
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
      const root = createRoot(document.getElementById('root')!);
      (window as any).heroTest = {
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

async function boot({ width = 1200, height = 800, touch = false, reduce = false } = {}) {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', {
    url: 'https://papi.example/', pretendToBeVisual: true, runScripts: 'outside-only',
  });
  const { window } = dom;
  const doc = window.document;
  window.innerWidth = width;
  window.innerHeight = height;
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
  let resolveFonts;
  Object.defineProperty(doc, 'fonts', { value: { ready: new Promise(resolve => { resolveFonts = resolve; }) } });
  let id = 0;
  let now = 100;
  const frames = new Map();
  const idle = new Map();
  window.requestAnimationFrame = cb => { frames.set(++id, cb); return id; };
  window.cancelAnimationFrame = key => frames.delete(key);
  window.requestIdleCallback = cb => { idle.set(++id, cb); return id; };
  window.cancelIdleCallback = key => idle.delete(key);
  Object.defineProperty(window.performance, 'now', { value: () => now });
  window.eval(code);
  window.heroTest.mount();
  await wait(40);
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
  const resize = async (w, h = height) => {
    window.innerWidth = w;
    window.innerHeight = h;
    window.dispatchEvent(new window.Event('resize'));
    advance();
    await wait(220);
    advance();
  };
  const close = () => {
    window.heroTest.unmount();
    assert.equal(errors.length, 0, errors.join('\n'));
    window.close();
  };
  return { window, doc, pointer, advance, resize, idle, resolveFonts, close };
}

{
  const t = await boot();
  const hero = t.doc.getElementById('hero');

  // The rain window is ONE photograph. No canvas pane over it, no second
  // (blurred) copy of the portrait, no earring floating over wet glass, and
  // no deferred work queued to paint one later.
  const imgs = hero.querySelectorAll('img');
  assert.equal(imgs.length, 1, 'the hero is exactly one <img>');
  assert.ok(imgs[0].classList.contains('hero-photo'), 'it is the hero photograph');
  assert.equal(hero.querySelectorAll('canvas').length, 0, 'no canvas pane is painted over the photograph');
  assert.equal(hero.querySelectorAll('.hero-earring').length, 0, 'no earring floats over the wet glass');
  assert.equal(t.idle.size, 0, 'no deferred pane work is ever scheduled');

  // The ring cursor: laid out around its orbit and actually following the
  // pointer.
  const ring = hero.querySelector('.hero-ring');
  assert.ok(ring, 'desktop has the CULTURE LED CREATIVE ring');
  const glyphs = [...ring.querySelectorAll('.hero-ring-glyph')];
  assert.ok(glyphs.length >= RING_GLYPHS, `the label loops the full ring (${glyphs.length} glyphs)`);
  assert.ok(glyphs.every(g => g.getAttribute('transform')), 'every glyph is placed on the orbit');
  const before = ring.style.transform;
  t.pointer(300, 200);
  t.pointer(760, 430);
  assert.notEqual(ring.style.transform, before, 'the ring follows the cursor');
  t.resolveFonts();
  await wait(0);
  t.advance();
  assert.ok(glyphs.every(g => g.getAttribute('transform')), 'a late font load re-lays the label, never a pane');

  // The site grain is still clipped below the hero, and unmounting still
  // removes the scoped mask.
  const grain = t.doc.querySelector('.mix-grain');
  assert.equal(grain.style.getPropertyValue('--hero-grain-inset'), '800px', 'grain starts below the hero photograph');
  t.window.scrollY = 300;
  t.window.dispatchEvent(new t.window.Event('scroll'));
  t.advance();
  assert.equal(grain.style.getPropertyValue('--hero-grain-inset'), '500px', 'grain follows the photograph as it scrolls');
  t.window.scrollY = 900;
  t.window.dispatchEvent(new t.window.Event('scroll'));
  t.advance();
  assert.equal(grain.style.getPropertyValue('--hero-grain-inset'), '0px', 'other sections retain their texture');
  t.close();
  assert.equal(grain.style.getPropertyValue('--hero-grain-inset'), '', 'navigation removes the scoped grain mask');
  console.log('PASS  one rain-window photograph, no pane, working ring cursor and scoped grain');
}

{
  const t = await boot();
  await t.resize(600);
  assert.equal(t.doc.querySelector('.hero-ring'), null, 'a narrow layout drops the ring');
  assert.ok(t.doc.querySelector('img.hero-photo'), 'the photograph stays');
  await t.resize(1200);
  assert.ok(t.doc.querySelector('.hero-ring'), 'returning to desktop restores the ring');
  assert.equal(t.doc.querySelectorAll('#hero canvas').length, 0, 'no pane is ever remounted');
  t.close();
  console.log('PASS  responsive interactivity changes never touch the photograph');
}

for (const options of [{ touch: true, width: 390 }, { reduce: true }]) {
  const t = await boot(options);
  assert.ok(t.doc.querySelector('img.hero-photo'), 'every visitor gets the rain-window photograph');
  assert.equal(t.doc.querySelector('.hero-ring'), null, 'no ring without a real cursor');
  assert.equal(t.idle.size, 0, 'no deferred work is scheduled');
  t.close();
}
console.log('PASS  touch and reduced motion land on the same single photograph');

{
  const t = await boot({ touch: true, width: 390 });
  const photo = t.doc.querySelector('img.hero-photo');
  const head = new JSDOM(fs.readFileSync(new URL('../../index.html', import.meta.url), 'utf8'));
  const preload = head.window.document.querySelector('link[rel="preload"][as="image"]');
  assert.equal(preload.getAttribute('imagesrcset'), photo.getAttribute('srcset'), 'preload and image choose the same file');
  assert.equal(preload.getAttribute('imagesizes'), photo.getAttribute('sizes'));
  assert.equal(photo.getAttribute('sizes'), 'max(100vw, 142svh, 767px)', 'portrait screens select for the actual object-cover width');
  assert.equal(photo.getAttribute('width'), '1904');
  assert.equal(photo.getAttribute('height'), '1328');
  assert.equal(photo.getAttribute('fetchpriority'), 'high');
  assert.equal(photo.getAttribute('loading'), 'eager');
  assert.equal(photo.getAttribute('decoding'), 'async');
  for (const candidate of photo.getAttribute('srcset').split(',')) {
    const [url, descriptor] = candidate.trim().split(/\s+/);
    const file = fs.readFileSync(new URL('../../public' + url, import.meta.url));
    assert.ok(file.byteLength < 200 * 1024, 'each rain-window WebP stays below 200 KB');
    // The existing lossy WebP's VP8 frame header stores its real width here.
    assert.equal(file.toString('ascii', 12, 16), 'VP8 ');
    assert.equal(file.readUInt16LE(26) & 0x3fff, parseInt(descriptor), 'srcset width matches the actual file, not an invented upscale');
  }
  head.window.close();
  t.close();
  console.log('PASS  cover-aware responsive image/preload, accurate intrinsic dimensions and small rain-window payloads');
}
