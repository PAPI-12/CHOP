import { JSDOM } from 'jsdom';
import fs from 'node:fs';

const ROUTES = ['/', '/work', '/about', '/contact', '/resume', '/privacy',
  '/work/cornetto', '/work/tau-foods', '/work/louis-vuitton', '/work/audi',
  '/work/nandos', '/work/joshua', '/work/vodacom', '/work/sars', '/does-not-exist'];

const code = fs.readFileSync(new URL('./bundle.js', import.meta.url), 'utf8');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let totalErrors = 0;

for (const route of ROUTES) {
  const errors = [];
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
    url: 'https://papi.example' + route, pretendToBeVisual: true, runScripts: 'outside-only',
  });
  const { window } = dom;
  window.matchMedia = (q) => ({ media: q, matches: /pointer: fine|hover: hover|min-width/.test(q) && !/reduce/.test(q), addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){}, dispatchEvent(){return false;}, onchange: null });
  window.IntersectionObserver = class { constructor(cb){this.cb=cb;} observe(el){ this.cb([{isIntersecting:true,target:el,intersectionRatio:1}], this); } unobserve(){} disconnect(){} takeRecords(){return [];} };
  window.ResizeObserver = class { observe(){} unobserve(){} disconnect(){} };
  window.requestIdleCallback = (cb) => window.setTimeout(() => cb({didTimeout:false,timeRemaining:()=>5}), 0);
  window.cancelIdleCallback = (id) => window.clearTimeout(id);
  window.scrollTo = () => {};
  window.HTMLCanvasElement.prototype.getContext = () => null;
  Object.defineProperty(window.document, 'fonts', { value: { ready: Promise.resolve() }, configurable: true });
  window.addEventListener('error', (e) => errors.push('error: ' + (e.error?.stack || e.message)));
  window.addEventListener('unhandledrejection', (e) => errors.push('rejection: ' + e.reason));
  const oe = window.console.error;
  window.console.error = (...a) => { errors.push('console.error: ' + a.map(String).join(' ').slice(0,300)); };
  try { window.eval(code); } catch (e) { errors.push('THREW: ' + e.stack); }
  await wait(1500);
  const nodes = window.document.getElementById('root').querySelectorAll('*').length;
  const boundary = (window.document.body.textContent || '').includes('Something went wrong');
  totalErrors += errors.length;
  console.log(`${errors.length === 0 && nodes > 20 && !boundary ? 'PASS' : 'FAIL'}  ${route.padEnd(24)} nodes=${String(nodes).padStart(4)}  errors=${errors.length}`);
  errors.slice(0,3).forEach((e) => console.log('        · ' + e.slice(0,240)));
  window.close();
}
console.log('\nTOTAL ERRORS:', totalErrors);
