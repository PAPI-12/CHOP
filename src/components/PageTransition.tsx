import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from 'react';
import { useNavigate } from 'react-router-dom';

/* ═══════════════════════════════════════════════════════════════════════
   THIN LINE → THICK RECTANGLE → FULL-SCREEN MATRIX → NEW PAGE

   A single hairline is struck across the centre of the viewport, grows
   symmetrically outward until the matrix rain owns the whole screen, the
   route is swapped underneath it, and the panel then contracts back to the
   line it came from while the new page rises through it.

   Notes on the mechanics, because they are load-bearing:

   • The panel is clipped, never scaled. `clip-path: inset()` on a fixed,
     full-viewport layer means the rain is revealed in place at its true
     size — scaling would smear the glyphs and betray the illusion that the
     code is behind the page waiting to be let through.
   • The route swap happens on the frame AFTER the panel is fully opaque,
     and the incoming page is held at opacity 0 by `page-enter` until the
     contraction starts. There is no window in which the new page can flash.
   • Navigation is intercepted once, in the capture phase, at the document.
     Every internal <a> on the site inherits the transition without a single
     call site changing.
   ═══════════════════════════════════════════════════════════════════════ */

/** The site's own vocabulary, so the rain reads as PAPI code. */
const GLYPHS = 'CRAFTINGAWESOMENESS2015CULTRLDVIXPAPI·0123456789<>*+-=/\\|#$%&@';

/** Fast, decisive expansion. */
const COVER_MS = 420;
/** Long enough for the incoming route to commit and paint under the cover. */
const HOLD_MS = 110;
/** Slightly slower than the cover, as the brief asks. */
const REVEAL_MS = 480;

/** The hairline the whole thing grows out of. */
const LINE_PX = 2;

const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);
/** Fast off the mark, settling — no overshoot, no bounce. */
const expoOut = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
/** Symmetric ease-in-out for the reveal. */
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

type TransitionCtx = {
  /** Navigate with the full cinematic transition. */
  transitionTo: (to: string, after?: () => void) => void;
};

const Ctx = createContext<TransitionCtx>({ transitionTo: () => {} });

export const usePageTransition = () => useContext(Ctx);

type Col = { x: number; y: number; speed: number; len: number; seed: number };

const PageTransitionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();

  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  const busyRef = useRef(false);
  const rafRef = useRef(0);
  const rainRafRef = useRef(0);
  const timerRef = useRef(0);
  /** Live speed multiplier — the drops surge as the panel opens the new page. */
  const boostRef = useRef(1);

  /* ── The rain ─────────────────────────────────────────────────────── */

  const rainStateRef = useRef<{ cols: Col[]; w: number; h: number; last: number }>({
    cols: [],
    w: 0,
    h: 0,
    last: 0,
  });

  const startRain = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = window.innerWidth;
    const h = window.innerHeight;
    // Retina rain quadruples the fill cost for no visible gain.
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.max(1, Math.floor(w * dpr));
    canvas.height = Math.max(1, Math.floor(h * dpr));
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const spacing = w < 640 ? 26 : 32;
    const count = Math.ceil(w / spacing);
    const cols: Col[] = [];
    for (let i = 0; i < count; i++) {
      cols.push({
        x: i * spacing + 7,
        // Pre-scatter down the screen so the very first frame already reads
        // as established rain rather than as a starting gun.
        y: Math.random() * h,
        speed: 240 + Math.random() * 420,
        len: 7 + Math.floor(Math.random() * 12),
        seed: Math.floor(Math.random() * 1000),
      });
    }
    rainStateRef.current = { cols, w, h, last: 0 };

    // The panel must be OPAQUE from its very first pixel, otherwise the old
    // page shows through the hairline.
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#0c0d0a';
    ctx.fillRect(0, 0, w, h);

    const ROW = 18;
    const frame = (now: number) => {
      rainRafRef.current = requestAnimationFrame(frame);
      const s = rainStateRef.current;
      const dt = s.last ? Math.min((now - s.last) / 1000, 0.05) : 1 / 60;
      s.last = now;

      // Trailing wash rather than a hard clear: this is what gives the code
      // its comet tails.
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(12,13,10,0.30)';
      ctx.fillRect(0, 0, s.w, s.h);

      ctx.font = '700 15px "JetBrains Mono", ui-monospace, SFMono-Regular, monospace';
      ctx.textBaseline = 'top';

      const boost = boostRef.current;
      for (let i = 0; i < s.cols.length; i++) {
        const col = s.cols[i];
        col.y += col.speed * boost * dt;
        if (col.y - col.len * ROW > s.h) {
          col.y = -Math.random() * s.h * 0.35;
          col.speed = 240 + Math.random() * 420;
          col.len = 7 + Math.floor(Math.random() * 12);
        }
        for (let k = 0; k < col.len; k++) {
          const y = col.y - k * ROW;
          if (y < -ROW || y > s.h) continue;
          const fade = 1 - k / col.len;
          ctx.globalAlpha = fade * (k === 0 ? 1 : 0.6);
          ctx.fillStyle = k === 0 ? '#f4ffd8' : '#d7ff4f';
          const idx = Math.abs(col.seed + k + Math.floor(col.y / ROW)) % GLYPHS.length;
          ctx.fillText(GLYPHS[idx], col.x, y);
        }
      }
      ctx.globalAlpha = 1;
    };
    rainRafRef.current = requestAnimationFrame(frame);
  }, []);

  const stopRain = useCallback(() => {
    cancelAnimationFrame(rainRafRef.current);
    rainRafRef.current = 0;
  }, []);

  /* ── The choreography ─────────────────────────────────────────────── */

  const setClip = useCallback((halfPx: number) => {
    const root = rootRef.current;
    if (!root) return;
    const vh = window.innerHeight;
    const inset = Math.max(0, vh / 2 - halfPx);
    root.style.clipPath = `inset(${inset.toFixed(1)}px 0px ${inset.toFixed(1)}px 0px)`;
  }, []);

  const finish = useCallback(() => {
    const root = rootRef.current;
    stopRain();
    if (root) {
      root.style.visibility = 'hidden';
      root.style.pointerEvents = 'none';
      root.style.opacity = '1';
      root.style.clipPath = `inset(50% 0px 50% 0px)`;
    }
    if (lineRef.current) lineRef.current.style.opacity = '0';
    busyRef.current = false;
    boostRef.current = 1;
  }, [stopRain]);

  const transitionTo = useCallback(
    (to: string, after?: () => void) => {
      if (busyRef.current) return;

      // Respect the visitor: no theatrics, just the page they asked for.
      if (prefersReduced()) {
        navigate(to);
        after?.();
        return;
      }

      const root = rootRef.current;
      const line = lineRef.current;
      if (!root) {
        navigate(to);
        after?.();
        return;
      }

      busyRef.current = true;
      boostRef.current = 1;

      /**
       * The code belongs to the homepage.
       *
       * What I Do is where the matrix is established, so a journey that
       * STARTS on the homepage carries it out with you — the rain you were
       * just looking at is the thing that wipes the screen. Move between two
       * inner pages and there is no code to carry: the panel is solid, and
       * the line → rectangle → page motion is identical. Same architecture,
       * no matrix where it was never earned.
       */
      const home = (path: string) => path === '/' || path === '';
      const useRain = home(window.location.pathname) || home(to.split(/[?#]/)[0]);
      const canvas = canvasRef.current;
      if (canvas) canvas.style.opacity = useRain ? '1' : '0';
      if (useRain) startRain();

      root.style.visibility = 'visible';
      root.style.pointerEvents = 'auto';
      root.style.opacity = '1';
      setClip(LINE_PX / 2);
      if (line) line.style.opacity = '1';

      /* Stage 1 + 2 — the hairline grows, symmetrically, into the panel. */
      const t0 = performance.now();
      const cover = (now: number) => {
        const t = clamp01((now - t0) / COVER_MS);
        const e = expoOut(t);
        const target = window.innerHeight / 2;
        setClip(LINE_PX / 2 + (target - LINE_PX / 2) * e);
        if (line) line.style.opacity = String(Math.max(0, 1 - e * 2.2));

        if (t < 1) {
          rafRef.current = requestAnimationFrame(cover);
          return;
        }

        /* Stage 3 — the screen belongs to the code. Swap the route now, while
           nothing of it can possibly be seen. */
        setClip(target);
        navigate(to);
        after?.();

        // Two frames for React to commit and the browser to paint the new
        // route, then the agreed beat of full coverage.
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            timerRef.current = window.setTimeout(() => {
              /* Stage 4 — the rain surges downward, leading the eye into the
                 new page, and the panel contracts back to the line. */
              boostRef.current = 2.6;
              const t1 = performance.now();
              const reveal = (n2: number) => {
                const t2 = clamp01((n2 - t1) / REVEAL_MS);
                const e2 = easeInOut(t2);
                const half = window.innerHeight / 2;
                setClip(half * (1 - e2));
                // The code thins out as it goes, so the last thing seen is
                // the hairline it arrived as.
                root.style.opacity = String(1 - Math.pow(t2, 3) * 0.35);
                if (t2 < 1) {
                  rafRef.current = requestAnimationFrame(reveal);
                } else {
                  finish();
                }
              };
              rafRef.current = requestAnimationFrame(reveal);
            }, HOLD_MS);
          });
        });
      };
      rafRef.current = requestAnimationFrame(cover);
    },
    [finish, navigate, setClip, startRain],
  );

  /* ── One interception to cover every internal link on the site ────── */

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const target = e.target as HTMLElement | null;
      const anchor = target?.closest?.('a');
      if (!anchor) return;
      if (anchor.hasAttribute('download')) return;
      if (anchor.dataset.noTransition !== undefined) return;

      const targetAttr = anchor.getAttribute('target');
      if (targetAttr && targetAttr !== '_self') return;

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return;
      }

      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      // Same page — leave in-page anchors and no-op clicks completely alone.
      if (url.pathname === window.location.pathname && url.search === window.location.search) {
        return;
      }

      // Take the click away from React Router entirely: stopping propagation
      // here means Link's own handler never runs, so the route can only ever
      // change when the panel says so.
      e.preventDefault();
      e.stopPropagation();
      transitionTo(url.pathname + url.search + url.hash);
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [transitionTo]);

  useEffect(
    () => () => {
      cancelAnimationFrame(rafRef.current);
      cancelAnimationFrame(rainRafRef.current);
      window.clearTimeout(timerRef.current);
    },
    [],
  );

  return (
    <Ctx.Provider value={{ transitionTo }}>
      {children}
      <div
        ref={rootRef}
        aria-hidden
        className="page-transition fixed inset-0 z-[70]"
        style={{ visibility: 'hidden', pointerEvents: 'none', clipPath: 'inset(50% 0px 50% 0px)' }}
      >
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
        {/* The stroke itself: a lit hairline that the panel is born from. */}
        <div
          ref={lineRef}
          className="page-transition-line pointer-events-none absolute left-0 right-0 top-1/2"
          style={{ opacity: 0 }}
        />
      </div>
    </Ctx.Provider>
  );
};

export default PageTransitionProvider;
