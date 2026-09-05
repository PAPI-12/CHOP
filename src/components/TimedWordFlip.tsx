import React, { useEffect, useState } from 'react';

const POOL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ&/';

// Width profile mapped precisely to Inter uppercase letter ratios to eliminate reflow jitter.
const WIDTH_PROFILE: Record<string, number> = {
  A: 0.72, B: 0.72, C: 0.72, D: 0.78, E: 0.62, F: 0.60, G: 0.78, H: 0.78,
  I: 0.32, J: 0.50, K: 0.72, L: 0.58, M: 0.92, N: 0.78, O: 0.82, P: 0.68,
  Q: 0.82, R: 0.72, S: 0.66, T: 0.62, U: 0.76, V: 0.72, W: 0.98, X: 0.68,
  Y: 0.66, Z: 0.62,
};
const getWidth = (ch: string) => WIDTH_PROFILE[ch] ?? 0.62;

type Props = {
  startWord: string; // e.g. "FUUUUUUCKEN"
  targetWord: string; // e.g. "SELECTIVELY"
  delayMs?: number; // 1000ms
  settledClassName?: string;
  flippingClassName?: string;
};

const TimedWordFlip: React.FC<Props> = ({
  startWord,
  targetWord,
  delayMs = 1000,
  settledClassName = 'text-[#d7c4aa]',
  flippingClassName = 'text-[#d7ff4f]',
}) => {
  const length = targetWord.length;
  const [chars, setChars] = useState<string[]>(() => startWord.split(''));
  const [flipping, setFlipping] = useState<boolean[]>(() => Array(length).fill(false));
  const [settled, setSettled] = useState<boolean[]>(() => Array(length).fill(false));

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Trigger the split-flap flip for each character exactly after delayMs (1 second)
    const triggerFlip = setTimeout(() => {
      for (let i = 0; i < length; i++) {
        // Subtle staggered launch so the cards flip like an actual board
        const charDelay = i * 45;

        timers.push(
          setTimeout(() => {
            setFlipping((f) => f.map((v, j) => (j === i ? true : v)));
          }, charDelay)
        );

        const steps = 6;
        for (let s = 0; s < steps; s++) {
          timers.push(
            setTimeout(() => {
              setChars((c) =>
                c.map((v, j) => {
                  if (j !== i) return v;
                  if (s === steps - 1) return targetWord[i];
                  return POOL[Math.floor(Math.random() * POOL.length)];
                })
              );
            }, charDelay + 50 + s * 50)
          );
        }

        timers.push(
          setTimeout(() => {
            setFlipping((f) => f.map((v, j) => (j === i ? false : v)));
            setSettled((s) => s.map((v, j) => (j === i ? true : v)));
          }, charDelay + 50 + steps * 50 + 30)
        );
      }
    }, delayMs);

    return () => {
      clearTimeout(triggerFlip);
      timers.forEach(clearTimeout);
    };
  }, [startWord, targetWord, delayMs, length]);

  return (
    <span className="inline-flex whitespace-nowrap" style={{ perspective: '600px' }} aria-label={targetWord}>
      {chars.map((c, i) => {
        const targetChar = targetWord[i];
        return (
          <span
            key={i}
            data-flipping={flipping[i] ? 'true' : 'false'}
            className="splitflap-tile relative inline-block align-baseline will-change-transform"
            style={{ width: `${getWidth(targetChar)}em` }}
          >
            {/* Invisible placeholder matching the target character width ensures zero layout jitter */}
            <span aria-hidden className="invisible select-none">
              {targetChar}
            </span>
            <span
              className={`absolute inset-0 flex items-center justify-center transition-colors duration-300 ${
                settled[i] ? settledClassName : flippingClassName
              }`}
            >
              {c}
            </span>
          </span>
        );
      })}
      <span className="sr-only">{targetWord}</span>
    </span>
  );
};

export default TimedWordFlip;
