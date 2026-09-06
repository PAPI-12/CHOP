import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ScribbleX, ScribbleUnderline, FloatingCross, FloatingWave } from './Scribbles';
import SplitFlapText from './SplitFlapText';
import { useHeroPhysics, type HeroCursor } from '../hooks/useHeroPhysics';
import { createHeroWiper, type HeroWiper } from '../utils/heroWipe';

/** Limit only the effect buffer, never the resolution of the photographs. */
const MAX_PANE_PIXELS = 3_000_000;

/**
 * Where `object-fit: cover` has actually put the photograph inside a box.
 *
 * The rain pane on the canvas must sit EXACTLY over the photograph behind
 * it — a hair of divergence and the wipe reveals a face that has slipped.
 * Read `object-position` rather than assuming centre, so the CSS stays the
 * single source of truth — including the mobile override.
 */
type Cover = { ox: number; oy: number; dw: number; dh: number; scale: number };
const coverOf = (img: HTMLImageElement, boxW: number, boxH: number): Cover | null => {
  if (!img.complete || !img.naturalWidth || boxW < 8 || boxH < 8) return null;
  const scale = Math.max(boxW / img.naturalWidth, boxH / img.naturalHeight);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  let posX = 50;
  let posY = 50;
  const pos = getComputedStyle(img).objectPosition.trim().split(/\s+/);
  if (pos.length === 2) {
    const px = parseFloat(pos[0]);
    const py = parseFloat(pos[1]);
    if (Number.isFinite(px)) posX = px;
    if (Number.isFinite(py)) posY = py;
  }
  return { ox: (boxW - dw) * (posX / 100), oy: (boxH - dh) * (posY / 100), dw, dh, scale };
};

/** The stud, in normalised photograph coordinates: the centre of his lobe.
    Measured against the original 1920×1353 plate. The lobe is the fleshy
    lower part of the ear — above the jaw, below the tragus. */
const EAR_U = 740 / 1920;
const EAR_V = 680 / 1353;

const RING_WORD = 'CULTURE LED CREATIVE';
/**
 * One label laid around the FULL circumference. Word spacing is real: each
 * letter keeps its own advance and the leftover arc is distributed between
 * words only, so CULTURE, LED and CREATIVE each read as a continuous word and
 * the gaps between them close the ring — never a half-circle of letters that
 * ends mid-word. The trailing space is the seam; the word gap there is what
 * hides the wrap. Rotating the group is one transform, so the loop costs no
 * SVG text re-layout per frame.
 */
