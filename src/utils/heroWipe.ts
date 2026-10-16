/**
 * Erase glass, never redraw or filter the photograph underneath it.
 * Small cached brushes soften the edge; an opaque round-capped stroke makes
 * the entire core genuinely transparent, including during a fast sweep.
 *
 * Every stroke can also be mirrored into a MASK (a second context whose
 * transform maps hero coordinates into photograph space). The mask is the
 * memory of the wipe: when the visible canvas has to be rebuilt — a resize,
 * a minimise/restore, a responsive remount, a discarded GPU backing store —
 * the pane is redrawn and the mask is cut back out of it, so what has been
 * wiped stays wiped and what has not stays rained-on. Nothing vanishes.
 */
const BRUSH_SCALE = 1.18;
const CLEAR_CORE = 0.8;
const MAX_BRUSHES = 24;
const MAX_STAMPS = 48;
const CELL = 24;
/**
 * The glass only goes when the visitor has wiped ALL of it. Coverage is
 * counted on a 24px grid; the tolerance is a handful of grid cells (0.2%) so
 * a sub-pixel sliver between two strokes can never hold the pane hostage.
 * Walls are reachable (see `wallSnap`), so every cell can genuinely be wiped.
 */
const FINISH_COVERAGE = 0.999;
/**
 * The grid is marked conservatively (a cell counts only when its centre is
 * well inside a stroke's opaque core), so near the end it can lag what the
 * eye sees. From this point the coverage is re-read from the mask itself —
 * the pixels the visitor is actually looking at — at most a few times a
 * second, so "wiped all of it" means exactly that.
 */
const VERIFY_FROM = 0.97;
const VERIFY_EVERY_MS = 220;

type Point = { x: number; y: number };

type Options = {
  width: number;
  height: number;
  onStart: () => void;
  onComplete: () => void;
  /** Optional context the strokes are mirrored into (already transformed). */
  mirror?: CanvasRenderingContext2D | null;
  /**
   * Optional seed for the coverage grid — called once with the grid size,
   * returns 1 for every cell already wiped (read back from the mask).
   */
  sample?: ((columns: number, rows: number) => Uint8Array | null) | null;
};

