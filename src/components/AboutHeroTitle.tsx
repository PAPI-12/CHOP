import React, { useEffect, useState } from 'react';
import SplitFlapSwap from './SplitFlapSwap';

/**
 * AboutHeroTitle — the hero headline, and the control that starts the film.
 *
 * Two beats, laid out after the reference: the display word sits on its own
 * high in the frame, and the rest of the line splits to the bottom corners.
 *
 *   MAAAADNESSS                      (lime, display size, split-flaps)
 *   OF ART BUILT FROM THE     SKELETON UP → UNLOCK SKELETON
 *
 * The display word carries the homepage hero's exact type scale
 * (clamp(2.2rem,10.8vw,10rem) / md clamp(3.5rem,8.6vw,9.5rem), leading 0.86,
 * tracking -0.04em) and the second flaps SKELETON UP into UNLOCK SKELETON,
 * which is the button that runs the x-ray sequence.
 *
 * The pull-back beat is gone: the line used to recede into the background
 * before the second flip, and on this layout it just made the bottom corners
 * dissolve for no reason. Both words now stay put.
 */

const FLAP1_START = 1100; // let the headline land before the first flip
const GAP_MS = 250; // a beat between the two flips

type Phase = 'intro' | 'flap1' | 'gap' | 'flap2' | 'ready';

type Props = {
  /** start the x-ray film */
  onUnlock: () => void;
  /** true while the film owns the hero, so the control stands down */
  suppressed?: boolean;
};

const AboutHeroTitle: React.FC<Props> = ({ onUnlock, suppressed = false }) => {
  const [phase, setPhase] = useState<Phase>('intro');
  const ready = phase === 'ready';

  useEffect(() => {
    const t = window.setTimeout(() => setPhase('flap1'), FLAP1_START);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase !== 'gap') return;
    const t = window.setTimeout(() => setPhase('flap2'), GAP_MS);
    return () => window.clearTimeout(t);
  }, [phase]);

  const onFlap1Done = () => setPhase((p) => (p === 'flap1' ? 'gap' : p));
  const onFlap2Done = () => setPhase((p) => (p === 'flap2' ? 'ready' : p));

  return (
    <h1 className="h-full flex flex-col justify-between gap-10 md:gap-14 font-display">
      {/* The display word. Same scale as the homepage hero's own headline. */}
      <span className="block whitespace-nowrap">
        <SplitFlapSwap
          from="MAAAADNESSS"
          to="ARCHITECTURE"
          run={phase !== 'intro'}
          settledClassName="text-[#d7ff4f]"
          flippingClassName="text-[#d7ff4f]"
          onComplete={onFlap1Done}
          className="block text-[clamp(2.2rem,10.8vw,10rem)] md:text-[clamp(3.5rem,8.6vw,9.5rem)] leading-[0.86] tracking-[-0.04em]"
        />
      </span>

      {/* The rest of the line, split to the bottom corners. */}
      <span className="flex items-end justify-between gap-6 md:gap-10">
        <span className="block text-[#f5f3ee] text-[clamp(0.95rem,2.9vw,2.1rem)] leading-[1.05] tracking-[-0.02em]">
          OF ART BUILT FROM THE
        </span>

        {/* Becomes the control once it has finished flipping — a button
            mid-flip would be a moving target. */}
        <button
          type="button"
          onClick={ready && !suppressed ? onUnlock : undefined}
          disabled={!ready || suppressed}
          aria-label={ready ? 'Unlock skeleton — play the x-ray sequence' : 'Skeleton up'}
          className={`relative inline-block align-baseline whitespace-nowrap text-left transition-opacity duration-300 ${
            ready && !suppressed
              ? 'cursor-pointer focus-visible:outline-none'
              : 'cursor-default'
          } ${suppressed ? 'opacity-0' : 'opacity-100'}`}
        >
          <SplitFlapSwap
            from="SKELETON UP"
            to="UNLOCK SKELETON"
            run={phase === 'flap2' || phase === 'ready'}
            settledClassName="text-[#f5f3ee]"
            flippingClassName="text-[#d7ff4f]"
            onComplete={onFlap2Done}
            className="block text-[clamp(0.95rem,2.9vw,2.1rem)] leading-[1.05] tracking-[-0.02em]"
          />
          {/* The affordance: a lime hairline that draws under the word once it
              is live, so it reads as a control without recolouring the tiles
              (changing their settled class mid-life would restart the flap). */}
          <span
            aria-hidden
            className={`absolute -bottom-[0.12em] left-0 h-[2px] bg-[#d7ff4f] origin-left transition-transform duration-500 ease-out ${
              ready && !suppressed ? 'scale-x-100' : 'scale-x-0'
            }`}
            style={{ width: '100%' }}
          />
        </button>
      </span>
    </h1>
  );
};

export default AboutHeroTitle;
