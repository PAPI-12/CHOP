import { JSDOM } from 'jsdom';
import fs from 'node:fs';

const errors = [];
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'https://papi.example/',
  pretendToBeVisual: true,
  runScripts: 'outside-only',
});
const { window } = dom;

// ── Browser APIs jsdom does not implement ─────────────────────────────
window.matchMedia = (q) => ({
  media: q,
  // Simulate a desktop, fine pointer, motion allowed.
  matches: /pointer: fine|hover: hover|min-width/.test(q) && !/reduce/.test(q),
  onchange: null,
  addListener() {}, removeListener() {},
  addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false; },
});
class IO { constructor(cb){ this.cb = cb; } observe(el){ this.cb([{ isIntersecting: true, target: el, intersectionRatio: 1 }], this); } unobserve(){} disconnect(){} takeRecords(){ return []; } }
window.IntersectionObserver = IO;
window.ResizeObserver = class { observe(){} unobserve(){} disconnect(){} };
window.requestIdleCallback = (cb) => window.setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 5 }), 0);
window.cancelIdleCallback = (id) => window.clearTimeout(id);
window.scrollTo = function (x, y) {
  if (typeof x === 'object' && x) { y = x.top ?? 0; }
  Object.defineProperty(window, 'scrollY', { value: y || 0, configurable: true, writable: true });
};
window.HTMLCanvasElement.prototype.getContext = () => null; // exercise the null-ctx guards
window.HTMLMediaElement && (window.HTMLMediaElement.prototype.play = () => Promise.resolve());
Object.defineProperty(window.document, 'fonts', { value: { ready: Promise.resolve(), check: () => true }, configurable: true });

window.addEventListener('error', (e) => errors.push('window error: ' + (e.error?.stack || e.message)));
window.addEventListener('unhandledrejection', (e) => errors.push('rejection: ' + e.reason));
const origError = window.console.error;
window.console.error = (...a) => { errors.push('console.error: ' + a.map(String).join(' ').slice(0, 400)); origError(...a); };

const code = fs.readFileSync(new URL('./bundle.js', import.meta.url), 'utf8');
try {
  dom.window.eval(code);
} catch (e) {
  errors.push('THREW: ' + e.stack);
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
await wait(400);

const root = window.document.getElementById('root');
const text = root.textContent || '';
console.log('--- rendered nodes:', root.querySelectorAll('*').length);
console.log('--- has hero section:', !!window.document.getElementById('hero'));
console.log('--- has nav:', !!window.document.getElementById('main-nav'));
console.log('--- has transition layer:', !!window.document.querySelector('.page-transition'));
console.log('--- sample copy:', JSON.stringify(text.slice(0, 120)));

// Drive a client-side navigation the way a visitor would.
const workLink = [...window.document.querySelectorAll('a')].find((a) => a.getAttribute('href') === '/work');
console.log('--- found /work link:', !!workLink);
if (workLink) {
  workLink.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
  await wait(1600);
  console.log('--- pathname after transition:', window.location.pathname);
  console.log('--- work heading present:', (window.document.body.textContent || '').includes('SELECTED'));
}

console.log('\n=== ERRORS (' + errors.length + ') ===');
for (const e of errors.slice(0, 12)) console.log('•', e);
process.exit(0);
