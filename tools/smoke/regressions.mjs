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
  const pictures = hero.querySelectorAll('picture').length;
  const sources = hero.querySelectorAll('source').length;
  check('hero uses exactly one <img>', imgs.length === 1, `found ${imgs.length}`);
  check('hero has no <picture> art-direction switch', pictures === 0 && sources === 0,
    `${pictures} picture / ${sources} source`);
  const srcset = imgs[0]?.getAttribute('srcset') || '';
  const families = new Set([...srcset.matchAll(/\/images\/([a-z-]+?)-\d+\.webp/g)].map((m) => m[1]));
  check('every srcset width is the same photograph', families.size === 1,
    [...families].join(', ') || 'none');
  window.close();
}

/* ── 2. The wordmark goes to the hero and nowhere else ─────────────── */
{
  const { window, scrolledTo } = await boot('/work/audi');
  const mark = window.document.querySelector('a[aria-label*="back to top"]');
  check('wordmark exists', !!mark);
  click(window, mark);
  await wait(1600);
  check('wordmark from an inner page lands on home', window.location.pathname === '/',
    window.location.pathname);
  check('wordmark lands at the hero, not mid-page', scrolledTo() === 0, `scrollY=${scrolledTo()}`);
  window.close();
}
{
  const { window, scrolledTo } = await boot('/');
  Object.defineProperty(window, 'scrollY', { value: 4000, configurable: true, writable: true });
  const mark = window.document.querySelector('a[aria-label*="back to top"]');
  click(window, mark);
  await wait(1600);
  check('wordmark from deep in the homepage returns to the hero',
    window.location.pathname === '/' && scrolledTo() === 0, `path=${window.location.pathname} scrollY=${scrolledTo()}`);
  window.close();
}

/* ── 3. The matrix stays where it belongs ──────────────────────────── */
{
  const { window } = await boot('/');
  const strays = [...window.document.body.children].filter(
    (n) => n.tagName === 'CANVAS' && n.id !== 'root',
  );
  check('no matrix canvas portalled loose onto <body>', strays.length === 0,
    `${strays.length} stray canvas`);
  window.close();
}
{
  // Homepage -> anywhere carries the code. Inner -> inner does not.
  const { window } = await boot('/');
  const panelCanvas = () => window.document.querySelector('.page-transition canvas');
  click(window, [...window.document.querySelectorAll('a')].find((a) => a.getAttribute('href') === '/work'));
  await wait(120);
  check('transition from the homepage shows the matrix', panelCanvas()?.style.opacity === '1',
    `opacity=${panelCanvas()?.style.opacity}`);
  await wait(1500);
  window.close();
}
{
  const { window } = await boot('/work');
  const panelCanvas = () => window.document.querySelector('.page-transition canvas');
  const inner = [...window.document.querySelectorAll('a')].find((a) => /^\/work\/[a-z-]+$/.test(a.getAttribute('href') || ''));
  check('found an inner-page link', !!inner, inner?.getAttribute('href'));
  click(window, inner);
  await wait(120);
  check('transition between inner pages is solid, no matrix', panelCanvas()?.style.opacity === '0',
    `opacity=${panelCanvas()?.style.opacity}`);
  await wait(1500);
  window.close();
}

console.log(`\n${failures === 0 ? 'ALL REGRESSION GUARDS PASS' : failures + ' FAILED'}`);
process.exit(failures === 0 ? 0 : 1);
