/**
 * Guards for the specific behaviours that were reported broken. Each check
 * names the symptom, not the implementation, so it stays meaningful.
 */
import { JSDOM } from 'jsdom';
import fs from 'node:fs';

const code = fs.readFileSync(new URL('./bundle.js', import.meta.url), 'utf8');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let failures = 0;
const check = (name, ok, detail = '') => {
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
};

async function boot(route = '/', opts = {}) {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
    url: 'https://papi.example' + route, pretendToBeVisual: true, runScripts: 'outside-only',
  });
  const { window } = dom;
  const answer = (q) => {
    // A phone: coarse pointer, no hover, narrow viewport.
    if (opts.touch && /pointer: fine|hover: hover/.test(q)) return false;
    return /pointer: fine|hover: hover|min-width/.test(q) && !/reduce/.test(q);
  };
  window.matchMedia = (q) => ({ media: q, matches: answer(q), addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){}, dispatchEvent(){return false;}, onchange:null });
  if (opts.touch) Object.defineProperty(window, 'innerWidth', { value: 390, configurable: true, writable: true });
  window.IntersectionObserver = class { constructor(cb){this.cb=cb;} observe(el){ this.cb([{isIntersecting:true,target:el,intersectionRatio:1}], this); } unobserve(){} disconnect(){} takeRecords(){return [];} };
  window.ResizeObserver = class { observe(){} unobserve(){} disconnect(){} };
  window.requestIdleCallback = (cb) => window.setTimeout(() => cb({didTimeout:false,timeRemaining:()=>5}), 0);
  window.cancelIdleCallback = (id) => window.clearTimeout(id);
  let scrolled = null;
  window.scrollTo = function (x, y) {
    const top = typeof x === 'object' && x ? (x.top ?? 0) : (y || 0);
    scrolled = top;
    Object.defineProperty(window, 'scrollY', { value: top, configurable: true, writable: true });
  };
  window.HTMLCanvasElement.prototype.getContext = () => null;
  Object.defineProperty(window.document, 'fonts', { value: { ready: Promise.resolve() }, configurable: true });
  const errors = [];
  window.addEventListener('error', (e) => errors.push(String(e.error?.stack || e.message)));
  window.console.error = (...a) => errors.push(a.map(String).join(' ').slice(0, 200));
  window.eval(code);
  await wait(1400);
  return { window, errors, scrolledTo: () => scrolled };
}

const click = (window, el) =>
  el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));

/* ── 1. One hero photograph — the original — not two crops ─────────── */
{
  const { window } = await boot('/');
  const hero = window.document.getElementById('hero');
  const photos = [...hero.querySelectorAll('img.hero-photo')];
  const panes = [...hero.querySelectorAll('img.hero-pane-plate')];
  // One photograph, never two crops. The rain pane is a plate built on that
  // photograph and is decoded, not shown — the canvas draws it.
  check('hero shows exactly one photograph', photos.length === 1, `found ${photos.length}`);
  check('the photograph is the original portrait',
    /hero-landscape-\d+\.webp/.test(photos[0]?.getAttribute('src') || ''), photos[0]?.getAttribute('src') || 'none');
  check('the photograph is not a re-rendered scene',
    !/rain|clear/.test(photos[0]?.getAttribute('src') || ''));
  check('desktop mounts the rain pane plate, hidden', panes.length === 1 && /\bopacity-0\b/.test(panes[0].className),
    `${panes.length} pane plates`);
  check('hero has no <picture> art-direction switch',
    hero.querySelectorAll('picture').length === 0 && hero.querySelectorAll('source').length === 0);
  const ratio = (img) => Number(img.getAttribute('width')) / Number(img.getAttribute('height'));
  check('the pane shares the photograph\'s plate geometry',
    panes.length === 1 && Math.abs(ratio(panes[0]) - ratio(photos[0])) < 0.002,
    [...photos, ...panes].map(i => `${i.getAttribute('width')}x${i.getAttribute('height')}`).join(' | '));
  for (const img of [...photos, ...panes]) {
    const families = new Set([...(img.getAttribute('srcset') || '').matchAll(/\/images\/([a-z-]+?)-\d+\.webp/g)].map((m) => m[1]));
    check(`every srcset width of ${families.values().next().value || '?'} is the same photograph`, families.size === 1,
      [...families].join(', ') || 'none');
  }
  window.close();
}