export const createHeroWiper = (ctx: CanvasRenderingContext2D, options: Options) => {
  const { width, height, onStart, onComplete, mirror = null, sample = null } = options;
  const strokes = new Map<number, Point>();
  const brushes = new Map<number, HTMLCanvasElement>();
  // Unique spatial coverage, not stroke count: rubbing the same patch never
  // completes the whole pane. No getImageData/GPU readback in the hot path.
  const columns = Math.max(1, Math.ceil(width / CELL));
  const rows = Math.max(1, Math.ceil(height / CELL));
  const covered = new Uint8Array(columns * rows);
  const cellW = width / columns;
  const cellH = height / rows;
  let count = 0;
  let started = false;
  let complete = false;

  const reseed = () => {
    const seed = sample ? sample(columns, rows) : null;
    if (!seed || seed.length !== covered.length) return;
    for (let i = 0; i < seed.length; i++) {
      if (seed[i] && !covered[i]) { covered[i] = 1; count++; }
    }
  };
  let lastVerify = 0;

  // A rebuilt pane resumes the wipe exactly where it was.
  reseed();
  if (count > 0) started = true;

  const releaseBrushes = () => {
    for (const brush of brushes.values()) { brush.width = 1; brush.height = 1; }
    brushes.clear();
    strokes.clear();
  };

  const clear = () => {
    if (complete) return;
    complete = true;
    ctx.clearRect(0, 0, width, height);
    releaseBrushes();
    onComplete();
  };

  const brushFor = (radius: number) => {
    let brush = brushes.get(radius);
    if (brush) return brush;
    brush = document.createElement('canvas');
    brush.width = radius * 2;
    brush.height = radius * 2;
    const b = brush.getContext('2d');
    if (!b) return null;
    const gradient = b.createRadialGradient(radius, radius, 0, radius, radius, radius);
    gradient.addColorStop(0, 'rgba(0,0,0,1)');
    gradient.addColorStop(CLEAR_CORE, 'rgba(0,0,0,1)');
    gradient.addColorStop(0.94, 'rgba(0,0,0,0.35)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    b.fillStyle = gradient;
    b.fillRect(0, 0, brush.width, brush.height);
    if (brushes.size >= MAX_BRUSHES) {
      const oldest = brushes.keys().next().value!;
      const retired = brushes.get(oldest)!;
      retired.width = 1;
      retired.height = 1;
      brushes.delete(oldest);
    }
    brushes.set(radius, brush);
    return brush;
  };

  const markCell = (i: number) => {
    if (covered[i]) return;
    covered[i] = 1;
    count++;
  };

  const markCoverage = (a: Point, b: Point, radius: number) => {
    const minX = Math.max(0, Math.floor((Math.min(a.x, b.x) - radius) / cellW));
    const maxX = Math.min(columns - 1, Math.floor((Math.max(a.x, b.x) + radius) / cellW));
    const minY = Math.max(0, Math.floor((Math.min(a.y, b.y) - radius) / cellH));
    const maxY = Math.min(rows - 1, Math.floor((Math.max(a.y, b.y) + radius) / cellH));
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length2 = dx * dx + dy * dy;
    for (let row = minY; row <= maxY; row++) {
      for (let column = minX; column <= maxX; column++) {
        const i = row * columns + column;
        if (covered[i]) continue;
        const x = (column + 0.5) * cellW - a.x;
        const y = (row + 0.5) * cellH - a.y;
        const t = length2 ? Math.max(0, Math.min(1, (x * dx + y * dy) / length2)) : 0;
        if ((x - dx * t) ** 2 + (y - dy * t) ** 2 <= radius * radius) markCell(i);
      }
    }
  };

  /** Mark every cell whose centre lies inside a rectangle. */
  const markRect = (x0: number, y0: number, x1: number, y1: number) => {
    const minX = Math.max(0, Math.floor(x0 / cellW));
    const maxX = Math.min(columns - 1, Math.floor(x1 / cellW));
    const minY = Math.max(0, Math.floor(y0 / cellH));
    const maxY = Math.min(rows - 1, Math.floor(y1 / cellH));
    for (let row = minY; row <= maxY; row++) {
      const cy = (row + 0.5) * cellH;
      if (cy < y0 || cy > y1) continue;
      for (let column = minX; column <= maxX; column++) {
        const cx = (column + 0.5) * cellW;
        if (cx < x0 || cx > x1) continue;
        markCell(row * columns + column);
      }
    }
  };

  /**
   * The squeegee pressed against the frame pushes the rain off the edge.
   * The ring is clamped inside the hero, so without this a hairline of
   * glass along every wall (and every corner) could never be reached — the
   * pane could never be wiped completely, by anyone.
   */
  const wallRects = (x: number, y: number, radius: number, core: number) => {
    const rects: Array<[number, number, number, number]> = [];
    const left = x - radius <= 1;
    const right = x + radius >= width - 1;
    const top = y - radius <= 1;
    const bottom = y + radius >= height - 1;
    if (left) rects.push([0, y - core, x, y + core]);
    if (right) rects.push([x, y - core, width, y + core]);
    if (top) rects.push([x - core, 0, x + core, y]);
    if (bottom) rects.push([x - core, y, x + core, height]);
    if (left && top) rects.push([0, 0, x, y]);
    if (right && top) rects.push([x, 0, width, y]);
    if (left && bottom) rects.push([0, y, x, height]);
    if (right && bottom) rects.push([x, y, width, height]);
    return rects;
  };

  /** One stroke, drawn identically onto the glass and into the mask. */
  const paintStroke = (
    c: CanvasRenderingContext2D,
    op: GlobalCompositeOperation,
    brush: HTMLCanvasElement,
    r: number,
    from: Point,
    to: Point,
    steps: number,
    joined: boolean,
    rects: Array<[number, number, number, number]>,
  ) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    c.save();
    c.globalCompositeOperation = op;
    c.globalAlpha = 1;
    for (let i = 1; i <= steps; i++) {
      c.drawImage(brush, from.x + dx * i / steps - r, from.y + dy * i / steps - r);
    }
    // A single opaque path closes gaps between capped stamps on a fast
    // sweep and removes the last 1–2% of blurred/tinted glass in one pass.
    c.strokeStyle = '#000000';
    c.fillStyle = '#000000';
    c.lineWidth = r * CLEAR_CORE * 2;
    c.lineCap = 'round';
    c.beginPath();
    if (joined) {
      c.moveTo(from.x, from.y);
      c.lineTo(to.x, to.y);
      c.stroke();
    } else {
      c.arc(to.x, to.y, r * CLEAR_CORE, 0, Math.PI * 2);
      c.fill();
    }
    for (const [x0, y0, x1, y1] of rects) c.fillRect(x0, y0, x1 - x0, y1 - y0);
    c.restore();
  };

  return {
    get complete() { return complete; },
    /** Fraction of the visible glass already wiped (0..1). */
    get coverage() { return count / covered.length; },
    clear,
    resetStroke: (key: number) => { strokes.delete(key); },
    dispose: () => { complete = true; releaseBrushes(); },
    erase: (key: number, x: number, y: number, radius: number) => {
      if (complete) return;
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(radius)) return;
      const previous = strokes.get(key);
      if (previous && Math.hypot(x - previous.x, y - previous.y) < 0.6) return;
      // Quantise by two pixels so differently sized letters reuse brushes
      // instead of rebuilding a single shared sprite on every actor/frame.
      const r = Math.max(2, Math.round(radius * BRUSH_SCALE / 2) * 2);
      const brush = brushFor(r);
      if (!brush) return;
      if (!started) { started = true; onStart(); }
      const from = previous ?? { x, y };
      const to = { x, y };
      const steps = Math.min(MAX_STAMPS, Math.max(1, Math.ceil(Math.hypot(x - from.x, y - from.y) / Math.max(radius * 0.34, 1))));
      const core = r * CLEAR_CORE;
      const rects = wallRects(x, y, radius, core);

      paintStroke(ctx, 'destination-out', brush, r, from, to, steps, !!previous, rects);
      // The mask is opaque wherever the glass has gone.
      if (mirror) paintStroke(mirror, 'source-over', brush, r, from, to, steps, !!previous, rects);

      markCoverage(from, to, core * 0.95);
      for (const [x0, y0, x1, y1] of rects) markRect(x0, y0, x1, y1);
      if (sample && count / covered.length >= VERIFY_FROM && count / covered.length < FINISH_COVERAGE) {
        const now = performance.now();
        if (now - lastVerify >= VERIFY_EVERY_MS) { lastVerify = now; reseed(); }
      }
      if (count / covered.length >= FINISH_COVERAGE) {
        // Every reachable cell has been wiped: lift the last soft-edged
        // slivers too, so the photograph is left genuinely clear.
        clear();
      } else if (previous) {
        previous.x = x;
        previous.y = y;
      } else {
        strokes.set(key, { x, y });
      }
    },
  };
};

export type HeroWiper = ReturnType<typeof createHeroWiper>;
