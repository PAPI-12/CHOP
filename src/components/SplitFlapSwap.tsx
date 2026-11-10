import React, { useEffect, useRef } from 'react';

/**
 * SplitFlapSwap — flips one word into another, tile by tile.
 *
 * SplitFlapText (the hero's other flap) scrambles out of a blank 'X' and is
 * right for a first reveal. This one is for a *swap*: it has to carry an
 * existing word across into a new one, so tiles start on the letters of
 * `from` and land on the letters of `to`. It also accepts words of different
 * lengths — 'SKELETON UP' is 11 characters and 'UNLOCK SKELETON' is 15, so
 * the board has to grow extra cards mid-flip rather than assume a fixed row.
 *
 * Performance follows SplitFlapText's approach deliberately: one rAF
 * timeline writing textContent straight to the faces, with React rendering
 * the markup once. Scheduling a timer per scramble frame means ~90
 * re-renders of the biggest text node on the page, which is what made the
 * old intro stutter.
 */

const POOL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ&/0123456789';

// Advance widths in em for Inter Black uppercase. Every tile reserves the
// space its *target* letter needs, so the line cannot reflow mid-flip.
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
  /** the word on the board before the flip */
  from: string;
  /** the word it becomes */
  to: string;
  /** hold `from` until this goes true, then flip once */
  run: boolean;
  /** per-tile launch delay, ms */
  step?: number;
  /** ms between scramble frames */
  interval?: number;
  /** scramble frames per tile */
  steps?: number;
  startDelay?: number;
  className?: string;
  settledClassName?: string;
  flippingClassName?: string;
  onComplete?: () => void;
};

const SplitFlapSwap: React.FC<Props> = ({
  from,
  to,
  run,
  step = 45,
  interval = 60,
  steps = 6,
  startDelay = 0,
  className = '',
  settledClassName = 'text-[#d7c4aa]',
  flippingClassName = 'text-[#d7ff4f]',
  onComplete,
}) => {
  const tileRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const faceRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const tiles = tileRefs.current;
    const faces = faceRefs.current;
    const target = Array.from(to);
    const source = Array.from(from);

    const settle = (word: string[]) => {
      target.forEach((_, i) => {
        const tile = tiles[i];
        const face = faces[i];
        if (tile) tile.dataset.flipping = 'false';
        if (face) {
          face.textContent = display(word[i] ?? '');
          face.className = `${FACE_CLASS} ${settledClassName}`;
        }
      });
    };

    // Not running yet: the board simply shows the opening word. Tiles that
    // only exist in the longer target stay empty, so a growing board reads as
    // new cards arriving rather than as a row of stray characters.
    if (!run) {
      settle(source);
      return;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      settle(target);
      onCompleteRef.current?.();
      return;
    }

    const plan = target.map((ch, i) => {
      const base = startDelay + i * step;
      const isSpace = ch === ' ';
      return { ch, isSpace, base, end: isSpace ? base : base + 75 + steps * interval + 50 };
    });
    const finishAt = plan.reduce((m, p) => Math.max(m, p.end), startDelay) + 80;

    const state = target.map(() => ({ flipping: false, glyph: '', done: false }));
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

        const k = Math.floor((t - p.base - 75) / interval);
        if (k < 0) continue;
        const glyph = k >= steps - 1 ? p.ch : POOL[Math.floor(Math.random() * POOL.length)];
        if (glyph !== s.glyph) {
          s.glyph = glyph;
          if (face) face.textContent = display(glyph);
        }
      }

      if (t >= finishAt) {
        if (!finished) {
          finished = true;
          settle(target);
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
      if (!finished) settle(target);
    };
  }, [run, from, to, step, interval, steps, startDelay, settledClassName, flippingClassName]);

  return (
    <span className={className} style={{ perspective: '600px' }} aria-label={to}>
      {Array.from(to).map((t, i) => (
        <span
          key={i}
          ref={(el) => { tileRefs.current[i] = el; }}
          data-flipping="false"
          className="splitflap-tile splitflap-hero relative inline-block align-baseline"
          style={{ width: `${widthOf(t)}em` }}
        >
          <span aria-hidden className="invisible select-none">
            {display(t)}
          </span>
          <span
            ref={(el) => { faceRefs.current[i] = el; }}
            className={`${FACE_CLASS} ${settledClassName}`}
          >
            {display(Array.from(from)[i] ?? '')}
          </span>
        </span>
      ))}
      <span className="sr-only">{to}</span>
    </span>
  );
};

export default SplitFlapSwap;
