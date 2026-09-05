import { JSDOM } from 'jsdom';
import fs from 'node:fs';
const code = fs.readFileSync(new URL('./bundle.js', import.meta.url), 'utf8');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'https://papi.example/work/audi', pretendToBeVisual: true, runScripts: 'outside-only' });
const { window } = dom;
window.matchMedia = (q) => ({ media: q, matches: /pointer: fine|hover: hover|min-width/.test(q), addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){}, dispatchEvent(){return false;}, onchange:null });
window.IntersectionObserver = class { constructor(cb){this.cb=cb;} observe(el){ this.cb([{isIntersecting:true,target:el,intersectionRatio:1}], this); } unobserve(){} disconnect(){} takeRecords(){return [];} };
window.ResizeObserver = class { observe(){} unobserve(){} disconnect(){} };
window.requestIdleCallback = (cb) => window.setTimeout(() => cb({didTimeout:false,timeRemaining:()=>5}), 0);
window.scrollTo = () => {};
window.HTMLCanvasElement.prototype.getContext = () => null;
Object.defineProperty(window.document, 'fonts', { value: { ready: Promise.resolve() }, configurable: true });
const errors = []; window.console.error = (...a) => errors.push(a.map(String).join(' ').slice(0,200));
window.addEventListener('error', (e) => errors.push(String(e.error?.stack || e.message)));
window.eval(code);
await wait(1500);
const imgs = [...window.document.querySelectorAll('img')].map((i) => i.getAttribute('src'));
console.log('images on page:'); imgs.forEach((s) => console.log('  ', s));
const tile = window.document.querySelector('.audi-img-zoom');
tile.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
await wait(400);
const iframe = window.document.querySelector('iframe');
console.log('modal iframe:', iframe && iframe.getAttribute('src'));
const txt = window.document.body.textContent || '';
for (const phrase of ['The Bench', 'The Source', 'Woven', 'The Plinth', 'Planted', 'Light Signature', 'Carried', 'Innovation', 'Seating', 'The Empty Plinth', 'A House Wearing']) {
  if (!txt.includes(phrase)) console.log('  MISSING COPY:', phrase);
}
console.log('errors:', errors.length, errors.slice(0,3));
