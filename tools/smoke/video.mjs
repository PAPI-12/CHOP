import { JSDOM } from 'jsdom';
import fs from 'node:fs';
const code = fs.readFileSync(new URL('./bundle.js', import.meta.url), 'utf8');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function boot(route, reduce = false) {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'https://papi.example' + route, pretendToBeVisual: true, runScripts: 'outside-only' });
  const { window } = dom;
  window.matchMedia = (q) => ({ media: q, matches: /reduce/.test(q) ? reduce : (/pointer: fine|hover: hover|min-width/.test(q)), addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){}, dispatchEvent(){return false;}, onchange:null });
  window.IntersectionObserver = class { constructor(cb){this.cb=cb;} observe(el){ this.cb([{isIntersecting:true,target:el,intersectionRatio:1}], this); } unobserve(){} disconnect(){} takeRecords(){return [];} };
  window.ResizeObserver = class { observe(){} unobserve(){} disconnect(){} };
  window.requestIdleCallback = (cb) => window.setTimeout(() => cb({didTimeout:false,timeRemaining:()=>5}), 0);
  window.cancelIdleCallback = (id) => window.clearTimeout(id);
  window.scrollTo = () => {};
  window.HTMLCanvasElement.prototype.getContext = () => null;
  Object.defineProperty(window.document, 'fonts', { value: { ready: Promise.resolve() }, configurable: true });
  const errors = [];
  window.addEventListener('error', (e) => errors.push(String(e.error?.stack || e.message)));
  window.console.error = (...a) => errors.push('console.error: ' + a.map(String).join(' ').slice(0,200));
  window.eval(code);
  await wait(1500);
  return { window, errors };
}

for (const route of ['/work/nandos', '/work/sars', '/work/joshua']) {
  const { window, errors } = await boot(route);
  const before = window.document.querySelectorAll('iframe').length;
  const play = [...window.document.querySelectorAll('button')].find((b) => /Play video|Play Film|play/i.test(b.getAttribute('aria-label') || b.textContent || ''));
  if (play) play.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
  await wait(400);
  const frames = [...window.document.querySelectorAll('iframe')];
  console.log(route, '| iframes before click:', before, '| after:', frames.length);
  frames.forEach((f) => console.log('   src:', f.getAttribute('src'), '| referrerpolicy:', f.getAttribute('referrerpolicy'), '| loading:', f.getAttribute('loading')));
  console.log('   errors:', errors.length);
  window.close();
}

// Reduced motion: the transition must be skipped entirely and navigation instant.
const { window, errors } = await boot('/', true);
const link = [...window.document.querySelectorAll('a')].find((a) => a.getAttribute('href') === '/work');
link.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
await wait(200);
console.log('\nreduced-motion instant nav ->', window.location.pathname, '| errors:', errors.length);
