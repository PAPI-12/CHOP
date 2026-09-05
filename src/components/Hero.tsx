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

/**
 * Module-level, so it survives client-side route changes but NOT a reload.
 * The dark overlay is a first-impression device: once the visitor has been
 * through the hero and navigated away, coming back to Home shows the clean
 * full-colour image with just the letter physics. A real page reload resets
 * this module and the overlay returns.
 */
let overlaySpent = false;
/**
 * Consuming the overlay is deferred by a tick. React's StrictMode mounts,
 * unmounts and re-mounts every effect in development — without this, that
 * synthetic unmount ate the overlay before the visitor ever saw it, and the
 * hero looked broken in dev while being fine in production.
 */
let overlaySpendTimer = 0;

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

    // A re-mount inside the same tick (StrictMode) cancels the pending spend.
    if (overlaySpendTimer) { clearTimeout(overlaySpendTimer); overlaySpendTimer = 0; }

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
     * Humidity. The room never dries out: whatever gets wiped slowly mists
     * over again. One low-alpha composite of the fog tile every REFOG_MS is
     * all it takes — and the credit counter stops the work entirely once the
     * pane has fully recovered, so an idle hero costs nothing.
     */
    const REFOG_MS = 120;
    const REFOG_TICKS = 110;
    const REFOG_ALPHA = 0.02;
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
        const pad = 72;
        f.filter = 'blur(20px) saturate(0.6) brightness(0.66) contrast(1.02)';
        f.drawImage(src, ox - pad, oy - pad, dw + pad * 2, dh + pad * 2);
        f.filter = 'none';
      } else {
        f.fillStyle = '#1b1b18';
        f.fillRect(0, 0, boxW, boxH);
      }

      // Cold steam sitting on the pane. Cool at the top where the mist
      // gathers, deepening to near-black at the foot so the headline and the
      // bottom furniture keep their contrast.
      const steam = f.createLinearGradient(0, 0, 0, boxH);
      steam.addColorStop(0, 'rgba(214,231,236,0.16)');
      steam.addColorStop(0.34, 'rgba(198,216,222,0.10)');
      steam.addColorStop(1, 'rgba(214,231,236,0.03)');
      f.fillStyle = steam;
      f.fillRect(0, 0, boxW, boxH);

      const grade = f.createLinearGradient(0, 0, 0, boxH);
      grade.addColorStop(0, 'rgba(23,23,21,0.44)');
      grade.addColorStop(0.32, 'rgba(23,23,21,0.30)');
      grade.addColorStop(1, 'rgba(23,23,21,0.86)');
      f.fillStyle = grade;
      f.fillRect(0, 0, boxW, boxH);

      // A soft breath of light across the pane — the sheen that tells the eye
      // it is looking AT a surface, not through it.
      const sheen = f.createLinearGradient(0, boxH, boxW, 0);
      sheen.addColorStop(0, 'rgba(255,255,255,0)');
      sheen.addColorStop(0.5, 'rgba(226,242,247,0.05)');
      sheen.addColorStop(1, 'rgba(255,255,255,0)');
      f.fillStyle = sheen;
      f.fillRect(0, 0, boxW, boxH);

      /* Condensation. Baked once: thousands of beads cost nothing at runtime
         because they never get re-drawn, only re-composited. */
      const rnd = seeded(9187 + Math.round(boxW) * 31 + Math.round(boxH));
      const beads = Math.min(1400, Math.round((boxW * boxH) / 2200));
      for (let i = 0; i < beads; i++) {
        const x = rnd() * boxW;
        const y = rnd() * boxH;
        const bias = rnd();
        const r = 0.5 + bias * bias * 3.6;
        f.globalAlpha = 0.16 + rnd() * 0.3;
        // Body: a slightly clearer, slightly cooler lens of water.
        f.fillStyle = 'rgba(233,246,250,0.34)';
        f.beginPath();
        f.arc(x, y, r, 0, Math.PI * 2);
        f.fill();
        // Specular pin-light, up and to the left, like the key light.
        f.globalAlpha = 0.5 + rnd() * 0.45;
        f.fillStyle = 'rgba(255,255,255,0.9)';
        f.beginPath();
        f.arc(x - r * 0.3, y - r * 0.34, Math.max(0.35, r * 0.3), 0, Math.PI * 2);
        f.fill();
        // Shadowed underside gives the bead volume.
        f.globalAlpha = 0.24;
        f.fillStyle = 'rgba(10,12,12,0.75)';
        f.beginPath();
        f.arc(x + r * 0.26, y + r * 0.34, Math.max(0.3, r * 0.34), 0, Math.PI * 2);
        f.fill();
      }
      f.globalAlpha = 1;

      /* Runnels: drips that have already tracked down the glass, cutting
         part-clear channels. Cut with destination-out so the sharp image
         genuinely reads through them. */
      f.globalCompositeOperation = 'destination-out';
      f.lineCap = 'round';
      const runs = Math.max(5, Math.round(boxW / 190));
      for (let i = 0; i < runs; i++) {
        const x = rnd() * boxW;
        const top = rnd() * boxH * 0.5;
        const len = boxH * (0.16 + rnd() * 0.44);
        const w = 1.2 + rnd() * 3.4;
        f.globalAlpha = 0.2 + rnd() * 0.36;
        f.lineWidth = w;
        f.beginPath();
        f.moveTo(x, top);
        const steps = 5;
        for (let s = 1; s <= steps; s++) {
          const t = s / steps;
          f.lineTo(x + Math.sin(t * 6 + i) * (2 + w), top + len * t);
        }
        f.stroke();
        // The bead that stopped at the end of the run.
        f.globalAlpha = 0.42 + rnd() * 0.3;
        f.beginPath();
        f.arc(x + Math.sin(6 + i) * (2 + w), top + len, w * 1.25, 0, Math.PI * 2);
        f.fill();
      }
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

      // Already seen this session: leave the pane clear so the hero image
      // reads at its full quality, and never re-fog it.
      if (overlaySpent) {
        strokes.clear();
        return;
      }

      buildFog();
      if (fog) ctx.drawImage(fog, 0, 0, boxW, boxH);
      refogTicks = 0;
      strokes.clear();
    };

    /**
     * The squeegee. Carve a capsule from the emitter's previous point to
     * (x, y) — drawing the connecting segment, not just a dot, is what makes a
     * fast sweep leave one continuous clean trail instead of a dotted line.
     *
     * A faint wet rim is laid down just outside the wipe first, so the water
     * reads as being pushed aside rather than deleted.
     */
    const erase = (key: number, x: number, y: number, r: number) => {
      if (!ctx) return;
      const prev = strokes.get(key);
      // Nothing meaningful moved: skip the composite op entirely.
      if (prev && Math.hypot(x - prev.x, y - prev.y) < 0.6) return;

      // Humidity has something to reclaim again.
      refogTicks = REFOG_TICKS;

      const moved = prev ? Math.hypot(x - prev.x, y - prev.y) : 0;

      // 1 — moisture shouldered out to the edge of the stroke. Only on real
      // travel: stamping this every frame while the cursor barely moves would
      // pile alpha up in one spot and burn a white blob into the pane.
      if (prev && moved > r * 0.35) {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = 'rgba(228,244,248,1)';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = 0.045;
        ctx.lineWidth = r * 0.5;
        ctx.beginPath();
        ctx.arc(x, y, r * 1.1, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 2 — the wipe itself.
      ctx.globalCompositeOperation = 'destination-out';
      // NOTE: no ctx.filter blur here. A blurred stroke per segment is a
      // full-canvas filter repaint — the main source of hero lag while the
      // cursor sweeps. Two alpha passes fake the feather for nearly free.
      ctx.fillStyle = '#000';
      ctx.strokeStyle = '#000';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (prev) {
        ctx.globalAlpha = 0.4;
        ctx.lineWidth = r * 2;
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      }

      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(x, y, r * 0.85, 0, Math.PI * 2);
      ctx.fill();

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
      if (!overlaySpent && ctx && fog && refogTicks > 0 && now - lastRefog >= REFOG_MS) {
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
      // Leaving the hero (route change or unmount) consumes the overlay —
      // unless we are straight back in a moment, which is a StrictMode
      // remount rather than the visitor actually leaving.
      if (overlaySpendTimer) clearTimeout(overlaySpendTimer);
      overlaySpendTimer = window.setTimeout(() => { overlaySpent = true; }, 80);
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
        {/* Full-colour source image. Wide screens receive a seamless 16:9,
            high-density outpaint so the complete portrait can fill the hero
            without the old side blocks. Each orientation ships three widths so
            a phone never downloads a 2560px plate. The picture itself must own
            the hero bounds; otherwise percentage sizing on its child can
            collapse. */}
        <picture className="absolute inset-0 block h-full w-full">
          <source
            srcSet="/images/hero-landscape-1280.webp 1280w, /images/hero-landscape-1920.webp 1920w, /images/hero-landscape-2560.webp 2560w"
            sizes="100vw"
            media="(min-width: 1024px) and (min-aspect-ratio: 5/4)"
            type="image/webp"
            width="2560"
            height="1429"
          />
          <img
            ref={overlayImgRef}
            src="/images/hero-portrait-1300.webp"
            srcSet="/images/hero-portrait-900.webp 900w, /images/hero-portrait-1300.webp 1300w, /images/hero-portrait-1700.webp 1700w"
            sizes="100vw"
            alt="Papi Raborife"
            className="absolute inset-0 h-full w-full object-cover object-center"
            width="1700"
            height="2277"
            fetchPriority="high"
            decoding="async"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </picture>
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
