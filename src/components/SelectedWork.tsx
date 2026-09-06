import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import CTAButton from './CTAButton';

/* ═══════════════════════════════════════════════════════════════════════
   SELECTED WORK — handed over from What I Do by the code itself.

   What I Do ends with the machine's rain. That rain does not stop at the
   section boundary: while the What I Do stage slides up out of view, the
   code rains off its bottom edge and continues HERE as this section's own
   rain — raindrops overlapping the whole section while it is pulled up.
   At FULL strength the instant the section's leading edge arrives, the
   three cards are cut out of it one after another — each struck as a lime
   hairline, opened into a rectangle, its title resolving out of scrambled
   glyphs. Then, as the section lands, the code rains itself out — gone by
   the time the visitor is ON the section and it is just the work again.

   The rain's strength is scroll-driven, not timer-driven: it follows the
   section's own arrival, so however fast or slow you scroll, it is present
   for the whole overlap and disappears exactly when you arrive.

   The canvas is scoped INSIDE this section. It cannot leak onto the rest of
   the page the way a viewport-fixed layer can.
   ═══════════════════════════════════════════════════════════════════════ */

/** The site's own vocabulary, so the rain reads as PAPI code. */
const GLYPHS = 'CRAFTINGAWESOMENESS2015CULTRLDVIXPAPI·0123456789<>*+-=/\\|#$%&@';

export type Project = {
  title: string;
  subtitle: string;
  image: string;
  link: string;
};

type Col = { x: number; y: number; speed: number; len: number; seed: number };

const glyphFor = (n: number) => GLYPHS[Math.abs(n) % GLYPHS.length];

/** Cards land one after another, not all at once. */
const CARD_STAGGER_MS = 260;
/** How long a title takes to resolve out of noise. */
const DECODE_MS = 620;

/**
 * The matrix hand-off is a once-per-page-load signature. The first time this
 * section arrives the code rains over it and cuts the cards out; any later
 * visit in the same SPA session (or a return after navigating) shows the work
 * already landed, with no code. A full reload re-initialises the module and
 * the signature plays again.
 */
let handoffRainSpent = false;

