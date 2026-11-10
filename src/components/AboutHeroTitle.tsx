import React, { useEffect, useState } from 'react';
import SplitFlapSwap from './SplitFlapSwap';

/**
 * AboutHeroTitle.
 *
 *     MAAAADNESSS → ARCHITECTURE
 *     OF ART BUILT
 *     FROM THE
 *     SKELETON ⒰
 *
 * Four lines, centred, filling the frame the way the homepage hero's stack
 * does. Only MAAAADNESSS flaps — the closing line is set and left alone.
 *
 * The last line ends in a lockup built from the U and the P of "UP": the P is
 * pulled left by 0.34em so its stem lands at 0.42em, inside the U's counter,
 * and the bowl sits in the U's opening. The two letters share the same
 * baseline and interlock rather than collide. The P is knocked out in bone
 * against the lime U so the join reads as one mark instead of a pile-up.
 */

const FLAP1_START = 1100; // let the headline land before the flip

export type Layout = 'stack' | 'centred' | 'split' | 'left';
export type Palette = 'homepage' | 'lime' | 'bone';

const PALETTES: Record<Palette, { word: string; flip: string; lead: string; tail: string; knock: string }> = {
  homepage: { word: 'text-[#f5f3ee]', flip: 'text-[#d7ff4f]', lead: 'text-[#d7c4aa]', tail: 'text-[#d7ff4f]', knock: 'text-[#f5f3ee]' },
  lime: { word: 'text-[#d7ff4f]', flip: 'text-[#f5f3ee]', lead: 'text-[#d7c4aa]', tail: 'text-[#d7ff4f]', knock: 'text-[#f5f3ee]' },
  bone: { word: 'text-[#f5f3ee]', flip: 'text-[#d7ff4f]', lead: 'text-[#f5f3ee]', tail: 'text-[#d7ff4f]', knock: 'text-[#f5f3ee]' },
};

const LINE =
  'block text-[clamp(1.8rem,8.5vw,3.6rem)] md:text-[clamp(3rem,8vw,8.5rem)] leading-[0.86] tracking-[-0.04em]';
const SMALL = 'block text-[clamp(1rem,2.4vw,1.75rem)] leading-[1.25] tracking-[-0.01em]';

/**
 * The U and P of "UP", locked into one mark.
 *
 * The overlap is the whole trick and it is a measurement, not a guess: at
 * -0.34em the P's stem sits at 0.42em across the U, which is the middle of
 * its counter (the opening runs about 0.15em to 0.60em). Anything looser and
 * they simply sit next to each other; anything tighter and the P rides up
 * onto the U's left stem.
 */
const UpLock: React.FC<{ u: string; p: string }> = ({ u, p }) => (
  <span className="inline-flex items-baseline" aria-label="UP">
    <span aria-hidden className={u}>
      U
    </span>
    <span aria-hidden className={`${p} -ml-[0.34em]`}>
      P
    </span>
  </span>
);

type Props = {
  /** start the x-ray film */
  onUnlock?: () => void;
  /** true while the film owns the hero */
  suppressed?: boolean;
  layout?: Layout;
  palette?: Palette;
};

const AboutHeroTitle: React.FC<Props> = ({
  layout = 'stack',
  palette = 'homepage',
}) => {
  const [flap, setFlap] = useState(false);
  const pal = PALETTES[palette];

  useEffect(() => {
    const t = window.setTimeout(() => setFlap(true), FLAP1_START);
    return () => window.clearTimeout(t);
  }, []);

  const word = (
    <SplitFlapSwap
      from="MAAAADNESSS"
      to="ARCHITECTURE"
      run={flap}
      settledClassName={pal.word}
      flippingClassName={pal.flip}
      className={LINE}
    />
  );

  // Set, not flapped. The closing word is the one thing in the hero that
  // stays still.
  const closing = (
    <span className={`${LINE} ${pal.tail}`}>
      SKELETON <UpLock u={pal.tail} p={pal.knock} />
    </span>
  );

  const leadLines = (
    <>
      <span className={`${LINE} ${pal.lead}`}>OF ART BUILT</span>
      <span className={`${LINE} ${pal.lead}`}>FROM THE</span>
    </>
  );

  if (layout === 'split') {
    return (
      <h1 className="h-full flex flex-col justify-between gap-10 md:gap-14 font-display">
        <span className="block whitespace-nowrap">{word}</span>
        <span className="flex items-end justify-between gap-6 md:gap-10">
          <span className={`${SMALL} ${pal.lead}`}>OF ART BUILT FROM THE</span>
          {closing}
        </span>
      </h1>
    );
  }

  if (layout === 'left') {
    return (
      <h1 className="h-full flex flex-col justify-center gap-[0.02em] font-display items-start text-left">
        <span className="block whitespace-nowrap">{word}</span>
        {leadLines}
        {closing}
      </h1>
    );
  }

  if (layout === 'centred') {
    return (
      <h1 className="h-full flex flex-col justify-between gap-12 md:gap-16 font-display items-center text-center">
        <span className="block whitespace-nowrap">{word}</span>
        <span className="flex flex-col items-center gap-1.5 md:gap-2">
          <span className={`${SMALL} ${pal.lead}`}>OF ART BUILT FROM THE</span>
          {closing}
        </span>
      </h1>
    );
  }

  // stack — the whole line as one centred display lockup.
  return (
    <h1 className="h-full flex flex-col justify-center gap-[0.02em] font-display items-center text-center">
      <span className="block whitespace-nowrap">{word}</span>
      {leadLines}
      {closing}
    </h1>
  );
};

export default AboutHeroTitle;