const RING_TEXT = `${RING_WORD} `;

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
  const earringRef = useRef<HTMLDivElement>(null);
  const eraserRef = useRef<HTMLCanvasElement>(null);
  const photoRef = useRef<HTMLImageElement>(null);
  const paneImgRef = useRef<HTMLImageElement>(null);
  // Survives responsive interactivity changes: returning to a wide viewport
  // must not re-fog a window the visitor has already wiped clear.
  const hasWipedRef = useRef(false);

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

  const handleIntroComplete = useCallback(() => setIntroComplete(true), []);

  // The fixed site grain must not sit over the hero photograph. Clip it
  // BELOW the hero, on desktop and mobile, instead of grading the photo or
  // disabling the texture on the rest of the page.
  useLayoutEffect(() => {
    const hero = heroRef.current;
    const grain = hero?.closest<HTMLElement>('.mix-grain');
    if (!hero || !grain) return;
    let frame = 0;
    const place = () => {
      frame = 0;
      const rect = hero.getBoundingClientRect();
      const bottom = rect.top < window.innerHeight ? Math.max(0, Math.min(window.innerHeight, rect.bottom)) : 0;
      grain.style.setProperty('--hero-grain-inset', `${bottom}px`);
    };
    const queue = () => { if (!frame) frame = requestAnimationFrame(place); };
    place();
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', queue);
      window.removeEventListener('resize', queue);
      grain.style.removeProperty('--hero-grain-inset');
    };
  }, []);

  /**
   * Is this the web version?
   *
   * The rain pane and the wipe are one desktop feature, gated together. A
   * fine pointer that can hover, no reduced-motion preference, and a viewport
   * wide enough to be a computer. Anything else — every phone, every tablet —
   * lands on the original photograph, clean: there is nothing to wipe with,
   * so a pane would be a photograph they could never see.
   *
   * This re-evaluates, because a desktop browser dragged narrow and back is
   * the cheapest way to end up with a rain pane and no way to clear it.
   */
  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)');
    const hover = window.matchMedia('(hover: hover)');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    let timer = 0;
    const evaluate = () =>
      setInteractive(fine.matches && hover.matches && !reduce.matches && window.innerWidth >= 768);
    const settle = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(evaluate, 160);
    };
    evaluate();
    fine.addEventListener('change', evaluate);
    hover.addEventListener('change', evaluate);
    reduce.addEventListener('change', evaluate);
    window.addEventListener('resize', settle, { passive: true });
    return () => {
      window.clearTimeout(timer);
      fine.removeEventListener('change', evaluate);
      hover.removeEventListener('change', evaluate);
      reduce.removeEventListener('change', evaluate);
    };
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

  /**
   * The earring.
   *
   * A lime cross on the subject's lobe, pinned in IMAGE space so it stays on
   * his ear at every viewport instead of drifting off his face the moment the
   * crop changes — and the crop does change: the photograph is framed
   * differently on a phone so his head survives the portrait cut.
   *
   * This lives in its own effect, deliberately. It runs for every visitor,
   * not only the ones with a cursor, and it is static by design: no float,
   * no spin, no physics, the same stillness as the PAPI RABORIFE line. On a
   * desktop it sits under the rain pane — you have to wipe the window to
   * find it.
   */
  useEffect(() => {
    const hero = heroRef.current;
    const el = earringRef.current;
    const img = photoRef.current;
    if (!hero || !el || !img) return;

    const place = () => {
      const r = hero.getBoundingClientRect();
      const geo = coverOf(img, r.width, r.height);
      if (!geo) { el.style.opacity = '0'; return; }
      const x = geo.ox + geo.dw * EAR_U;
      const y = geo.oy + geo.dh * EAR_V;
      // Scales with the picture, so it reads as the same physical stud whether
      // the hero is a phone or a 2560 display.
      const size = Math.max(9, Math.min(20, geo.dw * 0.0075));
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      el.style.transform =
        `translate3d(${(x - size / 2).toFixed(1)}px, ${(y - size / 2).toFixed(1)}px, 0)`;
      // Off the edge of a heavy crop: hide rather than float in the margin.
      el.style.opacity = x > 0 && y > 0 && x < r.width && y < r.height ? '1' : '0';
    };

    place();
    const onLoad = () => place();
    if (!img.complete) img.addEventListener('load', onLoad);

    let timer = 0;
    const onResize = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(place, 140);
    };
    window.addEventListener('resize', onResize, { passive: true });
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    fonts?.ready.then(place).catch(() => {});

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', onResize);
      img.removeEventListener('load', onLoad);
    };
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

    let ctx: CanvasRenderingContext2D | null = null;
    let wiper: HeroWiper | null = null;
    let disposed = false;

    /**
     * Wiped glass stays wiped.
     *
     * There is deliberately no re-fogging pass. Rain creeping back over a
     * cleared patch fights the visitor for the photograph they just
     * uncovered, and the hero is a first impression, not a toy that resets
     * itself. Wipe it once and the portrait is yours for the visit.
     */
    let wiped = hasWipedRef.current;

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
        // ~0.68× cap height so the CULTURE loop sits tightly inside the O
        // rather than spilling past it.
        radius = Math.max((glyphDiameter * 0.68) / 2, 20);
      } else {
        radius = Math.max(Math.min(boxW, boxH) * 0.034, 22);
      }
      cursorRef.current.r = radius;

      const size = Math.ceil(radius * 2);
      ring.style.width = `${size}px`;
      ring.style.height = `${size}px`;

      const svg = ring.querySelector('svg');
      const glyphs = Array.from(ring.querySelectorAll<SVGTextElement>('.hero-ring-glyph'));
      if (svg) svg.setAttribute('viewBox', `0 0 ${size} ${size}`);

      const px = Math.max(10, Math.min(17, radius * 0.32));
      // The label orbits the invisible eraser centre, and the site's own lime
      // cursor circle reads inside the orbit.
      const pr = radius + px * 0.68;
      const c = size / 2;
      ringC = c;
      if (glyphs.length) {
        const circumference = 2 * Math.PI * pr;
        // Real per-glyph advances where the browser can measure them; a
        // proportional fallback for jsdom so the smoke harness still lays the
        // label around a full circle.
        const widths = glyphs.map((g, i) => {
          g.setAttribute('font-size', String(px));
          g.style.fontSize = `${px}px`;
          const measured = typeof g.getComputedTextLength === 'function' ? g.getComputedTextLength() : 0;
          if (measured) return measured;
          const chn = RING_TEXT[i] || '';
          return chn === ' ' ? px * 0.32 : chn === '\u00B7' ? px * 0.5 : px * 0.62;
        });
        const total = widths.reduce((a, b) => a + b, 0);
        // Distribute the leftover circumference between the WORD SEAMS only,
        // never inside a word. The trailing space is the seam between the last
        // word and the first, so the wrap is invisible and the circle reads
        // CULTURE · LED · CREATIVE around the full 360 degrees.
        const seamCount = Array.from(RING_TEXT).filter((ch) => ch === ' ' || ch === '\u00B7').length;
        const seamGap = seamCount > 0 ? (circumference - total) / seamCount : 0;
        let arc = 0;
        glyphs.forEach((g, i) => {
          const w = widths[i];
          const mid = arc + w / 2;
          const theta = (mid / circumference) * Math.PI * 2 - Math.PI / 2;
          const gx = c + pr * Math.cos(theta);
          const gy = c + pr * Math.sin(theta);
          g.setAttribute(
            'transform',
            `translate(${gx.toFixed(3)} ${gy.toFixed(3)}) rotate(${(theta * 180 / Math.PI + 90).toFixed(3)})`,
          );
          arc += w;
          if (RING_TEXT[i] === ' ' || RING_TEXT[i] === '\u00B7') arc += seamGap;
        });
      }
    };

    /**
     * ── The rain pane ─────────────────────────────────────────────────
     *
     * The wet glass is a photograph of the ORIGINAL portrait behind a
     * rained-on window: the same plate, softened and darkened to graphite
     * glass, wearing the droplets and runnels of a real rain window (built
     * by tools/hero/build-rain-pane.py). It is drawn ONCE onto this canvas at
     * exactly the cover geometry of the sharp photograph underneath. No
     * fields, no runnels, no beads are painted here. The cursor ring and
     * every displaced letter squeegee the rain away with `destination-out`
     * strokes, and the portrait shows through where they have been.
     */
    const hideOverlay = () => {
      canvas.style.visibility = 'hidden';
      // Drop the large backing store as well as its compositing layer.
      canvas.width = 1;
      canvas.height = 1;
      bodyTrailRef.current = null;
    };
    const finishWipe = () => {
      wiped = true;
      hasWipedRef.current = true;
      wiper?.dispose();
      hideOverlay();
    };

    /**
     * Lay the rain pane onto the canvas at the exact rectangle `object-fit:
     * cover` has given the photograph underneath — the pane was built on the
     * same plate, so one geometry places both. Returns true when the pane is
     * actually showing rain — false while either plate is still decoding, in
     * which case the pane stays empty and is repainted on the image's load.
     */
    const drawPane = (f: CanvasRenderingContext2D) => {
      const photo = photoRef.current;
      const pane = paneImgRef.current;
      if (!photo || !pane || !pane.complete || !pane.naturalWidth) return false;
      const geo = coverOf(photo, boxW, boxH);
      if (!geo) return false;
      f.imageSmoothingEnabled = true;
      f.imageSmoothingQuality = 'high';
      f.drawImage(pane, geo.ox, geo.oy, geo.dw, geo.dh);
      return true;
    };

    const paintPane = () => {
      if (disposed) return;
      syncBox();
      if (boxW < 8 || boxH < 8) return;
      // The photographs stay native and sharp; only this disposable pane is
      // capped, so large and Retina displays never allocate a full-resolution
      // copy of the rain window.
      dpr = Math.min(window.devicePixelRatio || 1, 1.5, Math.sqrt(MAX_PANE_PIXELS / (boxW * boxH)));
      const pxW = Math.floor(boxW * dpr);
      const pxH = Math.floor(boxH * dpr);
      const resized = canvas.width !== pxW || canvas.height !== pxH;

      // A late resize must never re-fog a window the visitor has cleared.
      if (wiped) {
        if (resized || !ctx) finishWipe();
        return;
      }
      wiper?.dispose();
      if (resized) { canvas.width = pxW; canvas.height = pxH; }
      canvas.style.width = `${boxW}px`;
      canvas.style.height = `${boxH}px`;
      canvas.style.visibility = 'visible';

      ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, boxW, boxH);
      drawPane(ctx);

      wiper = createHeroWiper(ctx, {
        width: boxW,
        height: boxH,
        onStart: () => {
          wiped = true;
          hasWipedRef.current = true;
        },
        onComplete: finishWipe,
      });
    };

    const erase = (key: number, x: number, y: number, radius: number) =>
      wiper?.erase(key, x, y, radius);

    // Handed to the physics solver so every displaced letter carves its own
    // path through the rain, exactly like the ring does.
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
    paintPane();
    centre();

    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    fonts?.ready
      .then(() => {
        if (disposed) return;
        measureRing();
        if (!pointerSeen) centre();
      })
      .catch(() => {});

    // The pane is painted when the rain plate has decoded; the photograph's
    // decode matters too, because its cover geometry is what places the pane.
    const plates = [paneImgRef.current, photoRef.current].filter(
      (el): el is HTMLImageElement => !!el && !el.complete,
    );
    const onImgLoad = () => paintPane();
    plates.forEach((el) => el.addEventListener('load', onImgLoad));

    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        primed = false;
        syncBox();
        measureRing();
        paintPane();
        centre();
      }, 140);
    };
    window.addEventListener('resize', onResize, { passive: true });

    let pointerEver = false;
    let shown: boolean | null = null;

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
      // to an edge, stop erasing, and hand the cursor back to the site.
      if (x < 0 || y < 0 || x > boxW || y > boxH) {
        pointerSeen = false;
        // Break only the ring's stroke; re-entering elsewhere must not wipe a
        // straight line of rain away from the old exit point. Letter trails
        // are keyed separately and are unaffected.
        wiper?.resetStroke(RING_STROKE);
        centre();
        return;
      }

      if (!pointerSeen) {
        // First frame back inside. Without this the ring would spring across
        // the whole hero from wherever it was parked, wiping a stripe of rain
        // on the way — the single ugliest thing the old build did.
        cx = x;
        cy = y;
        vx = 0;
        vy = 0;
      }
      pointerEver = true;
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

      // Visible while the pointer is in the hero, plus on landing — before the
      // first mouse move the ring sits at the centre as an invitation. What it
      // must NOT do is hang in the middle of the headline after you have moved
      // away; that reads as a stuck element, not a cursor.
      const show = primed && (pointerSeen || !pointerEver);
      if (show !== shown) {
        shown = show;
        ring.style.opacity = show ? '1' : '0';
      }

      if (!show) return;

      // Gentle continuous rotation of the label. Rotating the group (one
      // transform) instead of shifting text along the path keeps every frame
      // free of SVG text re-layout — the big lag source while sweeping. The
      // circumference-pinned label makes the loop seamless.
      spin = (spin + dt * 14) % 360;
      ringSpinRef.current?.setAttribute(
        'transform',
        `rotate(${spin.toFixed(2)} ${ringC} ${ringC})`,
      );

      // The ring is the squeegee: what its path crosses, it clears.
      if (pointerSeen) erase(RING_STROKE, cx, cy, radius);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      wiper?.dispose();
      io.disconnect();
      bodyTrailRef.current = null;
      window.clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointermove', onPointerMove);
      plates.forEach((el) => el.removeEventListener('load', onImgLoad));
    };
  }, [interactive]);

  return (
    <section
      id="hero"
      ref={heroRef}
      className="relative h-[100svh] min-h-[540px] flex items-center justify-center overflow-hidden bg-[#000000]"
    >
      <div className="absolute inset-0 z-0">
        {/* The original photograph — the one plate every visitor lands on,
            and what the desktop wipe reveals. Never filtered, never
            re-rendered: this is the real me. */}
        <img
          ref={photoRef}
          src="/images/hero-landscape-1920.webp"
          srcSet="/images/hero-landscape-1280.webp 1280w, /images/hero-landscape-1920.webp 1920w, /images/hero-landscape-2560.webp 2559w"
          sizes="max(100vw, 142svh, 767px)"
          alt="Papi Raborife"
          className="hero-photo absolute inset-0 h-full w-full object-cover"
          width="2559"
          height="1803"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        {/* The stud. Positioned in image space by the earring effect, so it
            stays on the lobe at every viewport. Above the photograph, below
            the rain pane — on a desktop you have to wipe the window to find
            it. */}
        <div
          ref={earringRef}
          className="hero-earring absolute top-0 left-0 z-[1]"
          style={{ opacity: 0 }}
          aria-hidden
        />
        {/* The rain pane is a DESKTOP effect, and only a desktop effect: the
            original photograph seen through a rained-on window, drawn onto a
            canvas so the cursor ring and the flying letters can squeegee it
            away and reveal the sharp portrait underneath. The plate itself is
            a hidden <img> so the browser decodes it (and the preload in
            index.html is honoured); the canvas is the only thing on screen.
            Touch, coarse-pointer and reduced-motion visitors land on the
            clean photograph — there is nothing to wipe with, so an erasable
            pane is not an effect, it is a photograph they can never uncover. */}
        {interactive && (
          <>
            <img
              ref={paneImgRef}
              src="/images/hero-rain-pane-1920.webp"
              srcSet="/images/hero-rain-pane-1280.webp 1280w, /images/hero-rain-pane-1920.webp 1920w"
              sizes="max(100vw, 142svh, 767px)"
              alt=""
              aria-hidden
              className="hero-pane-plate absolute inset-0 h-full w-full object-cover opacity-0 pointer-events-none"
              width="1920"
              height="1353"
              loading="eager"
              decoding="async"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <canvas ref={eraserRef} className="hero-rain absolute inset-0 w-full h-full pointer-events-none z-[3]" aria-hidden />
          </>
        )}
      </div>

      {/* Ambient floating crosses */}
      <FloatingCross className="absolute top-[12%] left-[7%] z-20 hidden sm:block" size={38} duration={6.5} delay={0} />
      <FloatingCross className="absolute top-[18%] right-[11%] z-20 hidden md:block" size={24} duration={5.5} delay={0.5} />
      <FloatingCross className="absolute top-[32%] left-[15%] z-20 hidden md:block" size={28} duration={7} delay={0.3} />
      <FloatingCross className="absolute top-[8%] right-[26%] z-20 hidden lg:block" size={18} duration={6} delay={0.9} />
      <FloatingCross className="absolute bottom-[24%] right-[8%] z-20 hidden sm:block" size={30} duration={7.5} delay={0.2} />
      <FloatingCross className="absolute bottom-[16%] left-[11%] z-20 hidden sm:block" size={22} duration={5.8} delay={1} />
      <FloatingCross className="absolute top-[48%] left-[4%] z-20 hidden lg:block" size={16} duration={6.2} delay={1.2} />
      <FloatingCross className="absolute top-[58%] right-[17%] z-20 hidden md:block" size={20} duration={6.4} delay={0.8} />
      <FloatingCross className="absolute bottom-[38%] left-[22%] z-20 hidden lg:block" size={14} duration={5.2} delay={1.4} />
      <FloatingCross className="absolute top-[70%] left-[40%] z-20 hidden xl:block" size={16} duration={6.8} delay={0.6} />

      {/* Ambient floating waves */}
      <FloatingWave className="absolute top-[24%] right-[15%] z-20 hidden md:block" width={140} duration={7.5} delay={0} />
      <FloatingWave className="absolute top-[44%] left-[3%] z-20 hidden lg:block" width={110} duration={8.5} delay={0.4} />
      <FloatingWave className="absolute bottom-[32%] right-[5%] z-20 hidden md:block" width={130} duration={7} delay={0.9} />
      <FloatingWave className="absolute bottom-[14%] left-[17%] z-20 hidden sm:block" width={100} duration={8} delay={0.6} />
      <FloatingWave className="absolute top-[62%] right-[23%] z-20 hidden lg:block" width={90} duration={6.5} delay={1.1} />

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
            className="hero-pop hero-pop-late font-display text-[#d7ff4f] text-[clamp(2.2rem,10.8vw,10rem)] md:text-[clamp(3.5rem,8.6vw,9.5rem)] leading-[0.86] tracking-[-0.04em] whitespace-nowrap"
          >
            <HeroLetters text="SINCE 2015" />
          </h1>
        </div>
      </div>

      {/* CULTURE LED CREATIVE. No lime rim, no SVG path, no second circle:
          the label itself is the only body of the ring, orbiting the eraser
          centre, and the site's own lime cursor circle reads inside the
          orbit. The ring is still the squeegee — what its path crosses, it
          clears. No lens, no magnification: the rain wipes away, it does not
          enlarge. Only rendered where there is a real cursor. */}
      {interactive && (
        <div
          ref={ringRef}
          className="hero-ring absolute top-0 left-0 z-30 pointer-events-none"
          style={{ opacity: 0 }}
          aria-hidden
        >
          <svg width="100%" height="100%" className="absolute inset-0 overflow-visible block">
            {/* The label rides a circle around the invisible eraser centre. */}
            <g ref={ringSpinRef}>
              {/* Inter Black, not the mono. JetBrains Mono's bold is a
                  narrow-stemmed 700 and at this size it simply does not read
                  as bold — the label kept looking light however the weight
                  was declared. Inter ships a real 900, and a hairline stroke
                  in the same lime under the fill thickens the stems further
                  without touching the letterforms. Each glyph is placed
                  individually along the orbit (no <path>), so the loop is
                  seamless and the label can grow large without an SVG path
                  element in the DOM. */}
              {RING_TEXT.split('').map((ch, i) => (
                <text
                  key={i}
                  className="hero-ring-glyph"
                  fill="#d7ff4f"
                  stroke="#d7ff4f"
                  strokeWidth="0.7"
                  paintOrder="stroke"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontFamily="Inter, system-ui, sans-serif"
                  fontWeight="900"
                >
                  {ch}
                </text>
              ))}
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
