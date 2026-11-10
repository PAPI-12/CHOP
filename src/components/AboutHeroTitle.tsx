import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import SplitFlapSwap from './SplitFlapSwap';

/**
 * AboutHeroTitle — the hero headline, and the control that starts the film.
 *
 * It is a four-beat sequence rather than a static headline:
 *
 *   1. THE MAAAADNESSS OF ART BUILT FROM THE SKELETON UP
 *   2. MAAAADNESSS split-flaps into ARCHITECTURE
 *   3. the whole line pulls back into the background — smaller, dimmer,
 *      slightly out of focus — so that only SKELETON UP is left standing
 *   4. SKELETON UP split-flaps into UNLOCK SKELETON, which is the button
 *      that runs the x-ray sequence
 *
 * The type matches the homepage hero: text-[11vw] sm:text-[9vw]
 * md:text-[5.5vw], font-display, leading-[0.88].
 *
 * The recede animates each word as its own inline-block. Animating the
 * wrapping span as a single inline-block would make the whole clause one
 * atomic box and break the headline's natural line wrapping; per-word boxes
 * wrap normally and can still be scaled, since transforms are ignored on
 * plain inline elements.
 */

const FLAP1_START = 1100; // let the headline land before the first flip
const RECEDE_MS = 700;

type Phase = 'intro' | 'flap1' | 'recede' | 'flap2' | 'ready';

/** One word of the line that pulls back once the flip has played. */
const Recede: React.FC<{ back: boolean; children: React.ReactNode; className?: string }> = ({
  back,
  children,
  className = '',
}) => (
  <motion.span
    className={`inline-block will-change-[transform,opacity,filter] ${className}`}
    style={{ transformOrigin: 'left center' }}
    initial={false}
    animate={
      back
        ? { opacity: 0.2, scale: 0.86, filter: 'blur(5px)', y: -4 }
        : { opacity: 1, scale: 1, filter: 'blur(0px)', y: 0 }
    }
    transition={{ duration: RECEDE_MS / 1000, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.span>
);

type Props = {
  /** start the x-ray film */
  onUnlock: () => void;
  /** true while the film owns the hero, so the control stands down */
  suppressed?: boolean;
};

const AboutHeroTitle: React.FC<Props> = ({ onUnlock, suppressed = false }) => {
  const [phase, setPhase] = useState<Phase>('intro');

  const back = phase === 'recede' || phase === 'flap2' || phase === 'ready';
  const ready = phase === 'ready';

  useEffect(() => {
    const t = window.setTimeout(() => setPhase('flap1'), FLAP1_START);
    return () => window.clearTimeout(t);
  }, []);

  // Hold the pulled-back line for a beat before the second flip, so the
  // change of focus registers before the word changes.
  useEffect(() => {
    if (phase !== 'recede') return;
    const t = window.setTimeout(() => setPhase('flap2'), RECEDE_MS);
    return () => window.clearTimeout(t);
  }, [phase]);

  const onFlap1Done = () => setPhase((p) => (p === 'flap1' ? 'recede' : p));
  const onFlap2Done = () => setPhase((p) => (p === 'flap2' ? 'ready' : p));

  return (
    <h1 className="text-[11vw] sm:text-[9vw] md:text-[5.5vw] font-display leading-[0.88] text-[#f5f3ee]">
      <Recede back={back}>THE&nbsp;</Recede>
      <Recede back={back}>
        <SplitFlapSwap
          from="MAAAADNESSS"
          to="ARCHITECTURE"
          run={phase !== 'intro'}
          settledClassName="text-[#f5f3ee]"
          flippingClassName="text-[#d7ff4f]"
          onComplete={onFlap1Done}
          className="whitespace-nowrap"
        />
      </Recede>
      <Recede back={back}>&nbsp;OF&nbsp;</Recede>
      <Recede back={back}>ART&nbsp;</Recede>
      <Recede back={back}>BUILT&nbsp;</Recede>
      <Recede back={back}>FROM&nbsp;</Recede>
      <Recede back={back}>THE&nbsp;</Recede>

      {/* The one thing left standing once the line pulls back. It becomes
          the control, but only after it has finished flipping — a button
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
          className="whitespace-nowrap"
        />
        {/* The affordance: a lime hairline that draws under the word once it
            is live, so it reads as a control without recolouring the tiles
            (changing their settled class mid-life would restart the flap). */}
        <span
          aria-hidden
          className={`absolute -bottom-[0.06em] left-0 h-[2px] bg-[#d7ff4f] origin-left transition-transform duration-500 ease-out ${
            ready && !suppressed ? 'scale-x-100' : 'scale-x-0'
          }`}
          style={{ width: '100%' }}
        />
      </button>
    </h1>
  );
};

export default AboutHeroTitle;
