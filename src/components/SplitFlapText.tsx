import React, { useEffect, useRef } from 'react';

const POOL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ&/0123456789';

// Approximate advance widths (in em) for Inter Black uppercase so each tile
// reserves exactly the space its *target* letter needs. This prevents the
// word from reflowing while letters are scrambling — the core cause of the
// old "glitchy" feel.
const WIDTH: Record<string, number> = {
  A: 0.72, B: 0.72, C: 0.72, D: 0.78, E: 0.62, F: 0.6, G: 0.78, H: 0.78,
  I: 0.32, J: 0.5, K: 0.72, L: 0.58, M: 0.92, N: 0.78, O: 0.82, P: 0.68,
  Q: 0.82, R: 0.72, S: 0.66, T: 0.62, U: 0.76, V: 0.72, W: 0.98, X: 0.68,
  Y: 0.66, Z: 0.62, '0': 0.62, '1': 0.42, '2': 0.62, '3': 0.62, '4': 0.66,
  '5': 0.62, '6': 0.62, '7': 0.6, '8': 0.62, '9': 0.62, '&': 0.92, '/': 0.42,
  ' ': 0.34,
};
const FACE_CLASS = 'absolute inset-0 flex items-center justify-center transition-colors duration-300';

const widthOf = (ch: string) => WIDTH[ch] ?? 0.62;
const display = (ch: string) => (ch === ' ' ? '\u00A0' : ch);

type Props = {
  target: string;
  startDelay?: number;
  step?: number;
  interval?: number;
  className?: string;
  settledClassName?: string;
  flippingClassName?: string;
  inView?: boolean;
  onComplete?: () => void;
};

/**
 * Split-flap reveal.
 *
 * The previous implementation scheduled one `setTimeout` per scramble frame and
 * called `setState` inside each of them — roughly ninety React re-renders of
 * the largest text node on the page, all inside the first two seconds of the
 * visit. That is what made the intro stutter on open.
 *
 * It now runs as a single requestAnimationFrame timeline that writes
 * `textContent` and one data-attribute straight to the tiles. React renders the
 * markup exactly once; the animation costs no reconciliation at all, and it
 * self-corrects if the tab is backgrounded (rAF pauses, then it snaps to the
 * correct state on return instead of firing a burst of stale timers).
 */
const SplitFlapText: React.FC<Props> = ({
  target,
  startDelay = 200,
  step = 110,
  interval = 70,
  className = '',
  settledClassName = 'text-[#d7c4aa]',
  flippingClassName = 'text-[#d7ff4f]',
  inView = true,
  onComplete,
}) => {
  // The hero measures this glyph to size the cursor ring. Tagging the first
  // occurrence keeps the lookup unambiguous.
  const gaugeChar = 'O';
  const gaugeIndex = target.indexOf(gaugeChar);

  const rootRef = useRef<HTMLSpanElement>(null);
  const tileRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const faceRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!inView) return;

    const root = rootRef.current;
    const tiles = tileRefs.current;
    const faces = faceRefs.current;
    if (!root) return;

    const chars = Array.from(target);
    const STEPS = 6;
    const SCRAMBLE_START = 75;

    const settle = () => {
      chars.forEach((ch, i) => {
        const tile = tiles[i];
        const face = faces[i];
        if (tile) tile.dataset.flipping = 'false';
        if (face) {
          face.textContent = display(ch);
          face.className = `${FACE_CLASS} ${settledClassName}`;
        }
      });
    };

    root.style.opacity = '1';

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      settle();
      onCompleteRef.current?.();
      return;
    }

    // Per-letter schedule, precomputed once.
    const plan = chars.map((ch, i) => {
      const base = startDelay + i * step;
      const isSpace = ch === ' ';
      return {
        ch,
        isSpace,
        base,
        end: isSpace ? base : base + SCRAMBLE_START + STEPS * interval + 50,
      };
    });
    const finishAt = plan.reduce((m, p) => Math.max(m, p.end), startDelay) + 80;

    // Start blank-ish so nothing flashes the final word before it plays.
    chars.forEach((_, i) => {
      const face = faces[i];
      if (face && chars[i] !== ' ') face.textContent = 'X';
    });

    const state = chars.map(() => ({ flipping: false, glyph: '', done: false }));
    let raf = 0;
    let t0 = 0;
    let finished = false;

    const frame = (now: number) => {
      if (!t0) t0 = now;
      const t = now - t0;

      for (let i = 0; i < plan.length; i++) {
        const p = plan[i];
        const s = state[i];
        if (s.done) continue;

        const tile = tiles[i];
        const face = faces[i];

        if (t >= p.end) {
          s.done = true;
          s.flipping = false;
          if (tile) tile.dataset.flipping = 'false';
          if (face) {
            face.textContent = display(p.ch);
            face.className = `${FACE_CLASS} ${settledClassName}`;
          }
          continue;
        }

        if (t < p.base || p.isSpace) continue;

        if (!s.flipping) {
          s.flipping = true;
          if (tile) tile.dataset.flipping = 'true';
          if (face) face.className = `${FACE_CLASS} ${flippingClassName}`;
        }

        const k = Math.floor((t - p.base - SCRAMBLE_START) / interval);
        if (k < 0) continue;
        const glyph = k >= STEPS - 1 ? p.ch : POOL[Math.floor(Math.random() * POOL.length)];
        if (glyph !== s.glyph) {
          s.glyph = glyph;
          if (face) face.textContent = display(glyph);
        }
      }

      if (t >= finishAt) {
        if (!finished) {
          finished = true;
          settle();
          onCompleteRef.current?.();
        }
        return;
      }
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      // Leaving mid-flight must never strand a scrambled glyph on screen.
      if (!finished) settle();
    };
  }, [inView, target, startDelay, step, interval, settledClassName, flippingClassName]);

  return (
    <span
      ref={rootRef}
      className={className}
      style={{ perspective: '600px', opacity: inView ? 1 : 0, transition: 'opacity 240ms ease' }}
      aria-label={target}
    >
      {Array.from(target).map((t, i) => (
        <span
          key={i}
          ref={(el) => { tileRefs.current[i] = el; }}
          data-flipping="false"
          data-hero-physics={t === ' ' ? undefined : 'letter'}
          data-ring-gauge={t === gaugeChar && i === gaugeIndex ? t : undefined}
          className="splitflap-tile splitflap-hero relative inline-block align-baseline"
          style={{ width: `${widthOf(t)}em` }}
        >
          <span aria-hidden className="invisible">
            {display(t)}
          </span>
          <span
            ref={(el) => { faceRefs.current[i] = el; }}
            className={`${FACE_CLASS} ${settledClassName}`}
          >
            {display(t)}
          </span>
        </span>
      ))}
      <span className="sr-only">{target}</span>
    </span>
  );
};

export default SplitFlapText;
