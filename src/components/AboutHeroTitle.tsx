import React, { useEffect, useState } from 'react';
import SplitFlapSwap from './SplitFlapSwap';

/**
 * AboutHeroTitle — the hero headline as a tree.
 *
 *              THE              21% of the measure
 *          ARCHITECTURE         37%      widening
 *            OF ART             38%
 *        BUILT FROM THE         53%
 *          SKELETON             60%      the widest row
 *               ⒰               7%      the stem, centred
 *
 * Every row is set wider than the one above it, so the block silhouettes a
 * triangle, and UP hangs below the base in the middle like a trunk. The
 * widths are what is stepped, not the sizes: the rows differ hugely in length
 * (THE is 3 characters, BUILT FROM THE is 14), so hitting a widening
 * silhouette means the short rows carry the larger type — 9.5vw, 4.2vw, 9vw,
 * 5.5vw, 10vw. Anything else and the shape comes out lopsided.
 *
 * Only MAAAADNESSS flaps, into ARCHITECTURE. UP is the U+P lockup, set at
 * 6vw so it reads as a stem rather than another row.
 *
 * Colour keeps the homepage's order read top to bottom: bone, bone, tan, tan,
 * lime, lime. No scrim, no drop shadow, no rule.
 */

const FLAP1_START = 1100; // let the headline land before the flip

export type Layout = 'tree' | 'pyramid' | 'sketch' | 'stack' | 'centred' | 'split' | 'left';
export type Palette = 'homepage' | 'lime' | 'bone';

const PALETTES: Record<Palette, { word: string; flip: string; lead: string; tail: string; knock: string }> = {
  homepage: { word: 'text-[#f5f3ee]', flip: 'text-[#d7ff4f]', lead: 'text-[#d7c4aa]', tail: 'text-[#d7ff4f]', knock: 'text-[#f5f3ee]' },
  lime: { word: 'text-[#d7ff4f]', flip: 'text-[#f5f3ee]', lead: 'text-[#d7c4aa]', tail: 'text-[#d7ff4f]', knock: 'text-[#f5f3ee]' },
  bone: { word: 'text-[#f5f3ee]', flip: 'text-[#d7ff4f]', lead: 'text-[#f5f3ee]', tail: 'text-[#d7ff4f]', knock: 'text-[#f5f3ee]' },
};

// Sizes chosen so each row renders wider than the one above it, not so the
// type simply gets bigger down the stack — the rows differ too much in
// length for that to hold a shape.
const T_THE = 'text-[clamp(2.1rem,9.5vw,4.6rem)] md:text-[clamp(3rem,9.5vw,10.3rem)]';
const T_ARCH = 'text-[clamp(0.95rem,4.2vw,2.1rem)] md:text-[clamp(1.3rem,4.2vw,4.5rem)]';
const T_OFART = 'text-[clamp(2rem,9vw,4.4rem)] md:text-[clamp(2.9rem,9vw,9.7rem)]';
const T_BUILT = 'text-[clamp(1.25rem,5.5vw,2.7rem)] md:text-[clamp(1.8rem,5.5vw,6rem)]';
const T_SKEL = 'text-[clamp(2.2rem,10vw,4.9rem)] md:text-[clamp(3.1rem,10vw,10.8rem)]';
const T_UP = 'text-[clamp(1.35rem,6vw,2.9rem)] md:text-[clamp(1.9rem,6vw,6.5rem)]';
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

const AboutHeroTitle: React.FC<Props> = ({ layout = 'tree', palette = 'homepage' }) => {
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
      className={`block ${T_ARCH} ${LEAD}`}
    />
  );

  const closing = (
    <span className={`block ${T_UP} ${LEAD} ${pal.tail}`}>
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
        <span className={`block ${T_SKEL} ${LEAD} ${pal.lead}`}>OF ART BUILT</span>
        <span className={`block ${T_SKEL} ${LEAD} ${pal.lead}`}>FROM THE</span>
        {closing}
      </h1>
    );
  }

  if (layout === 'stack') {
    return (
      <h1 className="h-full flex flex-col justify-center gap-[0.02em] font-display items-center text-center">
        <span className="block whitespace-nowrap">{word}</span>
        <span className={`block ${T_OFART} ${LEAD} ${pal.lead}`}>OF ART BUILT</span>
        <span className={`block ${T_SKEL} ${LEAD} ${pal.lead}`}>FROM THE</span>
        <span className={`block ${T_UP} ${LEAD} ${pal.tail}`}>SKELETON</span>
        <span className={`block ${T_UP} ${LEAD} ${pal.tail}`}>
          <UpLock u={pal.tail} p={pal.knock} />
        </span>
      </h1>
    );
  }

  // tree — six rows widening downward, UP as the stem.
  return (
    <h1 className="h-full flex flex-col justify-center font-display items-center text-center">
      <span className={`block ${T_THE} ${LEAD} ${pal.word}`}>THE</span>
      <span className="block whitespace-nowrap">{word}</span>
      <span className={`block ${T_OFART} ${LEAD} ${pal.lead}`}>OF ART</span>
      <span className={`block ${T_BUILT} ${LEAD} ${pal.lead}`}>BUILT FROM THE</span>
      {/* The base — the widest row. */}
      <span className={`block ${T_SKEL} ${LEAD} ${pal.tail}`}>SKELETON</span>
      {/* The stem: narrow, centred, the U and P interlocked. */}
      <span className={`block ${T_UP} ${LEAD} ${pal.tail} mt-[1.2vh]`}>
        <UpLock u={pal.tail} p={pal.knock} />
      </span>
    </h1>
  );
}

export default AboutHeroTitle;
