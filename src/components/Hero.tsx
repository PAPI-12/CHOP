import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ScribbleX, ScribbleUnderline, FloatingCross, FloatingWave } from './Scribbles';
import SplitFlapText from './SplitFlapText';
import { useHeroPhysics, type HeroCursor } from '../hooks/useHeroPhysics';

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
    Re-derived when the plate was re-cropped to centre him — the old 0.51 was
    measured against a frame that started 600px further left. */
const EAR_U = 0.38;
const EAR_V = 0.4875;

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
  const earringRef = useRef<HTMLDivElement>(null);
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

  /**
   * Is this the web version?
   *
   * The steam and the wipe are one desktop feature, gated together. A fine
   * pointer that can hover, no reduced-motion preference, and a viewport wide
   * enough to be a computer. Anything else — every phone, every tablet — gets
   * the photograph, clean, on landing.
   *
   * This re-evaluates, because a desktop browser dragged narrow and back is
   * the cheapest way to end up with a fogged pane and no way to clear it.
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
   * desktop steam effect, which bails out entirely on touch — so the stud
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

    /**
     * Eraser strokes, one per emitter: the ring uses RING_STROKE, each physics
     * body uses its own key. Tracking them separately means a letter's trail is
     * never joined to the ring's trail by a stray line across the hero.
     */
    let ctx: CanvasRenderingContext2D | null = null;
    const strokes = new Map<number, { x: number; y: number }>();

    /**
     * Wiped glass stays wiped.
     *
     * There is deliberately no re-fogging pass. Mist creeping back over a
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
        radius = Math.max((glyphDiameter * 0.92) / 2, 26);
      } else {
        radius = Math.max(Math.min(boxW, boxH) * 0.045, 30);
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
        const px = Math.max(10, Math.min(20, radius * 0.34));
        // The label now orbits OUTSIDE the circle rather than inside it —
        // the glass needs its whole diameter to live in, and the words
        // reading around the rim is what makes it a cursor and not a hole.
        const pr = radius + px * 1.15;
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
     * ── The misted pane ────────────────────────────────────────────────
     *
     * A sheet of cold glass someone has been breathing on: milky, beaded
     * with condensation, and cut through by runnels where water has already
     * tracked down it. The cursor ring and every displaced letter squeegee
     * it away, and the sharp portrait shows through where you have wiped.
     *
     * The whole pane is rendered ONCE into an offscreen tile. Every later
     * operation is a single drawImage, so nothing re-draws thousands of
     * droplets per frame — that is what keeps the hero at a steady 60fps.
     */
    let fog: HTMLCanvasElement | null = null;

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
    let fogDetailed = false;
    /** True the moment the visitor clears any glass at all. */
    let wiped = false;

    /**
     * The stand-in pane, drawn synchronously so the hero is never briefly
     * unfogged. Deliberately a plain gradient at roughly the field's average
     * density — it is on screen for one idle callback at most.
     */
    const paneGradient = (f: CanvasRenderingContext2D) => {
      // A thin, translucent haze — not a solid sheet. The photograph must stay
      // legible behind it from the first frame, and the dense detail is added
      // by buildFog() a moment later.
      const sheet = f.createLinearGradient(0, 0, 0, boxH);
      sheet.addColorStop(0, 'rgba(246,247,246,0.25)');
      sheet.addColorStop(0.45, 'rgba(242,243,242,0.30)');
      sheet.addColorStop(1, 'rgba(234,236,235,0.36)');
      f.fillStyle = sheet;
      f.fillRect(0, 0, boxW, boxH);

      // Keeps the cream type legible without flattening the pane.
      const grade = f.createLinearGradient(0, 0, 0, boxH);
      grade.addColorStop(0, 'rgba(20,22,21,0.08)');
      grade.addColorStop(0.36, 'rgba(20,22,21,0.05)');
      grade.addColorStop(1, 'rgba(20,22,21,0.16)');
      f.fillStyle = grade;
      f.fillRect(0, 0, boxW, boxH);
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

      const rnd = seeded(20259 + Math.round(boxW) * 31 + Math.round(boxH));
      fogDetailed = true;

      /* ── 1. The condensation field ─────────────────────────────────
         Not a sheet. A constant alpha is what makes an overlay feel like a
         solid panel laid over a photograph, and no amount of texture on top
         of it repairs that.

         Real breath-fog is thick where the air was wettest and thin where
         warmth has eaten it away. Density is four octaves of smoothstep
         value noise, curved to push the midtones apart, minus soft blooms
         where the fog has cleared — including a deliberate one over the
         subject's face, because a face radiates heat and the glass in front
         of a face is always the first thing to go.

         Strictly neutral: thick condensation is white, thin is a pale grey.
         The glass tints nothing. */
      const FIELD = 4;
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
          let a = (0.16 + n * 0.30) * vert;
          a *= 1 - Math.min(0.9, cleared(x, y) * 1.15);
          a = Math.min(0.62, Math.max(0.07, a));

          const k = (a - 0.07) / 0.55;
          const tone = 224 + 26 * k;
          const o4 = (fy * fw + fx) * 4;
          px32[o4] = tone;
          px32[o4 + 1] = tone;
          px32[o4 + 2] = tone;
          px32[o4 + 3] = a * 255;
        }
      }
      sctx.putImageData(buf, 0, 0);
      f.imageSmoothingEnabled = true;
      f.imageSmoothingQuality = 'high';
      f.drawImage(small, 0, 0, boxW, boxH);

      /* ── 2. Water ──────────────────────────────────────────────────
         A drop of water on glass is a LENS, not a hole.

         That distinction decides everything here. Punch a hole and you show
         whatever is behind — over a pale wall the drop vanishes, over a face
         it shows skin and reads as a stain. Water refracts light away from
         the viewer, which is why the water in the reference photograph is
         DARK against a bright misted pane whatever is behind it. So every
         drop and every runnel does three things: it thins the mist a little,
         it tints what is left toward neutral graphite, and it catches a rim
         of light. The tint is what keeps them neutral wherever they fall. */

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

      /* Runnels — wide bands, because a wide dark channel reads as water and
         a thin one reads as a stain on the glass. */
      const tracks: Array<{ pts: Pt[]; w: number; len: number }> = [];
      const runs = Math.max(6, Math.round(boxW / 125));
      for (let i = 0; i < runs; i++) {
        let x = rnd() * boxW;
        // Never straight down his face.
        if (x > 0.36 * boxW && x < 0.64 * boxW) {
          const k = (x - 0.36 * boxW) / (0.28 * boxW);
          x = rnd() < 0.5 ? k * 0.36 * boxW : boxW - k * 0.36 * boxW;
        }
        const top = -boxH * 0.05 + rnd() * boxH * 0.2;
        const len = boxH * (0.4 + rnd() * 0.7);
        const w = Math.max(3, (5 + rnd() * 9) * (boxW / 900));
        const wob = 3 + rnd() * 9;
        const phase = rnd() * 6.28;
        const drift = (rnd() - 0.5) * 0.05;
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
        along(pts, w * 3.4, w * 2.0, disc);

        // The channel: thinner mist...
        f.globalAlpha = 0.14;
        along(pts, w, w * 0.5, disc);

        // ...tinted graphite, so it stays neutral over skin as over wall.
        const dark = Math.round(54 + rnd() * 30);
        f.globalCompositeOperation = 'source-atop';
        f.fillStyle = `rgb(${dark},${dark},${dark})`;
        f.globalAlpha = 0.52 + rnd() * 0.14;
        along(pts, w * 0.9, w * 0.45, disc);

        // Lit shoulders.
        f.globalCompositeOperation = 'source-over';
        f.fillStyle = 'rgb(252,252,252)';
        f.globalAlpha = 0.03 + rnd() * 0.03;
        along(pts, w * 1.6, w * 0.8, disc);
      }

      /* Droplets. Water obeys gravity and warmth: more of it low down, far
         less across the patch his face has cleared. Macro-reference density
         on a full-figure hero is not condensation, it is spatter. */
      const drop = (x: number, y: number, r: number, el: number) => {
        const ry = r * el;

        f.globalCompositeOperation = 'destination-out';
        f.fillStyle = '#000';
        f.globalAlpha = 0.15 + rnd() * 0.2;
        f.beginPath();
        f.ellipse(x, y, r, ry, 0, 0, Math.PI * 2);
        f.fill();

        const dark = Math.round(56 + rnd() * 44);
        f.globalCompositeOperation = 'source-atop';
        f.fillStyle = `rgb(${dark},${dark},${dark})`;
        f.globalAlpha = 0.38 + rnd() * 0.24;
        f.beginPath();
        f.ellipse(x, y, r, ry, 0, 0, Math.PI * 2);
        f.fill();

        f.globalCompositeOperation = 'source-over';
        // Only the larger beads carry a hint of a rim — a hard highlight on
        // every drop is what makes them read as painted circles.
        if (r > 2.1) {
          f.strokeStyle = 'rgba(255,255,255,0.7)';
          f.lineWidth = Math.max(0.4, r * 0.24);
          f.globalAlpha = 0.09 + rnd() * 0.09;
          f.beginPath();
          f.ellipse(x, y, r * 1.02, ry * 1.02, 0, Math.PI * 0.05, Math.PI * 0.65);
          f.stroke();
        }
        if (r > 2.6) {
          f.fillStyle = 'rgba(255,255,255,0.85)';
          f.globalAlpha = 0.18 + rnd() * 0.12;
          disc(x - r * 0.3, y - ry * 0.34, Math.max(0.35, r * 0.18));
        }
      };

      const scattered = Math.min(1700, Math.round((boxW * boxH) / 950));
      for (let i = 0; i < scattered; i++) {
        const x = rnd() * boxW;
        const y = boxH * Math.pow(rnd(), 0.72);
        if (rnd() < cleared(x, y) * 3.2) continue;
        const b = rnd();
        const r = 0.4 + b * b * b * 4.4;
        drop(x, y, r, 1 + (r > 1.4 ? rnd() * 1.2 : rnd() * 0.3));
      }

      // And crowded along every track, the way real ones bead on a wet path.
      for (let t = 0; t < tracks.length; t++) {
        const { pts, w, len } = tracks[t];
        const n = Math.round(len / 10);
        for (let i = 0; i < n; i++) {
          const p = pts[Math.min(pts.length - 1, Math.floor(rnd() * pts.length))];
          const b = rnd();
          drop(
            p.x + (rnd() - 0.5) * w * 4.5,
            p.y + (rnd() - 0.5) * 10,
            0.4 + b * b * 2.6,
            1 + rnd() * 1,
          );
        }
      }

      /* ── 3. The grade ──────────────────────────────────────────────
         Almost nothing, and neutral. A heavy dark pass was half of what
         used to read as solid. */
      f.globalCompositeOperation = 'source-over';
      f.globalAlpha = 1;
      const grade = f.createLinearGradient(0, 0, 0, boxH);
      grade.addColorStop(0, 'rgba(26,26,26,0.05)');
      grade.addColorStop(0.36, 'rgba(26,26,26,0.02)');
      grade.addColorStop(1, 'rgba(26,26,26,0.14)');
      f.fillStyle = grade;
      f.fillRect(0, 0, boxW, boxH);
    };

    /**
     * Lay the fogged pane onto the visible canvas. The hero image sits
     * underneath in full colour; wiping punches holes in this layer.
     */
    const paintOverlay = () => {
      syncBox();
      if (boxW < 8 || boxH < 8) return;
      // The pane now carries real detail — beads and runnels a couple of
      // pixels across — so it does want better than half resolution. 1.5 is
      // the balance: the water stays crisp, and the per-wipe fill cost is
      // still well under a full Retina buffer.
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
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

      // Stage one: the flat pane, immediately.
      paneGradient(ctx);
      strokes.clear();
      wiped = false;
      fogDetailed = false;

      // Stage two: the water, once the browser has drawn a frame.
      const detail = () => {
        // Resized again, or the visitor has already started wiping — either
        // way, do not stamp a fresh pane over what is on screen.
        if (fogDetailed || wiped || !ctx || boxW < 8) return;
        buildFog();
        if (fog) ctx.drawImage(fog, 0, 0, boxW, boxH);
      };
      const ric = (window as Window & {
        requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
      }).requestIdleCallback;
      if (ric) ric(detail, { timeout: 400 });
      else window.setTimeout(detail, 60);
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

      wiped = true;

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
     * While the pointer is over the hero, the ring IS the cursor — so the
     * site's own lime circle steps aside. Two concentric lime circles inside
     * the CULTURE LED CREATIVE ring is one circle too many; the ring is the
     * one that means something here.
     */
    const setHeroCursor = (on: boolean) => {
      if (on) document.body.dataset.heroCursor = '1';
      else delete document.body.dataset.heroCursor;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const x = e.clientX - boxLeft;
      const y = e.clientY - boxTop;

      // Outside the hero: park the ring back at centre rather than pinning it
      // to an edge, stop erasing, and hand the cursor back to the site.
      if (x < 0 || y < 0 || x > boxW || y > boxH) {
        pointerSeen = false;
        setHeroCursor(false);
        // Break only the ring's stroke; re-entering elsewhere must not erase a
        // straight line from the old exit point. Letter trails are keyed
        // separately and are unaffected.
        strokes.delete(RING_STROKE);
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
      setHeroCursor(true);
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
      cancelAnimationFrame(raf);
      io.disconnect();
      bodyTrailRef.current = null;
      window.clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointermove', onPointerMove);
      img?.removeEventListener('load', onImgLoad);
      delete document.body.dataset.heroCursor;
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
          height="1803"
          fetchPriority="high"
          decoding="async"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        {/* The stud. Positioned in image space by placeEarring(), so it stays
            on the ear at every viewport. Above the photograph, below the mist
            — you have to wipe the glass to find it. */}
        <div
          ref={earringRef}
          className="hero-earring absolute top-0 left-0 z-[1]"
          style={{ opacity: 0 }}
          aria-hidden
        />
        {/* The steam is a DESKTOP effect, and only a desktop effect.
            It exists to be wiped, and wiping needs a cursor. On a phone there
            is nothing to wipe with, so a fogged pane is not an effect — it is
            just a photograph you cannot see. Touch, coarse-pointer and
            reduced-motion visitors land on the clean hero image. */}
        {interactive && (
          <canvas ref={eraserRef} className="absolute inset-0 w-full h-full pointer-events-none z-[2]" aria-hidden />
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

      {/* CULTURE LED CREATIVE. One lime circle, sized just under the "O" of
          AWESOMENESS, with the label orbiting outside it. The circle is the
          cursor and the eraser — it is what clears the steam. No lens, no
          magnification: the glass wipes clean, it does not enlarge.
          Only rendered where there is a real cursor. */}
      {interactive && (
        <div
          ref={ringRef}
          className="hero-ring absolute top-0 left-0 z-30 pointer-events-none"
          style={{ opacity: 0 }}
          aria-hidden
        >
          {/* Exactly one lime circle, and it is this one. */}
          <div className="hero-ring-circle absolute inset-0 rounded-full" />
          <svg width="100%" height="100%" className="absolute inset-0 overflow-visible block">
            <defs>
              <path id={ringPathId} fill="none" />
            </defs>
            {/* The label rides a circle OUTSIDE the glass, so it never sits
                on top of what the ring is wiping. */}
            <g ref={ringSpinRef}>
              {/* Inter Black, not the mono. JetBrains Mono's bold is a
                  narrow-stemmed 700 and at this size it simply does not read
                  as bold — the label kept looking light however the weight
                  was declared. Inter ships a real 900, and a hairline stroke
                  in the same lime under the fill thickens the stems further
                  without touching the letterforms. */}
              <text
                fill="#d7ff4f"
                stroke="#d7ff4f"
                strokeWidth="0.7"
                paintOrder="stroke"
                fontFamily="Inter, system-ui, sans-serif"
                fontWeight="900"
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
