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

async function boot(route = '/') {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
    url: 'https://papi.example' + route, pretendToBeVisual: true, runScripts: 'outside-only',
  });
  const { window } = dom;
  window.matchMedia = (q) => ({ media: q, matches: /pointer: fine|hover: hover|min-width/.test(q) && !/reduce/.test(q), addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){}, dispatchEvent(){return false;}, onchange:null });
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

/* ── 1. One hero image, not two crops ──────────────────────────────── */
{
  const { window } = await boot('/');
  const hero = window.document.getElementById('hero');
  const imgs = [...hero.querySelectorAll('img')];
  check('hero uses exactly one <img>', imgs.length === 1, `found ${imgs.length}`);
  check('hero has no <picture> art-direction switch',
    hero.querySelectorAll('picture').length === 0 && hero.querySelectorAll('source').length === 0);
  const srcset = imgs[0]?.getAttribute('srcset') || '';
  const families = new Set([...srcset.matchAll(/\/images\/([a-z-]+?)-\d+\.webp/g)].map((m) => m[1]));
  check('every srcset width is the same photograph', families.size === 1,
    [...families].join(', ') || 'none');
  window.close();
}

/* ── 2. The lime cursor, the lens and the earring all exist ────────── */
{
  const { window } = await boot('/');
  const doc = window.document;
  const cursors = [...doc.querySelectorAll('.custom-cursor')];
  const limeRing = cursors.find((c) => (c.className || '').includes('border-[#d7ff4f]'));
  check('lime cursor circle is rendered', !!limeRing, `${cursors.length} cursor nodes`);
  check('lime cursor circle is above everything', (limeRing?.className || '').includes('z-[9999]'));

  const hero = doc.getElementById('hero');
  check('CULTURE LED CREATIVE ring is present',
    (hero.querySelector('.hero-ring textPath')?.textContent || '').includes('CULTURE LED CREATIVE'));
  check('the ring has a magnifier lens', !!hero.querySelector('.hero-ring canvas.hero-lens'));
  check('the lens has a lime rim', !!hero.querySelector('.hero-ring .hero-lens-rim'));
  check('the earring is on the photograph', !!hero.querySelector('.hero-earring'));
  window.close();
}

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

console.log(`\n${failures === 0 ? 'ALL REGRESSION GUARDS PASS' : failures + ' FAILED'}`);
process.exit(failures === 0 ? 0 : 1);
