import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ScribbleX, ScribbleUnderline, FloatingCross, FloatingWave } from './Scribbles';
import SplitFlapText from './SplitFlapText';
import { useHeroPhysics, type HeroCursor } from '../hooks/useHeroPhysics';
import { createHeroWiper, type HeroWiper } from '../utils/heroWipe';

/** Limit only the effect buffer, never the resolution of the photograph. */
const MAX_VAPOR_PIXELS = 3_000_000;

/**
 * Where `object-fit: cover` has actually put the photograph inside a box.
 *
 * The earring needs to convert a point on the photograph into a point on
 * screen, and the answer depends on the crop. Read `object-position` rather
 * than assuming centre, so the CSS stays the single source of truth —
 * including the mobile override.
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
    Measured against the centred 1920×1353 plate. The lobe is the fleshy lower
    part of the ear — the old value sat above it, on the tragus, so the cross
    read as a drill on the jaw rather than an earring in the lobe. */
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
  const overlayImgRef = useRef<HTMLImageElement>(null);
  // Survives responsive interactivity changes: returning to a wide viewport
  // must not re-fog a photograph the visitor already uncovered.
  const hasWipedRef = useRef(false);

  const [introComplete, setIntroComplete] = useState(false);
  const [interactive, setInteractive] = useState(false);
  // Keep the existing wet-glass introduction on a fresh desktop visit. The
  // explicit clear preview uses the SAME photograph, with no glass above it.
  const [vaporEnabled, setVaporEnabled] = useState(() =>
    typeof window === 'undefined' || new URLSearchParams(window.location.search).get('vapor') !== 'clear',
  );

  // Dev helper: pressing `r` replays the rain glass without a full reload.
  // Helpful while tuning the pane in the preview. Flips false→true so the
  // paint effect re-runs even when it was already true.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'r' || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && /input|textarea|select/i.test(target.tagName)) return;
      hasWipedRef.current = false;
      setVaporEnabled(false);
      requestAnimationFrame(() => {
        setVaporEnabled(true);
        window.dispatchEvent(new Event('resize'));
      });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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

  // The fixed site grain used to sit above even fully erased glass. Clip it
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
   * The vapor and the wipe are one desktop feature, gated together. A fine
   * pointer that can hover, no reduced-motion preference, and a viewport wide
   * enough to be a computer. Anything else — every phone, every tablet — gets
   * the photograph, clean, on landing.
   *
   * This re-evaluates, because a desktop browser dragged narrow and back is
   * the cheapest way to end up with a vapor pane and no way to clear it.
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
      window.removeEventListener('resize', settle);
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
   * This lives in its own effect, deliberately. It used to be part of the
   * desktop vapor effect, which bails out entirely on touch — so the stud
   * vanished on exactly the devices that now land on the clean photograph and
   * can actually see it. It is static by design: no float, no spin, no
   * physics, the same stillness as the PAPI RABORIFE line.
   */
  useEffect(() => {
    const hero = heroRef.current;
    const el = earringRef.current;
    const img = overlayImgRef.current;
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
     * There is deliberately no re-condensation pass. Vapor creeping back over a
     * cleared patch fights the visitor for the photograph they just
     * uncovered, and the hero is a first impression, not a toy that resets
     * itself. Wipe it once and the portrait is yours for the visit.
     */

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
        // Noticeably smaller than before — user asked to reduce it again.
        // Now ~0.68× cap height so the CULTURE loop sits tightly inside the O
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
      // The label orbits the invisible eraser centre, but there is no lime
      // rim any more: the label is the ring's only visible body, and the
      // site's own lime cursor circle reads inside the orbit.
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
     * ── The vapour / rain-glass pane ───────────────────────────────────
     *
     * A sheet of dark graphite glass after rain: dense small beads, narrow
     * vertical runnels, the whole sheet lit softly from the top-left. The
     * cursor ring and every displaced letter squeegee it away, and the sharp
     * portrait shows through where you have wiped.
     *
     * The whole pane is rendered ONCE into an offscreen tile. Every later
     * operation is a single drawImage, so nothing re-draws thousands of
     * droplets per frame — that is what keeps the hero at a steady 60fps.
     */
    let vapor: HTMLCanvasElement | null = null;

    /** Deterministic noise so the condensation pattern is stable per size. */
    const seeded = (s2: number) => () => {
      s2 = (s2 * 1664525 + 1013904223) >>> 0;
      return s2 / 4294967296;
    };

    /**
     * The pane is built in two stages, and the reason is the first paint.
     *
     * A constant alpha is what makes an overlay feel like a solid panel laid
     * over a photograph — so the detailed tile is a computed *field*, not a
     * gradient. That is nothing per frame (it is baked ONCE and only ever
     * composited afterwards) but it is very much something to run inside the
     * first frame of the site.
     *
     * So: `paintOverlay` lays down a flat misted pane synchronously — one
     * gradient at roughly the field's average density, instant — and the real
     * field, the beads and the runnels are rendered on the next idle callback
     * and swapped in. Nobody can tell, and the hero opens clean.
     */
    let vaporDetailed = false;
    /** True once the blurred photograph has been baked into the tile. The
        detail pass may need to run twice: once before the image finished
        loading, then again when the image fires `load`. */
    let vaporPhoto = false;
    /** True the moment the visitor clears any glass at all. */
    let wiped = hasWipedRef.current;
    let detailIdle: number | null = null;
    let detailTimer = 0;
    let detailGeneration = 0;
    const cancelDetail = () => {
      detailGeneration++;
      if (detailIdle !== null) {
        window.cancelIdleCallback?.(detailIdle);
        detailIdle = null;
      }
      window.clearTimeout(detailTimer);
      detailTimer = 0;
    };
    const releaseVapor = () => {
      if (vapor) { vapor.width = 1; vapor.height = 1; vapor = null; }
    };
    const hideOverlay = () => {
      cancelDetail();
      canvas.style.visibility = 'hidden';
      // Drop the large backing store as well as its compositing layer.
      canvas.width = 1;
      canvas.height = 1;
      releaseVapor();
      bodyTrailRef.current = null;
    };
    const finishWipe = () => {
      wiped = true;
      hasWipedRef.current = true;
      wiper?.dispose();
      hideOverlay();
    };

    /**
     * The stand-in pane, drawn synchronously so the hero is never briefly
     * without its vapor. Deliberately a plain gradient at roughly the field's
     * average density — it is on screen for one idle callback at most.
     */
    const paneGradient = (f: CanvasRenderingContext2D) => {
      // A translucent graphite pane after rain, NOT the blue sheet of the
      // iStock reference — the hero photograph must read through it in its
      // own colour, only softened and darkened. A whisper of cool remains
      // (water is cold), but the blue-grey tint has been neutralised. It is
      // lit so the top-left reads brightest while the lower-right falls into
      // shadow. The photograph stays legible behind it from the first frame;
      // the dense detail is added by buildVapor() a moment later.
      // Denser than the previous 0.33/0.42/0.50 so the rain glass is
      // unmistakably there on first paint — user asked to see it on every load.
      const sheet = f.createLinearGradient(0, 0, boxW, boxH);
      sheet.addColorStop(0, 'rgba(78, 82, 88, 0.46)');
      sheet.addColorStop(0.45, 'rgba(48, 52, 58, 0.54)');
      sheet.addColorStop(1, 'rgba(22, 25, 29, 0.62)');
      f.fillStyle = sheet;
      f.fillRect(0, 0, boxW, boxH);

      // Keeps the cream type legible without flattening the pane, and makes
      // the lower-right read as the shadowed side of the glass.
      const grade = f.createLinearGradient(0, 0, boxW, boxH);
      grade.addColorStop(0, 'rgba(8, 11, 14, 0.07)');
      grade.addColorStop(0.55, 'rgba(7, 10, 13, 0.17)');
      grade.addColorStop(1, 'rgba(4, 6, 8, 0.26)');
      f.fillStyle = grade;
      f.fillRect(0, 0, boxW, boxH);
    };

    const buildVapor = () => {
      if (boxW < 8 || boxH < 8) return;
      if (!vapor) vapor = document.createElement('canvas');
      vapor.width = Math.max(1, Math.floor(boxW * dpr));
      vapor.height = Math.max(1, Math.floor(boxH * dpr));
      const f = vapor.getContext('2d');
      if (!f) return;
      f.setTransform(dpr, 0, 0, dpr, 0, 0);
      f.globalCompositeOperation = 'source-over';
      f.globalAlpha = 1;
      f.clearRect(0, 0, boxW, boxH);

      const rnd = seeded(20259 + Math.round(boxW) * 31 + Math.round(boxH));
      vaporDetailed = true;

      /* ── 0. The rainy-day blur ─────────────────────────────────────
         Before any glass is painted, the photograph is drawn onto the pane
         already blurred, so the first look is a person seen through a wet
         window. The sharp plate stays underneath the canvas; wiping the
         glass (destination-out) peels back this blur too, and the portrait
         snaps into focus exactly where you leave a dry streak.
         One-time draw, never per frame. */
      const img = overlayImgRef.current;
      if (img && img.complete && img.naturalWidth) {
        const geo = coverOf(img, boxW, boxH);
        if (geo) {
          const pad = 22;
          f.save();
          f.filter = 'blur(18px)';
          f.drawImage(img, geo.ox - pad, geo.oy - pad, geo.dw + pad * 2, geo.dh + pad * 2);
          f.filter = 'none';
          f.restore();
          vaporPhoto = true;
        }
      }

      /* ── 1. The rain-glass field ───────────────────────────────────
         The reference is not a clean, breath-blown mist: it is pane after a
         downpour — a dense field of tiny beads so packed they read as rough
         glass, with a big soft shaft of light crossing it. Density is four
         octaves of smoothstep value noise; soft blooms open where the glass
         is thinner, including the large bright wash over the subject.
         Neutral graphite: thin is slate, thick is a soft silver that still leans
   only a hair cool — the reference's blue-grey has been neutralised so the
   photograph behind keeps its own colour. */
      const FIELD = Math.max(4, Math.sqrt((boxW * boxH) / 100_000));
      const fw = Math.max(2, Math.ceil(boxW / FIELD));
      const fh = Math.max(2, Math.ceil(boxH / FIELD));

      const smooth = (t: number) => t * t * (3 - 2 * t);
      const lattice = (cols: number, rows: number) => {
        const g = new Float32Array((cols + 1) * (rows + 1));
        for (let i = 0; i < g.length; i++) g[i] = rnd();
        return g;
      };
      const sampleAt = (
        g: Float32Array, cols: number, rows: number, u: number, v: number,
      ) => {
        const x = u * cols;
        const y = v * rows;
        const x0 = Math.min(Math.floor(x), cols - 1);
        const y0 = Math.min(Math.floor(y), rows - 1);
        const sx = smooth(x - x0);
        const sy = smooth(y - y0);
        const row = cols + 1;
        const a = g[y0 * row + x0];
        const b = g[y0 * row + x0 + 1];
        const c = g[(y0 + 1) * row + x0];
        const d = g[(y0 + 1) * row + x0 + 1];
        return (a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy;
      };

      const octaves: Array<[number, number, number, Float32Array]> = [
        [2, 2, 0.58, lattice(2, 2)],
        [5, 3, 0.25, lattice(5, 3)],
        [11, 7, 0.12, lattice(11, 7)],
        [23, 15, 0.05, lattice(23, 15)],
      ];

      const blooms: Array<[number, number, number, number]> = [];
      for (let i = 0; i < 5; i++) {
        blooms.push([
          rnd() * boxW,
          boxH * (0.15 + rnd() * 0.7),
          Math.max(boxW, boxH) * (0.13 + rnd() * 0.18),
          0.12 + rnd() * 0.16,
        ]);
      }
      blooms.push([boxW * 0.5, boxH * 0.33, Math.max(boxW, boxH) * 0.44, 0.34]);

      /** How much the blooms have cleared the glass at a point, 0-1. */
      const cleared = (x: number, y: number) => {
        let c = 0;
        for (let b = 0; b < blooms.length; b++) {
          const [bx, by, brad, bstr] = blooms[b];
          const dx = x - bx;
          const dy = (y - by) * 1.35;
          const d2 = dx * dx + dy * dy;
          if (d2 < brad * brad) {
            const k = 1 - Math.sqrt(d2) / brad;
            c += bstr * k * k;
          }
        }
        return c;
      };

      const small = document.createElement('canvas');
      small.width = fw;
      small.height = fh;
      const sctx = small.getContext('2d');
      if (!sctx) return;
      const buf = sctx.createImageData(fw, fh);
      const px32 = buf.data;

      for (let fy = 0; fy < fh; fy++) {
        const v = fy / (fh - 1);
        const y = fy * FIELD;
        const vert = 1.05 - 0.13 * smooth(Math.min(1, Math.max(0, (v - 0.25) / 0.6)));
        for (let fx = 0; fx < fw; fx++) {
          const u = fx / (fw - 1);
          let n = 0;
          for (let o = 0; o < octaves.length; o++) {
            const [c, r, amp, g] = octaves[o];
            n += sampleAt(g, c, r, u, v) * amp;
          }
          n = Math.min(1, Math.max(0, (n - 0.5) * 1.9 + 0.5));

          const x = fx * FIELD;
          // The pane darkens and refracts but never becomes a wall: you are
          // always looking THROUGH it at the hero. A touch lighter than the
          // old blue sheet, with the water doing the "after rain" work.
          let a = (0.20 + n * 0.26) * vert;
          a *= 1 - Math.min(0.85, cleared(x, y) * 1.1);
          a = Math.min(0.60, Math.max(0.12, a));

          const k = (a - 0.12) / 0.48;
          // Slate → soft silver, essentially neutral so what is behind the
          // glass keeps its own colour (only a hair cool remains).
          const r = Math.round(36 + 104 * k);
          const g = Math.round(39 + 108 * k);
          const b = Math.round(43 + 112 * k);
          const o4 = (fy * fw + fx) * 4;
          px32[o4] = r;
          px32[o4 + 1] = g;
          px32[o4 + 2] = b;
          px32[o4 + 3] = a * 255;
        }
      }
      sctx.putImageData(buf, 0, 0);
      f.imageSmoothingEnabled = true;
      f.imageSmoothingQuality = 'high';
      f.drawImage(small, 0, 0, boxW, boxH);

      /* ── 1b. The light shaft ───────────────────────────────────────
         The reference's big bright wash sits left-of-centre and spreads
         diagonally; the top and the right edge fall back into dark glass.
         Two radial passes: a wide cool wash and a tighter white core. */
      const bloomCx = boxW * 0.34;
      const bloomCy = boxH * 0.52;
      const bloomR = Math.max(boxW, boxH) * 0.62;
      const wash = f.createRadialGradient(bloomCx, bloomCy, 0, bloomCx, bloomCy, bloomR);
      wash.addColorStop(0, 'rgba(230, 234, 238, 0.28)');
      wash.addColorStop(0.38, 'rgba(174, 180, 187, 0.13)');
      wash.addColorStop(0.72, 'rgba(76, 82, 88, 0)');
      wash.addColorStop(1, 'rgba(0, 0, 0, 0)');
      f.fillStyle = wash;
      f.fillRect(0, 0, boxW, boxH);

      const core = f.createRadialGradient(
        boxW * 0.38, boxH * 0.44, 0,
        boxW * 0.38, boxH * 0.44, Math.min(boxW, boxH) * 0.34,
      );
      core.addColorStop(0, 'rgba(246, 248, 250, 0.18)');
      core.addColorStop(0.45, 'rgba(206, 212, 218, 0.08)');
      core.addColorStop(1, 'rgba(166, 172, 178, 0)');
      f.fillStyle = core;
      f.fillRect(0, 0, boxW, boxH);

      // Dark top band and right-hand falloff, as in the reference.
      const topEdge = f.createLinearGradient(0, 0, 0, boxH * 0.4);
      topEdge.addColorStop(0, 'rgba(5, 10, 18, 0.32)');
      topEdge.addColorStop(1, 'rgba(8, 14, 24, 0)');
      f.fillStyle = topEdge;
      f.fillRect(0, 0, boxW, boxH * 0.4);
      const rightEdge = f.createLinearGradient(boxW * 0.6, 0, boxW, 0);
      rightEdge.addColorStop(0, 'rgba(6, 12, 20, 0)');
      rightEdge.addColorStop(1, 'rgba(5, 10, 18, 0.26)');
      f.fillStyle = rightEdge;
      f.fillRect(boxW * 0.6, 0, boxW * 0.4, boxH);

      /* ── 2. Water ──────────────────────────────────────────────────
         A drop of water on glass is a LENS, not a hole. Punch a hole and you
         show whatever is behind; water refracts light away from the viewer,
         so every bead thins the mist a little, tints what is left toward a
         neutral graphite, and — when it sits in the light shaft — picks up a
         bright silver rim. The tint keeps them neutral over skin or wall. */

      /** How strongly the light shaft is lighting a point, 0-1. */
      const litAt = (x: number, y: number) => {
        const dx = x - bloomCx;
        const dy = y - bloomCy;
        const d = Math.hypot(dx, dy) / bloomR;
        return Math.max(0, 1 - d * d);
      };

      /** Walk a point list as short segments of interpolated width. */
      type Pt = { x: number; y: number };
      const along = (
        pts: Pt[], w0: number, w1: number,
        paint: (x: number, y: number, r: number) => void,
      ) => {
        for (let i = 0; i < pts.length - 1; i++) {
          const a = pts[i];
          const b = pts[i + 1];
          const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 2));
          for (let s = 0; s <= steps; s++) {
            const t = (i + s / steps) / (pts.length - 1);
            paint(
              a.x + (b.x - a.x) * (s / steps),
              a.y + (b.y - a.y) * (s / steps),
              (w0 + (w1 - w0) * t) / 2,
            );
          }
        }
      };

      const disc = (x: number, y: number, r: number) => {
        f.beginPath();
        f.arc(x, y, r, 0, Math.PI * 2);
        f.fill();
      };

      /* Runnels — narrow, near-vertical, because the reference reads as a pane
         rain has tracked straight down, not as broad stains. */
      const tracks: Array<{ pts: Pt[]; w: number; len: number }> = [];
      const runs = Math.min(20, Math.max(8, Math.round(boxW / 110)));
      for (let i = 0; i < runs; i++) {
        let x = rnd() * boxW;
        // Never straight down his face.
        if (x > 0.36 * boxW && x < 0.64 * boxW) {
          const k = (x - 0.36 * boxW) / (0.28 * boxW);
          x = rnd() < 0.5 ? k * 0.36 * boxW : boxW - k * 0.36 * boxW;
        }
        const top = -boxH * 0.04 + rnd() * boxH * 0.18;
        const len = boxH * (0.5 + rnd() * 0.8);
        const w = Math.max(2.5, (4 + rnd() * 6) * (boxW / 900));
        const wob = 1.5 + rnd() * 3.5;
        const phase = rnd() * 6.28;
        const drift = (rnd() - 0.5) * 0.018;
        const pts: Pt[] = [];
        for (let s = 0; s < 29; s++) {
          const t = s / 28;
          pts.push({
            x: x + Math.sin(t * 4.4 + phase) * wob + t * len * drift,
            y: top + len * t,
          });
        }
        tracks.push({ pts, w, len });

        // The wet halo either side of the channel.
        f.globalCompositeOperation = 'destination-out';
        f.fillStyle = '#000';
        f.globalAlpha = 0.035;
        along(pts, w * 3.2, w * 2.0, disc);

        // The channel: thinner mist...
        f.globalAlpha = 0.14;
        along(pts, w, w * 0.5, disc);

        // ...tinted graphite, so it holds its own over skin or wall.
        const dark = Math.round(36 + rnd() * 20);
        f.globalCompositeOperation = 'source-atop';
        f.fillStyle = `rgb(${dark},${dark + 2},${dark + 4})`;
        f.globalAlpha = 0.52 + rnd() * 0.14;
        along(pts, w * 0.9, w * 0.45, disc);

        // Lit shoulders.
        f.globalCompositeOperation = 'source-over';
        f.fillStyle = 'rgb(216,220,225)';
        f.globalAlpha = 0.03 + rnd() * 0.03;
        along(pts, w * 1.6, w * 0.8, disc);
      }

      /* Droplets. Dense, packed, tiny — the reference is a rough pane covered
         in thousands of beads, not a clean field of a few big circles. Baked
         once, so the count is free per frame. */
      const drop = (x: number, y: number, r: number, el: number) => {
        const ry = r * el;
        const lit = litAt(x, y);
        const lift = Math.round(lit * 96);

        f.globalCompositeOperation = 'destination-out';
        f.fillStyle = '#000';
        f.globalAlpha = 0.14 + rnd() * 0.18;
        f.beginPath();
        f.ellipse(x, y, r, ry, 0, 0, Math.PI * 2);
        f.fill();

        const dark = Math.round(30 + rnd() * 26);
        f.globalCompositeOperation = 'source-atop';
        f.fillStyle = `rgb(${dark + lift},${dark + lift + 3},${dark + lift + 6})`;
        f.globalAlpha = 0.30 + lit * 0.26 + rnd() * 0.18;
        f.beginPath();
        f.ellipse(x, y, r, ry, 0, 0, Math.PI * 2);
        f.fill();

        f.globalCompositeOperation = 'source-over';
        // Only the larger beads carry a rim; in the light shaft the rim is
        // bright silver, in the dark corners a faint soft grey.
        if (r > 1.8) {
          f.strokeStyle = 'rgba(255,255,255,0.72)';
          f.lineWidth = Math.max(0.35, r * 0.22);
          f.globalAlpha = 0.07 + lit * 0.12 + rnd() * 0.07;
          f.beginPath();
          f.ellipse(x, y, r * 1.02, ry * 1.02, 0, Math.PI * 0.05, Math.PI * 0.65);
          f.stroke();
        }
        if (r > 2.4) {
          f.fillStyle = 'rgba(255,255,255,0.88)';
          f.globalAlpha = (0.14 + lit * 0.18) + rnd() * 0.1;
          disc(x - r * 0.3, y - ry * 0.34, Math.max(0.3, r * 0.16));
        }
      };

      // Dense small beads, the way a pane looks in the macro reference: many
      // tiny beads, few large ones. Baked once, so density costs nothing per
      // frame — only the offscreen tile gets bigger.
      const scattered = Math.min(12000, Math.round((boxW * boxH) / 110));
      for (let i = 0; i < scattered; i++) {
        const x = rnd() * boxW;
        const y = boxH * Math.pow(rnd(), 0.72);
        if (rnd() < cleared(x, y) * 3.2) continue;
        const b = rnd();
        const r = 0.24 + b * b * b * 2.9;
        drop(x, y, r, 1 + (r > 1.3 ? rnd() * 1.0 : rnd() * 0.3));
      }

      // And crowded along every track, the way real ones bead on a wet path.
      for (let t = 0; t < tracks.length; t++) {
        const { pts, w, len } = tracks[t];
        const n = Math.round(len / 6);
        for (let i = 0; i < n; i++) {
          const p = pts[Math.min(pts.length - 1, Math.floor(rnd() * pts.length))];
          const b = rnd();
          drop(
            p.x + (rnd() - 0.5) * w * 4.5,
            p.y + (rnd() - 0.5) * 10,
            0.24 + b * b * 2.1,
            1 + rnd() * 1,
          );
        }
      }

      /* ── 3. The grade ──────────────────────────────────────────────
         A cool low-light pass, weighted to the lower-right, so the pane
         reads as dark glass in shadow rather than a flat grey sheet. */
      f.globalCompositeOperation = 'source-over';
      f.globalAlpha = 1;
      const grade = f.createLinearGradient(0, 0, boxW, boxH);
      grade.addColorStop(0, 'rgba(8, 12, 18, 0.05)');
      grade.addColorStop(0.5, 'rgba(8, 12, 18, 0.10)');
      grade.addColorStop(1, 'rgba(4, 7, 12, 0.20)');
      f.fillStyle = grade;
      f.fillRect(0, 0, boxW, boxH);
    };

    /**
     * Lay the vapor pane onto the visible canvas. The hero image sits
     * underneath in full colour; wiping punches holes in this layer.
     */
    const paintOverlay = () => {
      if (disposed) return;
      syncBox();
      if (boxW < 8 || boxH < 8) return;
      // A sharp native <img> sits BELOW this capped, disposable effect. Large
      // and Retina displays must not allocate a full-resolution blurred copy.
      dpr = Math.min(window.devicePixelRatio || 1, 1.5, Math.sqrt(MAX_VAPOR_PIXELS / (boxW * boxH)));
      const pxW = Math.floor(boxW * dpr);
      const pxH = Math.floor(boxH * dpr);
      const resized = canvas.width !== pxW || canvas.height !== pxH;

      // Image upgrades and late font loads must never repaint wiped glass.
      // On resize (or remounting the canvas at a breakpoint), finish clearing
      // rather than stretching a stale blurred photo over the new sharp crop.
      if (wiped) {
        if (resized || !ctx) finishWipe();
        return;
      }
      cancelDetail();
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
      if (!vaporEnabled) { hideOverlay(); return; }

      paneGradient(ctx);
      vaporDetailed = false;
      vaporPhoto = false;
      wiper = createHeroWiper(ctx, {
        width: boxW,
        height: boxH,
        onStart: () => {
          wiped = true;
          hasWipedRef.current = true;
          cancelDetail();
          releaseVapor();
        },
        onComplete: finishWipe,
      });

      // Build detail once, off the interaction path. A cancelled or obsolete
      // callback cannot put the filter back after wiping, resizing or leaving.
      const generation = detailGeneration;
      const detail = () => {
        if (disposed || generation !== detailGeneration) return;
        detailIdle = null;
        detailTimer = 0;
        if ((vaporDetailed && vaporPhoto) || wiped || !ctx || boxW < 8) return;
        buildVapor();
        if (vapor) {
          ctx.clearRect(0, 0, boxW, boxH);
          ctx.drawImage(vapor, 0, 0, boxW, boxH);
        }
      };
      if (typeof window.requestIdleCallback === 'function') {
        detailIdle = window.requestIdleCallback(detail, { timeout: 400 });
      } else {
        detailTimer = window.setTimeout(detail, 60);
      }
    };

    const erase = (key: number, x: number, y: number, radius: number) =>
      wiper?.erase(key, x, y, radius);

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
        if (disposed) return;
        measureRing();
        if (!pointerSeen) centre();
      })
      .catch(() => {});

    const img = overlayImgRef.current;
    const onImgLoad = () => paintOverlay();
    if (img && !img.complete) img.addEventListener('load', onImgLoad);

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

    let pointerEver = false;
    let shown: boolean | null = null;

    let scrollTick = false;
    const onScroll = () => {
      if (scrollTick) return;
      scrollTick = true;
      requestAnimationFrame(() => { scrollTick = false; syncBox(); });
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    /**
     * The hero ring no longer carries a lime rim, so the site's own lime
     * cursor circle is the circle the user sees. It stays visible over the
     * hero and reads inside the orbiting CULTURE LED CREATIVE label. Nothing
     * needs to step aside.
     */
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const x = e.clientX - boxLeft;
      const y = e.clientY - boxTop;

      // Outside the hero: park the ring back at centre rather than pinning it
      // to an edge, stop erasing, and hand the cursor back to the site.
      if (x < 0 || y < 0 || x > boxW || y > boxH) {
        pointerSeen = false;
        // Break only the ring's stroke; re-entering elsewhere must not erase a
        // straight line from the old exit point. Letter trails are keyed
        // separately and are unaffected.
        wiper?.resetStroke(RING_STROKE);
        centre();
        return;
      }

      if (!pointerSeen) {
        // First frame back inside. Without this the ring would spring across
        // the whole hero from wherever it was parked, wiping a stripe of glass
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

      if (pointerSeen) erase(RING_STROKE, cx, cy, radius);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      cancelDetail();
      wiper?.dispose();
      releaseVapor();
      io.disconnect();
      bodyTrailRef.current = null;
      window.clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointermove', onPointerMove);
      img?.removeEventListener('load', onImgLoad);
    };
  }, [interactive, vaporEnabled]);

  return (
    <section
      id="hero"
      ref={heroRef}
      className="relative h-[100svh] min-h-[540px] flex items-center justify-center overflow-hidden bg-[#000000]"
    >
      <div className="absolute inset-0 z-0">
        {/* ONE hero plate. There is no second crop and no <picture> switch:
            the vapor is generated from this exact image, so what you see
            ghosting through the rain glass is always what you uncover
            underneath. Responsive widths account for object-cover's real
            image width (including tall screens), not just the narrow viewport.
            The largest existing WebP is only about 160 KB; no artificial upscale. */}
        <img
          ref={overlayImgRef}
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
        {/* The stud. Positioned in image space by placeEarring(), so it stays
            on the lobe at every viewport. Above the photograph, below the
            vapor — you have to wipe the glass to find it. */}
        <div
          ref={earringRef}
          className="hero-earring absolute top-0 left-0 z-[1]"
          style={{ opacity: 0 }}
          aria-hidden
        />
        {/* The vapor is a DESKTOP effect, and only a desktop effect.
            It exists to be wiped, and wiping needs a cursor. On a phone there
            is nothing to wipe with, so a vapor pane is not an effect — it is
            just a photograph you cannot see. Touch, coarse-pointer and
            reduced-motion visitors land on the clean hero image. */}
        {interactive && (
          <canvas ref={eraserRef} className="hero-vapor absolute inset-0 w-full h-full pointer-events-none z-[2]" aria-hidden />
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
            className="hero-pop hero-pop-late font-display text-stroke text-[clamp(2.2rem,10.8vw,10rem)] md:text-[clamp(3.5rem,8.6vw,9.5rem)] leading-[0.86] tracking-[-0.04em] whitespace-nowrap"
          >
            <HeroLetters text="SINCE 2015" />
          </h1>
        </div>
      </div>

      {/* CULTURE LED CREATIVE. No lime rim, no SVG path, no second circle:
          the label itself is the only body of the ring, orbiting the eraser
          centre, and the site's own lime cursor circle reads inside the
          orbit. The ring is still the squeegee — what its path crosses, it
          clears. No lens, no magnification: the glass wipes clean, it does
          not enlarge. Only rendered where there is a real cursor. */}
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