/* ── 2. The CULTURE LED CREATIVE ring (no lime rim, no SVG path) and the
       earring exist; the magnifying glass is gone ─────────────────────── */
{
  const { window } = await boot('/');
  const doc = window.document;
  const cursors = [...doc.querySelectorAll('.custom-cursor')];
  const limeRing = cursors.find((c) => (c.className || '').includes('border-[#d7ff4f]'));
  check('lime cursor circle is rendered', !!limeRing, `${cursors.length} cursor nodes`);
  check('lime cursor circle is above everything', (limeRing?.className || '').includes('z-[9999]'));

  const hero = doc.getElementById('hero');
  const ringText = [...(hero.querySelectorAll('.hero-ring .hero-ring-glyph') || [])]
    .map((n) => n.textContent || '').join('');
  check('CULTURE LED CREATIVE ring is present', ringText.includes('CULTURE LED CREATIVE'));
  check('the magnifying glass is gone', !hero.querySelector('.hero-lens, canvas.hero-lens'));
  check('the ring has no lime rim of its own', !hero.querySelector('.hero-ring .hero-ring-circle'));
  check('there is no SVG circle/path left in the ring',
    !hero.querySelector('.hero-ring circle') && !hero.querySelector('.hero-ring path'));
  check('the earring is on the photograph', !!hero.querySelector('.hero-earring'));
  check('the rain pane is a photograph plate on a canvas',
    !!hero.querySelector('canvas.hero-rain'), 'no pane');

  // SINCE 2015 is set in the site's lime, filled — no outline treatment.
  const since = [...hero.querySelectorAll('h1')].find((h) => /SINCE\s*2015/.test(h.textContent || '') && h.getAttribute('aria-hidden') === 'true');
  check('SINCE 2015 is lime', !!since && /text-\[#d7ff4f\]/.test(since.className), since?.className || 'missing');
  check('SINCE 2015 is filled, not outlined', !!since && !/text-stroke/.test(since.className));
  window.close();
}

/* ── 2b. The ring is a looping CULTURE LED CREATIVE label; no rim, no path ─ */
{
  const { window } = await boot('/');
  const ring = window.document.querySelector('.hero-ring');
  const lime = /#d7ff4f|rgb\(215,\s*255,\s*79\)/i;

  // Any round-and-lime element living inside the ring, by any mechanism.
  const circles = [...ring.querySelectorAll('*')].filter((el) => {
    if (el.tagName === 'circle') return true;
    const cls = el.getAttribute('class') || '';
    const style = el.getAttribute('style') || '';
    const round = /rounded-full/.test(cls) || /border-radius:\s*(50%|9999px)/.test(style);
    const isLime = lime.test(cls) || lime.test(style) || cls.includes('hero-ring-circle');
    return round && isLime;
  });
  check('the ring has no lime circle of its own', circles.length === 0,
    circles.map((c) => c.getAttribute('class') || c.tagName).join(' | ') || 'none');
  check('there is no SVG path left in the ring', !ring.querySelector('path'));
  const glyphs = [...ring.querySelectorAll('.hero-ring-glyph')];
  const ringText = glyphs.map((g) => g.textContent || '').join('');
  check('the ring is a looping CULTURE LED CREATIVE label',
    ringText.includes('CULTURE LED CREATIVE'));
  check('the site lime cursor is shown over the hero',
    !!window.document.querySelector('.custom-cursor'));

  const text = ring.querySelector('text');
  const weight = Number(text?.getAttribute('font-weight'));
  check('CULTURE LED CREATIVE is bold', weight >= 700, String(weight || 'unset'));
  check('the label is set in a family that has a real heavy weight',
    /Inter/.test(text?.getAttribute('font-family') || ''),
    text?.getAttribute('font-family') || 'unset');
  window.close();
}

/* ── 2c. Mobile lands on the original photograph, with no pane ─────── */
{
  const { window, errors } = await boot('/', { touch: true });
  const hero = window.document.getElementById('hero');
  check('mobile renders the hero photograph', !!hero.querySelector('img.hero-photo'));
  check('mobile renders the original photograph',
    /hero-landscape/.test(hero.querySelector('img.hero-photo')?.getAttribute('src') || ''));
  check('mobile keeps only the photograph, no pane plate',
    hero.querySelectorAll('img').length === 1,
    `${hero.querySelectorAll('img').length} plates`);
  check('mobile has no vapor overlay at all',
    !hero.querySelector('.hero-glass-static') && hero.querySelectorAll('canvas').length === 0,
    `${hero.querySelectorAll('canvas').length} canvas`);
  check('mobile has no CULTURE LED CREATIVE ring', !hero.querySelector('.hero-ring'));
  check('mobile still wears the earring', !!hero.querySelector('.hero-earring'));
  check('mobile hero throws nothing', errors.length === 0, errors[0] || '');
  window.close();
}

/* ── 2d. The Audi case study does not shift when a piece is opened ─── */
{
  const { window, errors } = await boot('/work/audi');
  const doc = window.document;
  const body = doc.body;
  const padBefore = body.style.paddingRight;
  const tiles = [...doc.querySelectorAll('.audi-img-zoom')];
  check('the Audi grid renders clickable pieces', tiles.length >= 10, `${tiles.length} tiles`);
  check('a piece is reachable by keyboard',
    tiles.every((t) => t.getAttribute('role') === 'button' && t.getAttribute('tabindex') === '0'));
  const tile = tiles[1];

  click(window, tile);
  await wait(300);
  const modal = doc.querySelector('.audi-slide-up');
  check('clicking a piece opens the viewer', !!modal);
  check('the page behind is locked while it is open', body.style.overflow === 'hidden',
    body.style.overflow || 'unset');

  const column = modal?.querySelector('.overflow-y-auto');
  check('the caption column scrolls instead of being clipped', !!column);

  const closeBtn = [...(modal?.querySelectorAll('button') || [])]
    .find((b) => /close/i.test(b.textContent || ''));
  click(window, closeBtn);
  await wait(300);
  check('closing restores the page exactly as it was',
    body.style.overflow === '' && body.style.paddingRight === padBefore,
    `overflow=${JSON.stringify(body.style.overflow)} pad=${JSON.stringify(body.style.paddingRight)}`);
  check('opening and closing a piece throws nothing', errors.length === 0, errors[0] || '');
  window.close();
}

/* ── 2da. The LV lightbox opens in-place and never scrolls the page ── */
{
  const { window, errors, scrolledTo } = await boot('/work/louis-vuitton');
  const doc = window.document;
  const body = doc.body;
  const tiles = [...doc.querySelectorAll('button')].filter((b) => /frame|lookbook|outlaw|estate|pass/i.test(b.textContent || ''));
  const tile = tiles[0] || [...doc.querySelectorAll('button')][3];
  const scrollBefore = scrolledTo();
  click(window, tile);
  await wait(300);
  const lightbox = doc.querySelector('.fixed.inset-0');
  check('clicking an LV frame opens the lightbox', !!lightbox);
  check('the page behind the LV lightbox is locked',
    body.style.overflow === 'hidden', body.style.overflow || 'unset');
  check('opening the LV lightbox leaves the route at the top',
    scrolledTo() === 0 && window.location.pathname === '/work/louis-vuitton',
    `path=${window.location.pathname} scrollY=${scrolledTo()}`);
  check('opening the LV lightbox throws nothing', errors.length === 0, errors[0] || '');
  window.close();
}

/* ── 2db. The route reveal never leaves a blank screen ─────────────── */
{
  const css = fs.readFileSync(new URL('../../src/index.css', import.meta.url), 'utf8');
  check('the route reveal starts near-visible, never blank',
    /page-enter[\s\S]{0,120}opacity:\s*0\.8/.test(css));
  check('the route reveal does not create a transformed containing block',
    !/@keyframes page-enter[\s\S]{0,180}transform:/.test(css));
}

/* ── 2e. The scrollbar can never take the layout with it ───────────── */
{
  const css = fs.readFileSync(new URL('../../src/index.css', import.meta.url), 'utf8');
  check('the scrollbar gutter is reserved permanently',
    /html\s*\{[^}]*scrollbar-gutter:\s*stable/.test(css));

  const dir = new URL('../../src/', import.meta.url);
  const walk = (u) => fs.readdirSync(u, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? walk(new URL(d.name + '/', u)) : [new URL(d.name, u)]);
  const offenders = walk(dir)
    .filter((u) => /\.tsx?$/.test(u.pathname) && !/useScrollLock/.test(u.pathname))
    .filter((u) => /body\.style\.overflow/.test(fs.readFileSync(u, 'utf8')))
    .map((u) => u.pathname.split('/src/')[1]);
  check('every scroll lock goes through the compensating hook',
    offenders.length === 0, offenders.join(', '));
}

/* ── 2f. The pane is a photograph plate, not a painted glass field ──── */
{
  const hero = fs.readFileSync(new URL('../../src/components/Hero.tsx', import.meta.url), 'utf8');
  const wipe = fs.readFileSync(new URL('../../src/utils/heroWipe.ts', import.meta.url), 'utf8');
  const css = fs.readFileSync(new URL('../../src/index.css', import.meta.url), 'utf8');

  // The procedural glass (noise fields, blooms, runnels, a blurred second
  // copy of the portrait) is what read as fake. The pane must be a plate
  // built on the original photograph, drawn once.
  check('no computed glass field is painted',
    !/createImageData|octaves|blooms|putImageData/.test(hero));
  check('the pane is drawn from the rain-pane plate',
    /drawImage\(pane/.test(hero) && /hero-rain-pane-\d+\.webp/.test(hero));
  check('the base photograph is the original, and the re-rendered scenes are gone',
    /hero-landscape-\d+\.webp/.test(hero) && !/hero-rain-window|hero-clear/.test(hero));
  check('the re-rendered plates are no longer shipped',
    !fs.existsSync(new URL('../../public/images/hero-rain-window-1904.webp', import.meta.url)) &&
    !fs.existsSync(new URL('../../public/images/hero-clear-1904.webp', import.meta.url)));
  check('wiping is a destination-out squeegee, never a repaint',
    /destination-out/.test(wipe) && !/putImageData/.test(wipe));
  check('the droplets and the blur are baked in, not a runtime filter',
    !/filter:\s*(blur|backdrop)/i.test(hero) && !/backdrop-filter/.test(hero) && /\.hero-photo\s*\{[^}]*filter:\s*none/.test(css));
  check('the pane plate is never visible itself',
    /\.hero-pane-plate\s*\{[^}]*visibility:\s*hidden/.test(css));
}

/* The hero's wipe lifecycle is exercised by hero.mjs. */

/* ── 3. The wordmark goes to the hero and nowhere else ─────────────── */
{
  const { window, scrolledTo } = await boot('/work/audi');
  const mark = window.document.querySelector('a[aria-label*="back to top"]');
  check('wordmark exists', !!mark);
  click(window, mark);
  await wait(600);
  check('wordmark from an inner page lands on home', window.location.pathname === '/',
    window.location.pathname);
  check('wordmark lands at the hero, not mid-page', scrolledTo() === 0, `scrollY=${scrolledTo()}`);
  window.close();
}
{
  const { window, scrolledTo } = await boot('/');
  Object.defineProperty(window, 'scrollY', { value: 4000, configurable: true, writable: true });
  click(window, window.document.querySelector('a[aria-label*="back to top"]'));
  await wait(400);
  check('wordmark from deep in the homepage returns to the hero',
    window.location.pathname === '/' && scrolledTo() === 0,
    `path=${window.location.pathname} scrollY=${scrolledTo()}`);
  window.close();
}

/* ── 3b. A case study opens at the top of itself ───────────────────── */
{
  const { window, scrolledTo } = await boot('/work');
  const doc = window.document;
  // Deep down the Work index, the way anyone actually is when they click.
  Object.defineProperty(window, 'scrollY', { value: 3200, configurable: true, writable: true });

  const targets = ['/work/louis-vuitton', '/work/audi'];
  for (const href of targets) {
    const link = [...doc.querySelectorAll('a')].find((a) => a.getAttribute('href') === href);
    if (!link) { check(`link to ${href} exists`, false); continue; }
    click(window, link);
    await wait(400);
    check(`${href} opens at the top, not mid-page`,
      window.location.pathname === href && scrolledTo() === 0,
      `path=${window.location.pathname} scrollY=${scrolledTo()}`);
    Object.defineProperty(window, 'scrollY', { value: 2400, configurable: true, writable: true });
    window.history.back();
    await wait(300);
  }
  window.close();
}

/* ── 3c. No case study may change scrolling for the whole site ─────── */
{
  const dir = new URL('../../src/', import.meta.url);
  const walk = (u) => fs.readdirSync(u, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? walk(new URL(d.name + '/', u)) : [new URL(d.name, u)]);
  const offenders = walk(dir)
    .filter((u) => /\.tsx?$/.test(u.pathname))
    .filter((u) => fs.readFileSync(u, 'utf8')
      .split('\n')
      .some((l) => /documentElement\.style\.scrollBehavior/.test(l)
        && !/^\s*(\/\/|\*|\/\*)/.test(l)))
    .map((u) => u.pathname.split('/src/')[1]);
  check('no page sets scroll-behavior on the document', offenders.length === 0,
    offenders.join(', '));

  const app = fs.readFileSync(new URL('../../src/App.tsx', import.meta.url), 'utf8');
  check('scroll restoration is taken off the browser',
    /scrollRestoration\s*=\s*'manual'/.test(app));
  check('the jump is re-asserted after the lazy chunk paints',
    /requestAnimationFrame\(jump\)/.test(app));
}

/* ── 4. The matrix lives in exactly two places ─────────────────────── */
{
  const { window } = await boot('/');
  const doc = window.document;
  const strays = [...doc.body.children].filter((n) => n.tagName === 'CANVAS');
  check('no matrix canvas portalled loose onto <body>', strays.length === 0,
    `${strays.length} stray canvas`);
  check('no page-transition panel exists at all', !doc.querySelector('.page-transition'));

  // Navigating must not raise a matrix panel of any kind.
  click(window, [...doc.querySelectorAll('a')].find((a) => a.getAttribute('href') === '/work'));
  await wait(400);
  check('clicking through to another page shows no transition panel',
    window.location.pathname === '/work' && !window.document.querySelector('.page-transition'),
    window.location.pathname);
  window.close();
}
{
  const { window } = await boot('/work');
  const inner = [...window.document.querySelectorAll('a')].find((a) => /^\/work\/[a-z-]+$/.test(a.getAttribute('href') || ''));
  click(window, inner);
  await wait(400);
  check('inner-page navigation shows no transition panel',
    window.location.pathname.startsWith('/work/') && !window.document.querySelector('.page-transition'),
    window.location.pathname);
  window.close();
}

/* ── 5. Selected Work is introduced by the code, and its rain is
       scoped to that section ─────────────────────────────────────── */
{
  const { window } = await boot('/');
  const doc = window.document;
  const cards = [...doc.querySelectorAll('.wk-card')];
  check('Selected Work renders its cards', cards.length === 3, `${cards.length} cards`);
  check('each card is cut out of a struck hairline',
    cards.every((c) => !!c.querySelector('.wk-card-strike')));
  await wait(1600);
  check('the cards have opened', cards.every((c) => c.getAttribute('data-open') === '1'),
    cards.map((c) => c.getAttribute('data-open')).join(','));

  const rain = doc.querySelector('section canvas[aria-hidden]');
  const section = rain?.closest('section');
  check('the hand-off rain is scoped inside a section, not the body',
    !!section && section.parentElement?.tagName !== 'BODY');
  window.close();
}

/* ── 6. The hero decorations run forever, the ring is a full circle,
       and the matrix hand-off is once per page load ─────────────────── */
{
  const hero = fs.readFileSync(new URL('../../src/components/Hero.tsx', import.meta.url), 'utf8');
  const what = fs.readFileSync(new URL('../../src/components/WhatIDo.tsx', import.meta.url), 'utf8');
  const nav = fs.readFileSync(new URL('../../src/components/Navbar.tsx', import.meta.url), 'utf8');

  check('the floating crosses and waves never freeze',
    !/frozen=\{frozen\}/.test(hero) && !/const frozen/.test(hero));

  check('the ring lays the label around the full circle with real word seams',
    /seamGap/.test(hero) && /FULL circumference/.test(hero) && /seam/.test(hero));

  check('the machine and its rain are once per page load',
    /machineActSpent/.test(what) && /rainConsumed/.test(what) && /handoffActive/.test(what));
  check('the wordmark does not re-arm the matrix',
    !/resetMachineAct/.test(nav) && !/resetMachineAct/.test(what));

  // The rain's actual lifetime, drawing and overlap are exercised by
  // matrix.mjs, including StrictMode's setup/cleanup/setup cycle. Checking
  // source strings here previously passed while both canvases disappeared.
  check('the human text reveals the matrix code — the strike waits for the last character',
    /clamp01\(\(actT - SPEAK_END\) \/ STRIKE_S\)/.test(what) && /SPEAK_END \+ STRIKE_S/.test(what));
}

console.log(`\n${failures === 0 ? 'ALL REGRESSION GUARDS PASS' : failures + ' FAILED'}`);
process.exit(failures === 0 ? 0 : 1);