const SelectedWork: React.FC<{ projects: Project[] }> = ({ projects }) => {
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardRefs = useRef<Array<HTMLElement | null>>([]);
  const titleRefs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* Reduced motion: no rain, no cutting. The work is simply there. */
    if (reduce) {
      cardRefs.current.forEach((c) => c?.setAttribute('data-open', '1'));
      titleRefs.current.forEach((t, i) => {
        if (t) t.textContent = projects[i]?.title ?? '';
      });
      if (canvas) canvas.style.display = 'none';
      return;
    }

    /* ── Already handed over in this page load ────────────────────────
       The code is a once-only signature. If it already played, land the
       cards open and resolved — no rain, no cut-out, no decode. */

    if (handoffRainSpent) {
      cardRefs.current.forEach((c) => c?.setAttribute('data-open', '1'));
      titleRefs.current.forEach((t, i) => {
        if (t) t.textContent = projects[i]?.title ?? '';
      });
      if (canvas) canvas.style.display = 'none';
      return;
    }
    handoffRainSpent = true;

    /* ── The title decode ───────────────────────────────────────────── */

    const decodeTimers: number[] = [];
    const decode = (el: HTMLElement, target: string) => {
      const start = performance.now();
      const tick = () => {
        const t = Math.min(1, (performance.now() - start) / DECODE_MS);
        // Letters lock in left to right; everything ahead of the front is
        // still churning code.
        const locked = Math.floor(t * target.length);
        let out = '';
        for (let i = 0; i < target.length; i++) {
          if (i < locked || target[i] === ' ') out += target[i];
          else out += glyphFor(Math.floor(Math.random() * GLYPHS.length) + i);
        }
        el.textContent = out;
        if (t < 1) {
          decodeTimers.push(requestAnimationFrame(tick));
        } else {
          el.textContent = target;
        }
      };
      decodeTimers.push(requestAnimationFrame(tick));
    };

    /* ── The rain ───────────────────────────────────────────────────── */

    const ctx = canvas?.getContext('2d') ?? null;
    let cols: Col[] = [];
    let cw = 0;
    let ch = 0;
    const ROW = 17;
    const FONT = 14;

    const setup = () => {
      if (!canvas || !ctx) return;
      cw = root.clientWidth;
      ch = root.clientHeight;
      if (cw < 8 || ch < 8) return;
      // Retina rain quadruples the fill cost for no visible gain.
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.floor(cw * dpr);
      canvas.height = Math.floor(ch * dpr);
      canvas.style.width = `${cw}px`;
      canvas.style.height = `${ch}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const spacing = cw < 640 ? 26 : 34;
      const count = Math.ceil(cw / spacing);
      cols = [];
      for (let i = 0; i < count; i++) {
        cols.push({
          x: i * spacing + 8,
          // Pre-scattered, so the first frame is already established rain
          // rather than a starting gun.
          y: Math.random() * ch,
          speed: 150 + Math.random() * 320,
          len: 6 + Math.floor(Math.random() * 10),
          seed: Math.floor(Math.random() * 1000),
        });
      }
    };

    /* ── Choreography ───────────────────────────────────────────────── */

    let raf = 0;
    let lastT = 0;
    let onScreen = false;
    let tick = 0;
    let drawn = false;
    let opened = false;
    /**
     * True once the code has rained itself out on arrival. The signature
     * plays one direction: back-scrolling from below re-shows the settled
     * work, never a second rain.
     */
    let rainDone = false;

    /**
     * Scroll-driven, not timer-driven: this is the same stream What I Do
     * rained off its bottom edge, so its strength follows the section's own
     * arrival —
     *   top >= vh          section still below the viewport  →  dry
     *   0 < top < vh       being pulled up, rain overlaps it  →  FULL
     *   top <= 0           the section is landing             →  raining
     *                      itself out over the first sliver
     *                      of settled scroll
     * so the raindrops overlap the whole section while it arrives and are
     * gone exactly when you are ON it — at any scroll speed.
     */
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!onScreen || document.hidden) { lastT = 0; return; }
      const dt = lastT ? Math.min((now - lastT) / 1000, 0.05) : 1 / 60;
      lastT = now;

      const top = root.getBoundingClientRect().top;
      const vh = window.innerHeight;
      let alpha: number;
      if (rainDone) alpha = 0;
      else if (top >= vh) alpha = 0;
      else if (top > 0) alpha = 1;
      else {
        alpha = Math.max(0, 1 + top / (vh * 0.22));
        if (alpha <= 0) rainDone = true;
      }

      // The cards are cut out of the code once it is properly over the grid.
      if (!opened && top <= vh * 0.75) {
        opened = true;
        openCards();
      }

      // Once it has rained out there is nothing left to compute.
      if (!ctx) return;
      if (alpha <= 0.01) {
        if (drawn) { ctx.clearRect(0, 0, cw, ch); drawn = false; }
        return;
      }

      // Half-cadence: falling code reads as continuous at ~30fps, at half
      // the fillText budget.
      tick ^= 1;
      if (!tick) return;
      drawn = true;

      ctx.clearRect(0, 0, cw, ch);
      ctx.font = `${FONT}px "JetBrains Mono", ui-monospace, monospace`;
      ctx.textBaseline = 'top';
      for (let i = 0; i < cols.length; i++) {
        const col = cols[i];
        col.y += col.speed * dt * 2;
        if (col.y - col.len * ROW > ch) {
          col.y = -Math.random() * ch * 0.4;
          col.speed = 150 + Math.random() * 320;
          col.len = 6 + Math.floor(Math.random() * 10);
        }
        for (let k = 0; k < col.len; k++) {
          const y = col.y - k * ROW;
          if (y < -ROW || y > ch) continue;
          const fade = 1 - k / col.len;
          ctx.globalAlpha = alpha * fade * (k === 0 ? 0.95 : 0.5);
          ctx.fillStyle = k === 0 ? '#f2ffd0' : '#d7ff4f';
          ctx.fillText(glyphFor(col.seed + k + Math.floor(col.y / ROW)), col.x, y);
        }
      }
      ctx.globalAlpha = 1;
    };

    const openCards = () => {
      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        decodeTimers.push(
          window.setTimeout(() => {
            card.setAttribute('data-open', '1');
            const title = titleRefs.current[i];
            if (title) decode(title, projects[i]?.title ?? '');
          }, 340 + i * CARD_STAGGER_MS),
        );
      });
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = !!entry?.isIntersecting;
        if (!onScreen) { lastT = 0; return; }
        setup();
      },
      // Fires the moment the section's leading edge touches the viewport —
      // the exact instant What I Do's stage bottoms out and the code's
      // stream crosses the boundary into this section. The rain's own
      // strength is computed per-frame from the section's position (above),
      // and the cards open from the frame loop, not from here.
      { rootMargin: '0px 0px 0px 0px' },
    );
    io.observe(root);

    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(setup, 150);
    };
    window.addEventListener('resize', onResize, { passive: true });

    setup();
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      decodeTimers.forEach((t) => { cancelAnimationFrame(t); window.clearTimeout(t); });
      io.disconnect();
      window.clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
    };
  }, [projects]);

  return (
    <section
      ref={rootRef}
      className="relative z-20 overflow-hidden px-4 sm:px-6 lg:px-12 xl:px-24 py-20 md:py-32 bg-[#171715]"
    >
      {/* The code that carried you here. Scoped to this section — it can
          never paint over anything else on the page. Raindrops cover the
          WHOLE section while it is pulled up (the cards are cut out of
          that code); when it stops is purely a function of the section's
          arrival, computed per-frame above. */}
      <canvas
        ref={canvasRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
      />

      <div className="relative z-10 max-w-[1600px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 md:mb-16">
          <div>
            <p className="text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase mb-4 text-[#8f8f88]">
              Selected Work
            </p>
            <h2 className="text-[11vw] md:text-[5vw] font-display leading-[0.85] text-[#f5f3ee]">
              FEATURED<br /><span className="text-[#d7c4aa]">PROJECTS</span>
            </h2>
          </div>
          <CTAButton to="/work" className="self-start md:self-auto">VIEW ALL PROJECTS</CTAButton>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {projects.map((project, index) => (
            <article
              key={project.link}
              ref={(el) => { cardRefs.current[index] = el; }}
              data-open="0"
              className="wk-card group relative aspect-[4/5] rounded-2xl"
              style={{ ['--wk-delay' as string]: `${index * 40}ms` }}
            >
              {/* The hairline the card is cut out of. */}
              <span aria-hidden className="wk-card-strike" />
              <Link to={project.link} className="wk-card-inner block h-full w-full overflow-hidden rounded-2xl">
                <img
                  src={project.image}
                  alt={project.title}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover grayscale brightness-50 transition-all duration-700 group-hover:grayscale-0 group-hover:brightness-75 group-hover:scale-105"
                />
                <span aria-hidden className="wk-card-scan" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#171715] via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 p-5 md:p-8">
                  <p className="mb-2 text-[9px] md:text-[10px] uppercase tracking-wider text-[#d7ff4f]">
                    {project.subtitle}
                  </p>
                  <h3
                    ref={(el) => { titleRefs.current[index] = el; }}
                    className="font-display text-xl md:text-3xl text-[#f5f3ee] tabular-nums"
                  >
                    {project.title}
                  </h3>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SelectedWork;
