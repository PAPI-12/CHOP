/**
 * Erase glass, never redraw or filter the photograph underneath it.
 * Small cached brushes soften the edge; an opaque round-capped stroke makes
 * the entire core genuinely transparent, including during a fast sweep.
 */
const BRUSH_SCALE = 1.18;
const CLEAR_CORE = 0.8;
const MAX_BRUSHES = 24;
const MAX_STAMPS = 48;
const CELL = 24;
const FINISH_COVERAGE = 0.85;

type Point = { x: number; y: number };

type Options = {
  width: number;
  height: number;
  onStart: () => void;
  onComplete: () => void;
};

export const createHeroWiper = (ctx: CanvasRenderingContext2D, options: Options) => {
  const { width, height, onStart, onComplete } = options;
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
        if ((x - dx * t) ** 2 + (y - dy * t) ** 2 <= radius * radius) {
          covered[i] = 1;
          count++;
        }
      }
    }
  };

  return {
    get complete() { return complete; },
    clear,
    resetStroke: (key: number) => { strokes.delete(key); },
    dispose: () => { complete = true; releaseBrushes(); },
    erase: (key: number, x: number, y: number, radius: number) => {
      if (complete) return;
      const previous = strokes.get(key);
      if (previous && Math.hypot(x - previous.x, y - previous.y) < 0.6) return;
      // Quantise by two pixels so differently sized letters reuse brushes
      // instead of rebuilding a single shared sprite on every actor/frame.
      const r = Math.max(2, Math.round(radius * BRUSH_SCALE / 2) * 2);
      const brush = brushFor(r);
      if (!brush) return;
      if (!started) { started = true; onStart(); }
      const from = previous ?? { x, y };
      const dx = x - from.x;
      const dy = y - from.y;
      const steps = Math.min(MAX_STAMPS, Math.max(1, Math.ceil(Math.hypot(dx, dy) / Math.max(radius * 0.34, 1))));

      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = 1;
      for (let i = 1; i <= steps; i++) {
        ctx.drawImage(brush, from.x + dx * i / steps - r, from.y + dy * i / steps - r);
      }
      // A single opaque path closes gaps between capped stamps on a fast
      // sweep and removes the last 1–2% of blurred/tinted glass in one pass.
      ctx.strokeStyle = '#000000';
      ctx.fillStyle = '#000000';
      ctx.lineWidth = r * CLEAR_CORE * 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      if (previous) {
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      } else {
        ctx.arc(x, y, r * CLEAR_CORE, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      markCoverage(from, { x, y }, r * CLEAR_CORE * 0.95);
      if (count / covered.length >= FINISH_COVERAGE) {
        // Finish the last isolated edges rather than leaving a permanent
        // film over an otherwise cleared photograph. Further wipes cost zero.
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
