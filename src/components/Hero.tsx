import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ScribbleX, ScribbleUnderline, FloatingCross, FloatingWave } from './Scribbles';
import SplitFlapText from './SplitFlapText';
import { useHeroPhysics, type HeroCursor } from '../hooks/useHeroPhysics';

/**
 * Where `object-fit: cover` has actually put the photograph inside a box.
 *
 * Both the magnifier and the earring need to convert a point on the
 * photograph into a point on screen, and the answer depends on the crop. Read
 * `object-position` rather than assuming centre, so the CSS stays the single
 * source of truth — including the mobile override.
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

/** The stud, in normalised photograph coordinates: the centre of his lobe. */
const EAR_U = 0.51;
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
  const lensRef = useRef<HTMLCanvasElement>(null);
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
   * The steam, the magnifier and the wipe are one desktop feature, gated
   * together. A fine pointer that can hover, no reduced-motion preference,
   * and a viewport wide enough to be a computer. Anything else — every
   * phone, every tablet — gets the photograph, clean, on landing.
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

      // The lens buffer. This one DOES want real pixels — it is showing the
      // photograph magnified, so softness here would defeat the whole point.
      const lens = lensRef.current;
      if (lens) {
        const ldpr = Math.min(window.devicePixelRatio || 1, 2);
        const px = Math.max(1, Math.floor(size * ldpr));
        if (lens.width !== px || lens.height !== px) {
          lens.width = px;
          lens.height = px;
        }
        lens.style.width = `${size}px`;
        lens.style.height = `${size}px`;
      }

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
        // The label now orbits OUTSIDE the lens rather than inside it —
        // the glass needs its whole diameter to magnify with, and the words
        // reading around the rim is what makes it a lens and not a hole.
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
     * tracked down it. The cursor lens and every displaced letter squeegee
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
     * The detailed tile is roughly fourteen thousand draw operations — every
     * fleck, bead and runnel. That is nothing per frame (it is baked ONCE and
     * only ever composited afterwards) but it is very much something to run
     * inside the first frame of the site, which is the one frame that must
     * not stutter.
     *
     * So: `paintOverlay` lays down the flat misted pane synchronously — one
     * gradient, instant, and visually almost identical — and the beads and
     * runnels are rendered on the next idle callback and swapped in. Nobody
     * can tell, and the hero opens clean.
     */
    let fogDetailed = false;
    /** True the moment the visitor clears any glass at all. */
    let wiped = false;

    const paneGradient = (f: CanvasRenderingContext2D) => {
      const sheet = f.createLinearGradient(0, 0, 0, boxH);
      sheet.addColorStop(0, 'rgba(108,116,119,0.93)');
      sheet.addColorStop(0.45, 'rgba(90,97,100,0.94)');
      sheet.addColorStop(1, 'rgba(60,66,68,0.95)');
      f.fillStyle = sheet;
      f.fillRect(0, 0, boxW, boxH);

      const grade = f.createLinearGradient(0, 0, 0, boxH);
      grade.addColorStop(0, 'rgba(23,25,24,0.26)');
      grade.addColorStop(0.36, 'rgba(23,25,24,0.18)');
      grade.addColorStop(1, 'rgba(23,25,24,0.62)');
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

      const rnd = seeded(9187 + Math.round(boxW) * 31 + Math.round(boxH));
      fogDetailed = true;

      /* ── 1. The pane ────────────────────────────────────────────────
         Cold misted glass. There is no photograph baked in here: the
         steam is its own material, so what you are looking at before you
         wipe is a genuinely fogged window rather than a filter over the
         portrait. */
      const sheet = f.createLinearGradient(0, 0, 0, boxH);
      sheet.addColorStop(0, 'rgba(108,116,119,0.93)');
      sheet.addColorStop(0.45, 'rgba(90,97,100,0.94)');
      sheet.addColorStop(1, 'rgba(60,66,68,0.95)');
      f.fillStyle = sheet;
      f.fillRect(0, 0, boxW, boxH);

      // Where the mist gathered thickest. Broad, soft, deliberately uneven.
      for (let i = 0; i < 9; i++) {
        const px = (0.06 + rnd() * 0.88) * boxW;
        const py = (0.04 + rnd() * 0.9) * boxH;
        const rad = Math.max(boxW, boxH) * (0.16 + rnd() * 0.3);
        const g = f.createRadialGradient(px, py, 0, px, py, rad);
        const a = 0.05 + rnd() * 0.07;
        g.addColorStop(0, `rgba(214,230,236,${a.toFixed(3)})`);
        g.addColorStop(0.55, `rgba(214,230,236,${(a * 0.42).toFixed(3)})`);
        g.addColorStop(1, 'rgba(214,230,236,0)');
        f.fillStyle = g;
        f.fillRect(0, 0, boxW, boxH);
      }

      /* ── 2. Frost ──────────────────────────────────────────────────
         The tooth of the mist: single-pixel flecks, baked once, which is
         what stops the pane reading as a flat grey rectangle. */
      const flecks = Math.min(9000, Math.round((boxW * boxH) / 240));
      for (let i = 0; i < flecks; i++) {
        f.globalAlpha = 0.012 + rnd() * 0.05;
        f.fillStyle = rnd() > 0.4 ? '#ecf6fa' : '#96a6ac';
        f.fillRect(rnd() * boxW, rnd() * boxH, 1, 1);
      }
      f.globalAlpha = 1;

      /* ── 3. Runnels ────────────────────────────────────────────────
         Water that has already tracked down the pane.

         The important discovery here: a runnel must NOT punch a hole
         through the mist. Clearing it right down to the photograph makes
         the channel pick up whatever is behind — over the subject's face
         that is skin tone, and the pane instantly reads as grime rather
         than water. So a runnel only THINS the mist, and what makes it
         legible as water is a pair of lit shoulders either side of it.
         Water on glass is a lens, not a window. */
      type Pt = { x: number; y: number };

      const tapered = (
        pts: Pt[], w0: number, w1: number, alpha: number, erase2: boolean, offset = 0,
      ) => {
        f.globalCompositeOperation = erase2 ? 'destination-out' : 'source-over';
        f.globalAlpha = alpha;
        f.strokeStyle = erase2 ? '#000' : 'rgba(242,250,252,1)';
        f.lineCap = 'round';
        f.lineJoin = 'round';
        // Canvas cannot taper a single stroke, so the run is drawn as a
        // chain of short segments whose width narrows toward the tail —
        // which is how a real trickle thins out as it loses water.
        for (let i = 0; i < pts.length - 1; i++) {
          const t = i / (pts.length - 1);
          f.lineWidth = Math.max(0.4, w0 + (w1 - w0) * t);
          f.beginPath();
          f.moveTo(pts[i].x + offset, pts[i].y);
          f.lineTo(pts[i + 1].x + offset, pts[i + 1].y);
          f.stroke();
        }
      };

      const tracks: { pts: Pt[]; w: number }[] = [];
      const runs = Math.max(5, Math.round(boxW / 115));
      for (let i = 0; i < runs; i++) {
        const x = rnd() * boxW;
        const top = rnd() * boxH * 0.3;
        const len = boxH * (0.22 + rnd() * 0.78);
        const w = 1.4 + rnd() * 3.2;
        const wob = 2 + rnd() * 6;
        const phase = rnd() * 6.28;
        const drift = (rnd() - 0.5) * 0.05;

        const pts: Pt[] = [];
        for (let s2 = 0; s2 <= 22; s2++) {
          const t = s2 / 22;
          pts.push({
            x: x + Math.sin(t * 5.5 + phase) * wob + t * len * drift,
            y: top + len * t,
          });
        }

        // A wide, barely-there halo of thinned mist…
        tapered(pts, w * 3.2, w * 1.7, 0.05 + rnd() * 0.05, true);
        // …the channel itself…
        tapered(pts, w, w * 0.45, 0.24 + rnd() * 0.24, true);
        // …and the two lit shoulders that read as water.
        const edge = 0.1 + rnd() * 0.08;
        tapered(pts, w * 0.5, w * 0.24, edge, false, -w * 0.62);
        tapered(pts, w * 0.5, w * 0.24, edge * 0.8, false, w * 0.62);

        // The bead that stopped at the end of the run.
        f.globalCompositeOperation = 'destination-out';
        f.globalAlpha = 0.55;
        f.fillStyle = '#000';
        f.beginPath();
        f.arc(pts[pts.length - 1].x, pts[pts.length - 1].y, w * 0.8, 0, Math.PI * 2);
        f.fill();

        tracks.push({ pts, w });
      }
      f.globalAlpha = 1;
      f.globalCompositeOperation = 'source-over';

      /* ── 4. Condensation ───────────────────────────────────────────
         The dominant feature of the reference, and the thing that sells
         it: thousands of small beads. Each thins the mist, carries a rim
         light on its shoulder, and the larger ones catch a specular
         pin-light. Baked once; free at runtime. */
      const bead = (x: number, y: number, r: number) => {
        const ry = r * (1 + Math.min(1, r / 4) * 0.55);

        f.globalCompositeOperation = 'destination-out';
        f.globalAlpha = 0.34 + rnd() * 0.34;
        f.fillStyle = '#000';
        f.beginPath();
        f.ellipse(x, y, r, ry, 0, 0, Math.PI * 2);
        f.fill();

        f.globalCompositeOperation = 'source-over';
        if (r > 1) {
          f.globalAlpha = 0.16 + rnd() * 0.16;
          f.strokeStyle = 'rgba(238,248,252,1)';
          f.lineWidth = Math.max(0.4, r * 0.3);
          f.beginPath();
          f.ellipse(x, y, r * 1.04, ry * 1.04, 0, Math.PI * 0.15, Math.PI * 1.15);
          f.stroke();
        }
        if (r > 1.7) {
          f.globalAlpha = 0.3 + rnd() * 0.25;
          f.fillStyle = 'rgba(255,255,255,0.95)';
          f.beginPath();
          f.arc(x - r * 0.34, y - ry * 0.38, Math.max(0.4, r * 0.24), 0, Math.PI * 2);
          f.fill();
        }
      };

      const beads = Math.min(9000, Math.round((boxW * boxH) / 300));
      for (let i = 0; i < beads; i++) {
        const bias = rnd();
        bead(rnd() * boxW, rnd() * boxH, 0.5 + bias * bias * 2.9);
      }
      // Beads crowd along the wet tracks, which is what ties the two
      // features together instead of leaving them as separate layers.
      for (const track of tracks) {
        const last = track.pts[track.pts.length - 1];
        const len = last.y - track.pts[0].y;
        const n = Math.round(len / 6);
        for (let i = 0; i < n; i++) {
          const t = rnd();
          const at = track.pts[Math.min(track.pts.length - 1, Math.round(t * 22))];
          const bias = rnd();
          bead(
            at.x + (rnd() - 0.5) * track.w * 7,
            at.y,
            0.5 + bias * bias * 2.2,
          );
        }
      }
      f.globalAlpha = 1;
      f.globalCompositeOperation = 'source-over';

      /* ── 5. The grade ──────────────────────────────────────────────
         Cream type over a bright pane is unreadable. This is what buys
         the headline its contrast back without flattening the glass. */
      const grade = f.createLinearGradient(0, 0, 0, boxH);
      grade.addColorStop(0, 'rgba(23,25,24,0.26)');
      grade.addColorStop(0.36, 'rgba(23,25,24,0.18)');
      grade.addColorStop(1, 'rgba(23,25,24,0.62)');
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
      // The pane now carries real detail — single-pixel frost and beads a
      // couple of pixels across — so it does want better than half
      // resolution. 1.5 is the balance: the water stays crisp, and the
      // per-wipe fill cost is still well under a full Retina buffer.
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

    /**
     * Where the photograph actually sits.
     *
     * `object-fit: cover` crops; to put anything on top of the picture at a
     * known point of the PICTURE (an earring on an ear) we have to redo the
     * browser's own mapping. Read object-position rather than assuming
     * centre, so the CSS stays the single source of truth.
     */
    // Cached, because coverOf() reads getComputedStyle and this used to be
    // recomputed inside the animation loop — a synchronous style flush every
    // frame, which is exactly what makes a cursor-follower feel like it is
    // catching on something. Geometry only changes when the box or the image
    // changes, and both of those call refreshCover().
    let cover: Cover | null = null;
    const refreshCover = () => {
      const src = overlayImgRef.current;
      cover = src ? coverOf(src, boxW, boxH) : null;
    };

    /**
     * The magnifying glass.
     *
     * CULTURE LED CREATIVE orbits a real lens: the ring redraws the
     * photograph beneath it, magnified, clipped to a circle. Because the
     * ring is also the eraser, the glass both clears the mist and enlarges
     * what it clears — one gesture doing two jobs.
     *
     * It is one drawImage of a small source rect into a ~110px buffer, so
     * the cost is trivial next to the full-width pane it sits on.
     */
    const LENS_ZOOM = 1.85;
    // Held, because getContext() on every frame is a needless lookup.
    let lensCtx: CanvasRenderingContext2D | null = null;
    const drawLens = () => {
      const lens = lensRef.current;
      const src = overlayImgRef.current;
      if (!lens || !src) return;
      const lctx = lensCtx ?? (lensCtx = lens.getContext('2d'));
      const geo = cover;
      if (!lctx || !geo) return;

      const size = lens.width;
      lctx.setTransform(1, 0, 0, 1, 0, 0);
      lctx.clearRect(0, 0, size, size);
      lctx.save();
      lctx.beginPath();
      lctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      lctx.clip();

      // Hero-local centre → source pixels, then take a smaller bite than the
      // lens covers. A smaller bite drawn into the same circle IS the zoom.
      const sxc = (cx - geo.ox) / geo.scale;
      const syc = (cy - geo.oy) / geo.scale;
      const half = radius / (geo.scale * LENS_ZOOM);
      lctx.drawImage(src, sxc - half, syc - half, half * 2, half * 2, 0, 0, size, size);

      // A breath of glass: the edge of a real lens darkens and bends.
      const vign = lctx.createRadialGradient(
        size / 2, size / 2, size * 0.3, size / 2, size / 2, size / 2,
      );
      vign.addColorStop(0, 'rgba(0,0,0,0)');
      vign.addColorStop(1, 'rgba(8,12,14,0.42)');
      lctx.fillStyle = vign;
      lctx.fillRect(0, 0, size, size);
      lctx.restore();
    };

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
    refreshCover();
    paintOverlay();
    centre();

    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    fonts?.ready
      .then(() => {
        measureRing();
        refreshCover();
        paintOverlay();
            centre();
      })
      .catch(() => {});

    const img = overlayImgRef.current;
    const onImgLoad = () => { refreshCover(); paintOverlay(); };
    if (img && !img.complete) img.addEventListener('load', onImgLoad);

    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        primed = false;
        measureRing();
        refreshCover();
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
     * While the pointer is over the hero, the magnifier IS the cursor — so the
     * site's own lime circle steps aside. Two concentric lime circles inside
     * the CULTURE LED CREATIVE ring is one circle too many; the lens rim is
     * the one that means something here.
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

      // The lens tracks the ring every frame it is on screen, wiped or not:
      // a magnifying glass that only magnifies while moving is a gimmick.
      drawLens();

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
          height="1429"
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

      {/* CULTURE LED CREATIVE — a real magnifying glass that wraps the
          cursor, sized just under the "O" of AWESOMENESS. The lens shows the
          photograph enlarged, a lime circle rims it, and the label orbits
          outside the glass. Only rendered where there is a real cursor. */}
      {interactive && (
        <div
          ref={ringRef}
          className="hero-ring absolute top-0 left-0 z-30 pointer-events-none"
          style={{ opacity: 0 }}
          aria-hidden
        >
          <canvas ref={lensRef} className="hero-lens absolute inset-0 block rounded-full" />
          <div className="hero-lens-rim absolute inset-0 rounded-full" />
          <svg width="100%" height="100%" className="absolute inset-0 overflow-visible block">
            <defs>
              <path id={ringPathId} fill="none" />
            </defs>
            {/* The label rides a circle OUTSIDE the glass, so it never sits
                on top of what the lens is magnifying. */}
            <g ref={ringSpinRef}>
              <text
                fill="#d7ff4f"
                fontFamily="'JetBrains Mono', ui-monospace, SFMono-Regular, monospace"
                fontWeight="700"
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
