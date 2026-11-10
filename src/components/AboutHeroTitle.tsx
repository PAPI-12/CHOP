import React, { useEffect, useState } from 'react';
import SplitFlapSwap from './SplitFlapSwap';

/**
 * AboutHeroTitle — the hero headline as an inverted pyramid.
 *
 *         ARCHITECTURE      small
 *        OF ART BUILT       a bit bigger
 *        FROM THE
 *          SKELETON         the base
 *             ⒰            bottom
 *
 * The tiers grow down the stack: 4.5vw, 6.5vw, 6.5vw, 9.5vw, 9.5vw. Rendered
 * that is 40% / 51% / 39% / 57% of the measure, so SKELETON is the widest row
 * and reads as the base the way a pyramid's does. The whole block comes to
 * about 51% of the hero, down from 65%, and the largest size is down from
 * 11vw to 9.5vw.
 *
 * Only MAAAADNESSS flaps. UP is the U+P lockup, set last at the bottom.
 * Colour keeps the homepage's order read top to bottom: bone, tan, tan, lime.
 * No scrim, no drop shadow, no rule.
 */

const FLAP1_START = 1100; // let the headline land before the flip

export type Layout = 'pyramid' | 'sketch' | 'stack' | 'centred' | 'split' | 'left';
export type Palette = 'homepage' | 'lime' | 'bone';

const PALETTES: Record<Palette, { word: string; flip: string; lead: string; tail: string; knock: string }> = {
  homepage: { word: 'text-[#f5f3ee]', flip: 'text-[#d7ff4f]', lead: 'text-[#d7c4aa]', tail: 'text-[#d7ff4f]', knock: 'text-[#f5f3ee]' },
  lime: { word: 'text-[#d7ff4f]', flip: 'text-[#f5f3ee]', lead: 'text-[#d7c4aa]', tail: 'text-[#d7ff4f]', knock: 'text-[#f5f3ee]' },
  bone: { word: 'text-[#f5f3ee]', flip: 'text-[#d7ff4f]', lead: 'text-[#f5f3ee]', tail: 'text-[#d7ff4f]', knock: 'text-[#f5f3ee]' },
};

// The pyramid's tiers, small at the top and growing to the base.
const L1 = 'text-[clamp(1rem,4.5vw,2.2rem)] md:text-[clamp(1.4rem,4.5vw,4.9rem)]';
const L2 = 'text-[clamp(1.4rem,6.5vw,3rem)] md:text-[clamp(2rem,6.5vw,7rem)]';
const L3 = 'text-[clamp(2rem,9.5vw,4.3rem)] md:text-[clamp(2.9rem,9.5vw,10.3rem)]';
const L4 = L3;
const SMALL = 'block text-[clamp(1rem,2.4vw,1.75rem)] leading-[1.25] tracking-[-0.01em]';
const LEAD = 'leading-[0.88] tracking-[-0.04em] whitespace-nowrap';

/**
 * The U and P of "UP", locked into one mark.
 *
 * The overlap is a measurement, not a guess: at -0.34em the P's stem lands at
 * 0.42em across the U, the middle of its counter (that opening runs about
 * 0.15em to 0.60em). Looser and they merely sit side by side; tighter and the
 * P rides up onto the U's left stem.
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
  layout?: Layout;
  palette?: Palette;
};

const AboutHeroTitle: React.FC<Props> = ({ layout = 'pyramid', palette = 'homepage' }) => {
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
      className={`block ${L1} ${LEAD}`}
    />
  );

  const closing = (
    <span className={`block ${L4} ${LEAD} ${pal.tail}`}>
      SKELETON <UpLock u={pal.tail} p={pal.knock} />
    </span>
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

  if (layout === 'left' || layout === 'centred') {
    const cls = layout === 'left'
      ? 'h-full flex flex-col justify-center gap-[0.02em] font-display items-start text-left'
      : 'h-full flex flex-col justify-center gap-[0.02em] font-display items-center text-center';
    return (
      <h1 className={cls}>
        <span className="block whitespace-nowrap">{word}</span>
        <span className={`block ${L3} ${LEAD} ${pal.lead}`}>OF ART BUILT</span>
        <span className={`block ${L3} ${LEAD} ${pal.lead}`}>FROM THE</span>
        {closing}
      </h1>
    );
  }

  if (layout === 'stack') {
    return (
      <h1 className="h-full flex flex-col justify-center gap-[0.02em] font-display items-center text-center">
        <span className="block whitespace-nowrap">{word}</span>
        <span className={`block ${L2} ${LEAD} ${pal.lead}`}>OF ART BUILT</span>
        <span className={`block ${L3} ${LEAD} ${pal.lead}`}>FROM THE</span>
        <span className={`block ${L4} ${LEAD} ${pal.tail}`}>SKELETON</span>
        <span className={`block ${L4} ${LEAD} ${pal.tail}`}>
          <UpLock u={pal.tail} p={pal.knock} />
        </span>
      </h1>
    );
  }

  // pyramid — the tiers, stacked and centred, smallest first.
  return (
    <h1 className="h-full flex flex-col justify-center font-display items-center text-center">
      <span className="block whitespace-nowrap">{word}</span>
      <span className={`block ${L2} ${LEAD} ${pal.lead} mt-[1.4vh]`}>OF ART BUILT</span>
      <span className={`block ${L2} ${LEAD} ${pal.lead}`}>FROM THE</span>
      {/* The base. */}
      <span className={`block ${L3} ${LEAD} ${pal.tail} mt-[1.6vh]`}>SKELETON</span>
      {/* UP, last, at the bottom. */}
      <span className={`block ${L4} ${LEAD} ${pal.tail}`}>
        <UpLock u={pal.tail} p={pal.knock} />
      </span>
    </h1>
  );
}

export default AboutHeroTitle;
