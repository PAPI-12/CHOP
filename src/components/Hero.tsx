import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ScribbleX, ScribbleUnderline, FloatingCross, FloatingWave } from './Scribbles';
import SplitFlapText from './SplitFlapText';
import { useHeroPhysics, type HeroCursor } from '../hooks/useHeroPhysics';

const RING_WORD = 'CULTURE LED CREATIVE';
/**
 * One label, laid around the full circumference and pinned to it with
 * textLength. Rotating the group (a single transform) instead of shifting the
 * text along the path means zero SVG text re-layout per frame — and because
 * the label exactly fills the circle, the 360-degree wrap is invisible: the
 * words loop forever, never cut mid-glyph, at a font size that fills the ring.
 */
const RING_TEXT = `${RING_WORD} \u00B7 `;

/** Eraser stroke key reserved for the cursor ring; bodies use their own keys. */
const RING_STROKE = -1;

const HeroLetters: React.FC<{ text: string }> = ({ text }) => (
  <>
    {Array.from(text).map((ch, i) =>
      ch === ' ' ? (
        <span key={i}>{' '}</span>
      ) : (
        <span key={i} data-hero-physics="letter" className="hero-physics-letter">
          {ch}
        </span>
      ),
    )}
  </>
);

const Hero: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const ringSpinRef = useRef<SVGGElement>(null);
  const eraserRef = useRef<HTMLCanvasElement>(null);
  const overlayImgRef = useRef<HTMLImageElement>(null);

  const [introComplete, setIntroComplete] = useState(false);
  const [interactive, setInteractive] = useState(false);

  /**
   * Shared cursor state. The ring, the eraser stroke and the physics pusher
   * all read this exact object, so the three can never disagree about where
   * the cursor "is" — that de-sync was the source of the disconnect glitch.
   */
  const cursorRef = useRef<HeroCursor>({ x: 0, y: 0, r: 28, active: false });

  /**
   * Set by the eraser effect, read by the physics solver. Going through a ref
   * means the solver is never restarted just because this callback changes.
   */
  const bodyTrailRef = useRef<((key: number, x: number, y: number, r: number) => void) | null>(null);

  // Unique so the textPath reference can never collide with another instance.
  const ringPathId = `hero-ring-${useId().replace(/:/g, '')}`;

  const handleIntroComplete = useCallback(() => setIntroComplete(true), []);

  useEffect(() => {
    const fine =
      window.matchMedia('(pointer: fine)').matches &&
      window.matchMedia('(hover: hover)').matches;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setInteractive(fine && !reduce);
  }, []);

  // Physics starts only once the headline has finished settling, so the intro
  // is never fighting the solver for the same glyphs.
  useHeroPhysics(heroRef, introComplete && interactive, { cursorRef, onBodyTrail: bodyTrailRef });

  // Safety net: if the split-flap never reports completion (backgrounded tab,
  // throttled timers) hand control over anyway.
  useEffect(() => {
    const t = window.setTimeout(() => setIntroComplete(true), 4200);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const hero = heroRef.current;
    const ring = ringRef.current;
    const canvas = eraserRef.current;
    if (!hero || !ring || !canvas) return;

    let boxLeft = 0;
    let boxTop = 0;
    let boxW = 0;
    let boxH = 0;
    let radius = 28;
    let dpr = 1;

    // Ring spring state (hero-local centre).
    let cx = 0;
    let cy = 0;
    let tx = 0;
    let ty = 0;
    let vx = 0;
    let vy = 0;
    let primed = false;
    let pointerSeen = false;

    /**
     * Eraser strokes, one per emitter: the ring uses RING_STROKE, each physics
     * body uses its own key. Tracking them separately means a letter's trail is
     * never joined to the ring's trail by a stray line across the hero.
     */
    let ctx: CanvasRenderingContext2D | null = null;
    const strokes = new Map<number, { x: number; y: number }>();

    /**
     * The breath comes back.
     *
     * Whatever gets wiped slowly mists over again — one low-alpha composite
     * of the fog tile every REFOG_MS, on a credit counter, so an untouched
     * hero costs nothing at all.
     *
     * The tick budget is sized so the pane genuinely reaches full opacity
     * again: 0.978^220 leaves about 1% of the wipe showing, which is
     * invisible. The previous budget stopped ~11% short, and because that
     * residue accumulated with every pass the glass slowly cleared itself
     * and never fogged back up.
     */
    const REFOG_MS = 90;
    const REFOG_TICKS = 220;
    const REFOG_ALPHA = 0.022;
    let refogTicks = 0;
    let lastRefog = 0;

    let raf = 0;
    let lastT = 0;
    let spin = 0;
    let ringC = 0;

    const syncBox = () => {
      const r = hero.getBoundingClientRect();
      boxLeft = r.left;
      boxTop = r.top;
      boxW = r.width;
      boxH = r.height;
    };

    /**
     * Ring diameter tracks the "O" of AWESOMENESS, a touch smaller so it reads
     * as nested inside the counter rather than covering it.
     */
    const measureRing = () => {
      const o = hero.querySelector<HTMLElement>('[data-ring-gauge="O"]');
      if (o) {
        // Cap height of Inter Black is ~0.73em; that is the visual diameter of
        // an uppercase O. Deriving it from font-size is exact, whereas the
        // element box includes line-height leading.
        const fs = parseFloat(getComputedStyle(o).fontSize) || 0;
        const glyphDiameter = fs * 0.73;
        // "A tiny bit smaller than the O".
        radius = Math.max((glyphDiameter * 0.92) / 2, 16);
      } else {
        radius = Math.max(Math.min(boxW, boxH) * 0.035, 22);
      }
      cursorRef.current.r = radius;

      const size = Math.ceil(radius * 2);
      ring.style.width = `${size}px`;
      ring.style.height = `${size}px`;

      const svg = ring.querySelector('svg');
      const path = ring.querySelector('path');
      const text = ring.querySelector('text');
      // textLength is honoured on <textPath> by some engines and on <text> by
      // others — write it to both so the label is circumference-pinned (and
      // therefore seamless) in every browser.
      const textPath = ring.querySelector('textPath');
      if (svg) svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
      if (path) {
        // Text baseline sits just inside the ring edge.
        const pr = Math.max(radius - Math.max(radius * 0.24, 8), 6);
        const c = size / 2;
        ringC = c;
        path.setAttribute(
          'd',
          `M ${c} ${c - pr} A ${pr} ${pr} 0 1 1 ${c - 0.01} ${c - pr}`,
        );
        if (text) {
          // single label pinned to the exact circumference; `spacing` adjusts
          // letter gaps ONLY, so glyphs keep their true shapes (no stretch) and
          // the loop never cuts a word.
          const px = Math.max(12, Math.min(22, radius * 0.4));
          const circumference = (2 * Math.PI * pr).toFixed(1);
          text.setAttribute('font-size', String(px));
          text.setAttribute('textLength', circumference);
          text.setAttribute('lengthAdjust', 'spacing');
          if (textPath) {
            textPath.setAttribute('textLength', circumference);
            textPath.setAttribute('lengthAdjust', 'spacing');
          }
        }
      }
    };

    /**
     * ── The humid glass ────────────────────────────────────────────────
     *
     * The hero is no longer a flat dark scrim. It is a pane of fogged
     * shower glass sitting in front of the photograph: the same image
     * blurred out of focus, cooled, and beaded with condensation. Wiping it
     * (cursor ring, displaced letters) squeegees the steam away and the
     * sharp, full-colour portrait shows through — and, because the room is
     * humid, the mist slowly creeps back over whatever was wiped.
     *
     * The fog is rendered ONCE into an offscreen tile. Every subsequent
     * operation is a single drawImage, so nothing here re-filters or
     * re-blurs per frame — that is what keeps the hero at a steady 60fps.
     */
    let fog: HTMLCanvasElement | null = null;

    /** Deterministic noise so the condensation pattern is stable per size. */
    const seeded = (s: number) => () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };

    const buildFog = () => {
      if (boxW < 8 || boxH < 8) return;
      if (!fog) fog = document.createElement('canvas');
      fog.width = Math.max(1, Math.floor(boxW * dpr));
      fog.height = Math.max(1, Math.floor(boxH * dpr));
      const f = fog.getContext('2d');
      if (!f) return;
      f.setTransform(dpr, 0, 0, dpr, 0, 0);
      f.globalCompositeOperation = 'source-over';
      f.globalAlpha = 1;
      f.clearRect(0, 0, boxW, boxH);

      const src = overlayImgRef.current;
      if (src && src.complete && src.naturalWidth > 0) {
        // The SAME photograph, thrown far out of focus — that defocus is what
        // reads as glass rather than as a filter. Mirror the <img>'s computed
        // object-fit / object-position so the wiped holes line up exactly with
        // the crisp pixels beneath.
        const scale = Math.max(boxW / src.naturalWidth, boxH / src.naturalHeight);
        const dw = src.naturalWidth * scale;
        const dh = src.naturalHeight * scale;
        let posX = 50;
        let posY = 50;
        const pos = getComputedStyle(src).objectPosition.trim().split(/\s+/);
        if (pos.length === 2) {
          const parsedX = parseFloat(pos[0]);
          const parsedY = parseFloat(pos[1]);
          if (Number.isFinite(parsedX)) posX = parsedX;
          if (Number.isFinite(parsedY)) posY = parsedY;
        }
        const ox = (boxW - dw) * (posX / 100);
        const oy = (boxH - dh) * (posY / 100);
        // Overscan past the canvas so the blur kernel never samples the
        // transparent edge and leaves a bright rim around the pane.
        const pad = 84;
        // Heavier defocus than before: through breath on glass you get shape
        // and tone, never an edge. That total loss of detail is the whole
        // illusion — and it is also why the wipe feels like a reveal.
        f.filter = 'blur(26px) saturate(0.44) brightness(0.79) contrast(0.96)';
        f.drawImage(src, ox - pad, oy - pad, dw + pad * 2, dh + pad * 2);
        f.filter = 'none';
      } else {
        f.fillStyle = '#1b1b18';
        f.fillRect(0, 0, boxW, boxH);
      }

      /* Warm breath on cold glass.
         The signature of real condensation is not detail, it is DIFFUSION:
         an even milky veil that thins toward the edges of the breath. So
         there is deliberately no speckle, no beading and no drips here —
         those read as a dirty window rather than a misted one. Three broad
         washes and nothing else. */

      // 1 — the veil. Cool, milky, and heaviest through the middle of the
      // pane where breath actually lands.
      const bloom = f.createRadialGradient(
        boxW * 0.5, boxH * 0.44, Math.min(boxW, boxH) * 0.05,
        boxW * 0.5, boxH * 0.46, Math.max(boxW, boxH) * 0.78,
      );
      bloom.addColorStop(0, 'rgba(222,238,246,0.34)');
      bloom.addColorStop(0.55, 'rgba(214,232,240,0.25)');
      bloom.addColorStop(1, 'rgba(206,226,236,0.14)');
      f.fillStyle = bloom;
      f.fillRect(0, 0, boxW, boxH);

      // 2 — where the breath pooled. A handful of very large, very soft
      // clouds at low alpha: enough to stop the veil looking sprayed on,
      // far too broad to ever read as specks.
      const rnd = seeded(9187 + Math.round(boxW) * 31 + Math.round(boxH));
      const clouds = 7;
      for (let i = 0; i < clouds; i++) {
        const cxp = (0.12 + rnd() * 0.76) * boxW;
        const cyp = (0.08 + rnd() * 0.8) * boxH;
        const rad = Math.max(boxW, boxH) * (0.18 + rnd() * 0.26);
        const g = f.createRadialGradient(cxp, cyp, 0, cxp, cyp, rad);
        const a = 0.035 + rnd() * 0.045;
        g.addColorStop(0, `rgba(233,244,248,${a.toFixed(3)})`);
        g.addColorStop(0.6, `rgba(233,244,248,${(a * 0.45).toFixed(3)})`);
        g.addColorStop(1, 'rgba(233,244,248,0)');
        f.fillStyle = g;
        f.fillRect(0, 0, boxW, boxH);
      }

      // 3 — the grade. Keeps the headline readable against the pane and
      // sits the hero back into the site's dark. Cream type over milk is
      // unreadable; this is what buys the contrast back.
      const grade = f.createLinearGradient(0, 0, 0, boxH);
      grade.addColorStop(0, 'rgba(23,25,24,0.30)');
      grade.addColorStop(0.34, 'rgba(23,25,24,0.20)');
      grade.addColorStop(1, 'rgba(23,25,24,0.74)');
      f.fillStyle = grade;
      f.fillRect(0, 0, boxW, boxH);

      f.globalAlpha = 1;
      f.globalCompositeOperation = 'source-over';
    };

    /**
     * Lay the fogged pane onto the visible canvas. The hero image sits
     * underneath in full colour; wiping punches holes in this layer.
     */
    const paintOverlay = () => {
      syncBox();
      if (boxW < 8 || boxH < 8) return;
      // The pane is a defocused blur, so it carries no fine detail worth
      // retina pixels. Capping the buffer well under devicePixelRatio cuts the
      // per-wipe fill cost by ~2.5x on a Retina display and is invisible.
      dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      const pxW = Math.floor(boxW * dpr);
      const pxH = Math.floor(boxH * dpr);
      if (canvas.width !== pxW || canvas.height !== pxH) {
        canvas.width = pxW;
        canvas.height = pxH;
      }
      canvas.style.width = `${boxW}px`;
      canvas.style.height = `${boxH}px`;

      ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, boxW, boxH);

      buildFog();
      if (fog) ctx.drawImage(fog, 0, 0, boxW, boxH);
      refogTicks = 0;
      strokes.clear();
    };

    /**
     * The squeegee.
     *
     * A single soft-edged brush sprite, built once, stamped along the path
     * from the emitter's previous point to (x, y) with destination-out.
     *
     * Stamping a pre-rendered radial falloff is what makes the cleared area
     * look like glass wiped by a hand: the edge is a gradient, so the mist
     * thins out rather than ending on a circle. It is also the cheapest way
     * to do it — no per-frame ctx.filter, no multi-pass alpha stack, and the
     * interpolation means a fast sweep leaves one continuous trail instead
     * of a dotted line.
     *
     * There is no "wet rim" pass. Piling bright alpha around every stroke is
     * what made the pane look grubby rather than clear.
     */
    let brush: HTMLCanvasElement | null = null;
    let brushR = 0;

    const buildBrush = (r: number) => {
      const size = Math.ceil(r * 2);
      if (brush && brushR === r) return brush;
      brush = brush || document.createElement('canvas');
      brush.width = size;
      brush.height = size;
      const b = brush.getContext('2d');
      if (!b) return null;
      b.clearRect(0, 0, size, size);
      const g = b.createRadialGradient(r, r, 0, r, r, r);
      g.addColorStop(0, 'rgba(0,0,0,1)');
      g.addColorStop(0.62, 'rgba(0,0,0,0.98)');
      g.addColorStop(0.84, 'rgba(0,0,0,0.55)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      b.fillStyle = g;
      b.fillRect(0, 0, size, size);
      brushR = r;
      return brush;
    };

    const erase = (key: number, x: number, y: number, r: number) => {
      if (!ctx) return;
      const prev = strokes.get(key);
      // Nothing meaningful moved: skip the composite op entirely.
      if (prev && Math.hypot(x - prev.x, y - prev.y) < 0.6) return;

      // The breath has something to reclaim again.
      refogTicks = REFOG_TICKS;

      // Brushes are cached per radius; the ring and the letters use two
      // sizes between them, so this rebuilds at most twice.
      const sprite = buildBrush(Math.round(r * 1.18));
      if (!sprite) return;
      const br = sprite.width / 2;

      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = 1;

      const stamp = (px: number, py: number) => {
        ctx!.drawImage(sprite, px - br, py - br, sprite.width, sprite.height);
      };

      if (prev) {
        const dx = x - prev.x;
        const dy = y - prev.y;
        const dist = Math.hypot(dx, dy);
        // Overlap the stamps by two thirds so the trail is solid, and cap the
        // count so a huge jump (tab restore, scroll snap) can never stall a
        // frame drawing hundreds of sprites.
        const step = Math.max(r * 0.34, 1);
        const n = Math.min(Math.ceil(dist / step), 48);
        for (let i = 1; i <= n; i++) stamp(prev.x + (dx * i) / n, prev.y + (dy * i) / n);
      }
      stamp(x, y);

      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;

      if (prev) { prev.x = x; prev.y = y; }
      else strokes.set(key, { x, y });
    };

    // Handed to the physics solver so every displaced letter carves its own
    // path through the overlay, exactly like the ring does.
    bodyTrailRef.current = erase;

    const centre = () => {
      tx = boxW / 2;
      ty = boxH / 2;
      if (!primed) {
        primed = true;
        cx = tx;
        cy = ty;
      }
    };

    syncBox();
    measureRing();
    paintOverlay();
    centre();

    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    fonts?.ready
      .then(() => {
        measureRing();
        paintOverlay();
        centre();
      })
      .catch(() => {});

    const img = overlayImgRef.current;
    if (img && !img.complete) img.addEventListener('load', paintOverlay);

    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        primed = false;
        measureRing();
        paintOverlay();
        centre();
      }, 140);
    };
    window.addEventListener('resize', onResize, { passive: true });

    let scrollTick = false;
    const onScroll = () => {
      if (scrollTick) return;
      scrollTick = true;
      requestAnimationFrame(() => { scrollTick = false; syncBox(); });
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const x = e.clientX - boxLeft;
      const y = e.clientY - boxTop;

      // Outside the hero: park the ring back at centre rather than pinning it
      // to an edge, and stop erasing.
      if (x < 0 || y < 0 || x > boxW || y > boxH) {
        pointerSeen = false;
        // Break only the ring's stroke; re-entering elsewhere must not erase a
        // straight line from the old exit point. Letter trails are keyed
        // separately and are unaffected.
        strokes.delete(RING_STROKE);
        centre();
        return;
      }

      pointerSeen = true;
      tx = x;
      ty = y;
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    // Critically-damped-ish spring: fast enough to feel attached to the
    // cursor, soft enough to read as a physical object.
    const STIFF = 300;
    const DAMP = 30;
    const MASS = 0.5;

    // The hero keeps a per-frame spring + writes running the whole page life,
    // which is wasted work once it has scrolled away — gate the loop on
    // visibility so sections below the hero never pay for it.
    let heroVisible = true;
    const io = new IntersectionObserver(
      ([entry]) => { heroVisible = !!entry?.isIntersecting; if (heroVisible) lastT = 0; },
      { rootMargin: '10% 0px' },
    );
    io.observe(hero);

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!heroVisible || document.hidden) { lastT = 0; return; }
      const dt = lastT ? Math.min((now - lastT) / 1000, 0.032) : 1 / 60;
      lastT = now;

      vx += ((-STIFF * (cx - tx) - DAMP * vx) / MASS) * dt;
      vy += ((-STIFF * (cy - ty) - DAMP * vy) / MASS) * dt;
      cx += vx * dt;
      cy += vy * dt;

      // Hard clamp: the ring can never leave the hero rectangle.
      const r = radius;
      cx = Math.max(r, Math.min(boxW - r, cx));
      cy = Math.max(r, Math.min(boxH - r, cy));

      // Publish before anything reads it, so ring / eraser / physics all use
      // one identical position this frame.
      const c = cursorRef.current;
      c.x = cx;
      c.y = cy;
      c.r = radius;
      c.active = pointerSeen;

      ring.style.transform = `translate3d(${(cx - r).toFixed(2)}px, ${(cy - r).toFixed(2)}px, 0)`;
      ring.style.opacity = primed ? '1' : '0';

      // The steam creeps back over anything that was wiped. Throttled hard,
      // and switched off completely once the pane has recovered.
      if (ctx && fog && refogTicks > 0 && now - lastRefog >= REFOG_MS) {
        lastRefog = now;
        refogTicks--;
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = REFOG_ALPHA;
        ctx.drawImage(fog, 0, 0, boxW, boxH);
        ctx.globalAlpha = 1;
      }

      if (pointerSeen) {
        erase(RING_STROKE, cx, cy, radius);
        // Gentle continuous rotation of the label. Rotating the group (one
        // transform) instead of shifting text along the path keeps every frame
        // free of SVG text re-layout — the big lag source while sweeping.
        // The circumference-pinned label makes the loop seamless.
        spin = (spin + dt * 14) % 360;
        ringSpinRef.current?.setAttribute(
          'transform',
          `rotate(${spin.toFixed(2)} ${ringC} ${ringC})`,
        );
      }
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      bodyTrailRef.current = null;
      window.clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointermove', onPointerMove);
      img?.removeEventListener('load', paintOverlay);
    };
  }, [interactive]);

  const frozen = introComplete && interactive;

  return (
    <section
      id="hero"
      ref={heroRef}
      className="relative h-[100svh] min-h-[540px] flex items-center justify-center overflow-hidden bg-[#171715]"
    >
      <div className="absolute inset-0 z-0">
        {/* ONE hero plate. There is no second crop and no <picture> switch:
            the steam is generated from this exact image, so what you see
            ghosting through the fog is always what you uncover underneath.
            Three widths so a phone never downloads a 2560px file. */}
        <img
          ref={overlayImgRef}
          src="/images/hero-landscape-1920.webp"
          srcSet="/images/hero-landscape-1280.webp 1280w, /images/hero-landscape-1920.webp 1920w, /images/hero-landscape-2560.webp 2560w"
          sizes="100vw"
          alt="Papi Raborife"
          className="hero-photo absolute inset-0 h-full w-full object-cover"
          width="2560"
          height="1429"
          fetchPriority="high"
          decoding="async"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        {interactive ? (
          <canvas ref={eraserRef} className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden />
        ) : (
          // No cursor to wipe with — present the pane already fogged, in CSS,
          // so touch and reduced-motion visitors still get the glass.
          <div className="hero-glass-static absolute inset-0" aria-hidden />
        )}
      </div>

      {/* Ambient floating crosses */}
      <FloatingCross className="absolute top-[12%] left-[7%] z-20 hidden sm:block" size={38} duration={6.5} delay={0} frozen={frozen} />
      <FloatingCross className="absolute top-[18%] right-[11%] z-20 hidden md:block" size={24} duration={5.5} delay={0.5} frozen={frozen} />
      <FloatingCross className="absolute top-[32%] left-[15%] z-20 hidden md:block" size={28} duration={7} delay={0.3} frozen={frozen} />
      <FloatingCross className="absolute top-[8%] right-[26%] z-20 hidden lg:block" size={18} duration={6} delay={0.9} frozen={frozen} />
      <FloatingCross className="absolute bottom-[24%] right-[8%] z-20 hidden sm:block" size={30} duration={7.5} delay={0.2} frozen={frozen} />
      <FloatingCross className="absolute bottom-[16%] left-[11%] z-20 hidden sm:block" size={22} duration={5.8} delay={1} frozen={frozen} />
      <FloatingCross className="absolute top-[48%] left-[4%] z-20 hidden lg:block" size={16} duration={6.2} delay={1.2} frozen={frozen} />
      <FloatingCross className="absolute top-[58%] right-[17%] z-20 hidden md:block" size={20} duration={6.4} delay={0.8} frozen={frozen} />
      <FloatingCross className="absolute bottom-[38%] left-[22%] z-20 hidden lg:block" size={14} duration={5.2} delay={1.4} frozen={frozen} />
      <FloatingCross className="absolute top-[70%] left-[40%] z-20 hidden xl:block" size={16} duration={6.8} delay={0.6} frozen={frozen} />

      {/* Ambient floating waves */}
      <FloatingWave className="absolute top-[24%] right-[15%] z-20 hidden md:block" width={140} duration={7.5} delay={0} frozen={frozen} />
      <FloatingWave className="absolute top-[44%] left-[3%] z-20 hidden lg:block" width={110} duration={8.5} delay={0.4} frozen={frozen} />
      <FloatingWave className="absolute bottom-[32%] right-[5%] z-20 hidden md:block" width={130} duration={7} delay={0.9} frozen={frozen} />
      <FloatingWave className="absolute bottom-[14%] left-[17%] z-20 hidden sm:block" width={100} duration={8} delay={0.6} frozen={frozen} />
      <FloatingWave className="absolute top-[62%] right-[23%] z-20 hidden lg:block" width={90} duration={6.5} delay={1.1} frozen={frozen} />

      {/* Static scribbles for depth */}
      <ScribbleX data-hero-physics="deco" className="absolute top-[20%] left-[28%] w-6 h-6 z-20 opacity-50 rotate-12 hidden md:block" />
      <ScribbleUnderline data-hero-physics="deco" className="absolute top-[28%] right-[22%] w-28 h-3 z-20 opacity-60 rotate-3 hidden md:block" />

      <div className="relative z-10 text-center px-4 w-full max-w-[96vw]">
        <h1 className="sr-only">CRAFTING AWESOMENESS SINCE 2015</h1>
        <p className="hero-rise text-[10px] sm:text-xs md:text-sm font-bold tracking-[0.35em] uppercase mb-6 md:mb-8 text-[#9a9a93]">
          Papi Raborife
        </p>

        <div className="relative flex flex-col items-center justify-center w-full">
          <h1
            aria-hidden="true"
            className="hero-pop font-display text-[#f5f3ee] text-[clamp(2.2rem,10.8vw,10rem)] md:text-[clamp(3.5rem,8.6vw,9.5rem)] leading-[0.86] tracking-[-0.04em] whitespace-nowrap"
          >
            <HeroLetters text="CRAFTING" />
          </h1>

          <h1
            className="hero-fade font-display text-[clamp(2.2rem,10.8vw,10rem)] md:text-[clamp(3.5rem,8.6vw,9.5rem)] leading-[0.86] tracking-[-0.04em] max-w-full whitespace-nowrap"
            aria-hidden="true"
          >
            <SplitFlapText
              target="AWESOMENESS"
              startDelay={815}
              step={163}
              interval={70}
              onComplete={handleIntroComplete}
            />
          </h1>

          <h1
            aria-hidden="true"
            className="hero-pop hero-pop-late font-display text-stroke text-[clamp(2.2rem,10.8vw,10rem)] md:text-[clamp(3.5rem,8.6vw,9.5rem)] leading-[0.86] tracking-[-0.04em] whitespace-nowrap"
          >
            <HeroLetters text="SINCE 2015" />
          </h1>
        </div>
      </div>

      {/* CULTURE LED CREATIVE — a ring that wraps the cursor, sized just under
          the "O" of AWESOMENESS. Only rendered where there is a real cursor. */}
      {interactive && (
        <div
          ref={ringRef}
          className="hero-ring absolute top-0 left-0 z-30 pointer-events-none"
          style={{ opacity: 0 }}
          aria-hidden
        >
          <svg width="100%" height="100%" className="overflow-visible block">
            <defs>
              <path id={ringPathId} fill="none" />
            </defs>
            {/* Text only — no extra circles; the site's own cursor circle is
                the ring. Pure lime, no dark halo: same paint as the crosses. */}
            <g ref={ringSpinRef}>
              <text
                fill="#d7ff4f"
                fontFamily="'JetBrains Mono', ui-monospace, SFMono-Regular, monospace"
                fontWeight="500"
              >
                <textPath href={`#${ringPathId}`} startOffset="0%">
                  {RING_TEXT}
                </textPath>
              </text>
            </g>
          </svg>
        </div>
      )}

      <div className="absolute left-4 sm:left-6 bottom-10 md:bottom-12 hidden md:flex flex-col gap-4 text-[10px] md:text-xs font-bold text-[#8f8f88] z-30">
        <Link to="/resume" className="hover:text-[#f5f3ee] transform -rotate-90 tracking-[0.2em]">
          RESUME
        </Link>
      </div>

      <div className="absolute right-4 sm:right-6 bottom-10 md:bottom-12 hidden md:flex items-center gap-2 text-[10px] font-bold text-[#8f8f88] tracking-[0.25em] z-30">
        <span>STUDIO MODE</span>
        <div className="flex gap-[2px] h-3 items-end">
          <div className="w-[2px] h-full bg-[#d7ff4f] animate-pulse" />
          <div className="w-[2px] h-1/2 bg-[#d7c4aa] animate-pulse" />
          <div className="w-[2px] h-3/4 bg-[#f5f3ee] animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
