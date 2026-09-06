import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import CTAButton from './CTAButton';
import type { MatrixHandoff } from './WhatIDo';

/* ═══════════════════════════════════════════════════════════════════════
   SELECTED WORK — handed over from What I Do by the code itself.

   What I Do ends with the machine's rain, and that rain never stops at the
   section boundary. Once the matrix has been revealed it carries on HERE as
   this section's own rain — over the WHOLE Selected Work section, from the
   instant its leading edge arrives until the moment its last card leaves.
   Scroll as fast or as slow as you like, rush the human text or wait it
   out: the outcome is the same, because the rain is driven by one click of
   the machine being revealed, not by a timer or by how far you've scrolled.

   The three cards are cut out of that code one after another — each struck
   as a lime hairline, opened into a rectangle, its title resolving out of
   scrambled glyphs.

   The rain's life is tied to THIS section being on screen, not to What I
   Do: while any part of Selected Work is in the viewport the raindrops are
   at full strength, and they only stop when this section itself leaves —
   the end of Selected Work. Coming back up through it, the code and rain
   are gone and the What I Do skills are there instead.

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
 * Only the card reveal is local. The rain's one-shot lifetime belongs to
 * What I Do, so mounting (including StrictMode's effect replay) cannot
 * consume the incoming rain before the visitor has ever seen it.
 */
let workRevealSpent = false;

const SelectedWork: React.FC<{
  projects: Project[];
  matrixHandoffRef: React.RefObject<MatrixHandoff>;
}> = ({ projects, matrixHandoffRef }) => {
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardRefs = useRef<Array<HTMLElement | null>>([]);
  const titleRefs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* Already-revealed cards stay open, independently of the live rain. */
    if (reduce || workRevealSpent) {
      cardRefs.current.forEach((c) => c?.setAttribute('data-open', '1'));
      titleRefs.current.forEach((t, i) => {
        if (t) t.textContent = projects[i]?.title ?? '';
      });
    }
    /* Reduced motion: no rain, no cutting. The work is simply there. */
    if (canvas) canvas.style.display = reduce ? 'none' : '';
    if (reduce) return;

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
      // Only the leading viewport can be visible while What I Do is still
      // on screen. Seed that area, not the offscreen mobile card stack, so
      // the incoming rain is immediately visible and equally dense on phones.
      ch = Math.min(root.clientHeight, window.innerHeight);
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
    let opened = workRevealSpent;

    /**
     * Follow the actual source section, not the intro's timer or the pin's
     * clamped progress. Rain stays FULL throughout the overlap, including
     * when the visitor pauses or reverses direction. The shared latch only
     * ends after What I Do leaves completely or its matrix phase is cleared.
     */
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!onScreen || document.hidden) {
        // Leaving view clears the scoped canvas so no stale code lingers in
        // the section's buffer (and the smoke test's dry-state can be relied
        // on). The section is scoped, so this never affects anything else.
        lastT = 0;
        if (drawn && ctx) { ctx.clearRect(0, 0, cw, ch); drawn = false; }
        return;
      }
      const dt = lastT ? Math.min((now - lastT) / 1000, 0.05) : 1 / 60;
      lastT = now;

      const { revealed } = matrixHandoffRef.current;
      // Once the matrix has been revealed, the code no longer stops at the
      // What I Do boundary. It carries on over the WHOLE Selected Work section
      // — while any part of it is on screen the raindrops are present at full
      // strength, and they only stop when this section itself leaves view
      // (the end of Selected Work) or the matrix was never revealed. Scoping
      // it to this section means it can never paint over anything else.
      const rect = root.getBoundingClientRect();
      const vh = window.innerHeight;
      const alpha = revealed && rect.top < vh && rect.bottom > 0 ? 1 : 0;

      // The cards are cut out of the code once it is properly over the grid.
      if (!opened && rect.top <= vh * 0.75) {
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
      // Spend the reveal when it is actually seen, never during effect setup.
      workRevealSpent = true;
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
  }, [projects, matrixHandoffRef]);

  return (
    <section
      ref={rootRef}
      className="relative z-20 overflow-hidden px-4 sm:px-6 lg:px-12 xl:px-24 py-20 md:py-32 bg-[#000000]"
    >
      {/* The code that carried you here. Scoped to this section — it can
          never paint over anything else on the page. Raindrops cover the
          visible part of the section as it is pulled up (the cards are cut
          out of that code); it stops only when the source section is fully out of
          view or the visitor clears its matrix phase. */}
      <canvas
        ref={canvasRef}
        aria-hidden
        className="matrix-rain pointer-events-none absolute inset-0 z-0"
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
                <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-transparent to-transparent" />
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
