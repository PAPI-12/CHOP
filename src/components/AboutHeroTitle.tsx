import React, { useEffect, useState } from 'react';
import SplitFlapSwap from './SplitFlapSwap';

/**
 * AboutHeroTitle — the hero headline as a tree.
 *
 *              THE             22% of the measure
 *          ARCHITECTURE        34%      widening
 *          OF ART BUILT        46%
 *           FROM THE           58%
 *           SKELETON           70%      the widest row — MADNESS flaps into it
 *                ⒰            12%      the stem, centred
 *
 * Every row is set wider than the one above it, so the block silhouettes a
 * triangle, and UP hangs below the base in the middle like a trunk. The
 * widths are what is stepped, not the sizes: the rows differ hugely in
 * length (THE is 3 characters, ARCHITECTURE is 12), so hitting a widening
 * silhouette means the short rows carry the larger type — 10vw, 3.9vw, 5.8vw,
 * 9.6vw, 10.9vw. Anything else and the shape comes out lopsided.
 *
 * Only SKELETON flaps, out of MADNESS. UP is the U+P lockup, set at 9.1vw so
 * it reads as a stem rather than another row.
 *
 * Colour keeps the homepage's order read top to bottom: bone, bone, tan, tan,
 * lime, lime. No scrim, no drop shadow, no rule.
 */

// Long enough to read MADNESS before it goes, short enough not to drag: the
// flip itself takes a little under a second on top of this.
const FLAP1_START = 1900;

export type Layout = 'tree' | 'pyramid' | 'sketch' | 'stack' | 'centred' | 'split' | 'left';
export type Palette = 'homepage' | 'lime' | 'bone';

const PALETTES: Record<Palette, { word: string; lead: string; tail: string; tailFlip: string; knock: string }> = {
  homepage: { word: 'text-[#f5f3ee]', lead: 'text-[#d7c4aa]', tail: 'text-[#d7ff4f]', tailFlip: 'text-[#f5f3ee]', knock: 'text-[#f5f3ee]' },
  lime: { word: 'text-[#d7ff4f]', lead: 'text-[#d7c4aa]', tail: 'text-[#d7ff4f]', tailFlip: 'text-[#f5f3ee]', knock: 'text-[#f5f3ee]' },
  bone: { word: 'text-[#f5f3ee]', lead: 'text-[#f5f3ee]', tail: 'text-[#d7ff4f]', tailFlip: 'text-[#d7c4aa]', knock: 'text-[#f5f3ee]' },
};

// Sizes chosen so each row renders wider than the one above it, not so the
// type simply gets bigger down the stack — the rows differ too much in
// length for that to hold a shape.
const T_THE = 'text-[clamp(2.2rem,10vw,4.9rem)] md:text-[clamp(3.05rem,10vw,10.8rem)]';
const T_ARCH = 'text-[clamp(0.86rem,3.9vw,1.9rem)] md:text-[clamp(1.19rem,3.9vw,4.2rem)]';
const T_ARTBUILT = 'text-[clamp(1.28rem,5.8vw,2.82rem)] md:text-[clamp(1.77rem,5.8vw,6.25rem)]';
const T_FROMTHE = 'text-[clamp(2.11rem,9.6vw,4.68rem)] md:text-[clamp(2.93rem,9.6vw,10.3rem)]';
const T_SKEL = 'text-[clamp(2.4rem,10.9vw,5.31rem)] md:text-[clamp(3.32rem,10.9vw,11.7rem)]';
const T_UP = 'text-[clamp(2rem,9.1vw,4.43rem)] md:text-[clamp(2.78rem,9.1vw,9.8rem)]';
const SMALL = 'block text-[clamp(1rem,2.4vw,1.75rem)] leading-[1.25] tracking-[-0.01em]';
const LEAD = 'leading-[0.88] tracking-[-0.04em] whitespace-nowrap';

/**
 * The U and P of "UP", woven into one mark.
 *
 * Three layers, so the two letters actually pass through each other rather
 * than one simply sitting on top of the other:
 *
 *   1. U        — behind everything
 *   2. P        — in front of the U
 *   3. U again  — in front of the P, but clipped to a horizontal band
 *
 * So the P laps over the U at the top and again at the foot of its bowl,
 * while the U crosses in front through the band between: the U passes
 * through the P, and the P passes through the back of the U.
 *
 * The measurements: at one size the U runs 0.76em wide with its counter open
 * from 0.15em to 0.60em. The P is pulled back 0.34em, which drops its stem at
 * 0.42em — inside that opening — and swings its bowl across the U's right
 * stem with 0.16em of overlap to weave through.
 */
const UpLock: React.FC<{ u: string; p: string }> = ({ u, p }) => (
  <span className="relative inline-flex items-baseline tracking-normal" aria-label="UP">
    <span aria-hidden className={u}>
      U
    </span>
    <span aria-hidden className={`${p} -ml-[0.34em]`}>
      P
    </span>
    <span aria-hidden className={`${u} absolute left-0 top-0 [clip-path:inset(25%_0_53%_0)]`}>
      U
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

  const arch = (
    <span className={`block ${T_ARCH} ${LEAD} ${pal.word}`}>ARCHITECTURE</span>
  );

  const skeleton = (
    <SplitFlapSwap
      from="MADNESS"
      to="SKELETON"
      run={flap}
      step={60}
      interval={72}
      settledClassName={pal.tail}
      flippingClassName={pal.tailFlip}
      className={`block ${T_SKEL} ${LEAD}`}
    />
  );

  const closing = (
    <span className={`block ${T_UP} ${LEAD} ${pal.tail}`}>
      <UpLock u={pal.tail} p={pal.knock} />
    </span>
  );

  if (layout === 'split') {
    return (
      <h1 className="h-full flex flex-col justify-between gap-10 md:gap-14 font-display items-center text-center">
        {arch}
        <span className="flex items-end justify-between gap-6 md:gap-10 w-full">
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
        {arch}
        <span className={`block ${T_SKEL} ${LEAD} ${pal.lead}`}>OF ART BUILT</span>
        <span className={`block ${T_SKEL} ${LEAD} ${pal.lead}`}>FROM THE</span>
        {closing}
      </h1>
    );
  }

  if (layout === 'stack') {
    return (
      <h1 className="h-full flex flex-col justify-center gap-[0.02em] font-display items-center text-center">
        {arch}
        <span className={`block ${T_ARTBUILT} ${LEAD} ${pal.lead}`}>OF ART BUILT</span>
        <span className={`block ${T_FROMTHE} ${LEAD} ${pal.lead}`}>FROM THE</span>
        <span className={`block ${T_SKEL} ${LEAD} ${pal.tail}`}>SKELETON</span>
        {closing}
      </h1>
    );
  }

  // tree — six rows widening downward, UP as the stem.
  return (
    <h1 className="h-full flex flex-col justify-center font-display items-center text-center">
      <span className={`block ${T_THE} ${LEAD} ${pal.word}`}>THE</span>
      {arch}
      <span className={`block ${T_ARTBUILT} ${LEAD} ${pal.lead}`}>OF ART BUILT</span>
      <span className={`block ${T_FROMTHE} ${LEAD} ${pal.lead}`}>FROM THE</span>
      {/* The base — the widest row, and the only one that flaps. */}
      <span className="block whitespace-nowrap">{skeleton}</span>
      {/* The stem: narrow, centred, the U and P woven together. */}
      <span className={`block ${T_UP} ${LEAD} ${pal.tail} mt-[1.2vh]`}>
        <UpLock u={pal.tail} p={pal.knock} />
      </span>
    </h1>
  );
}

export default AboutHeroTitle;
