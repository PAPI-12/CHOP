import React, { useEffect, useState } from 'react';
import SplitFlapSwap from './SplitFlapSwap';

/**
 * AboutHeroTitle — the hero headline, set after the sketch.
 *
 *     MAAAADNESSS → ARCHITECTURE
 *     ──────────────
 *     OF ART BUILT
 *     FROM THE
 *          SKELETON
 *             ⒰
 *
 * Six rows spanning about 65% of the frame, stacked and centred. Only
 * MAAAADNESSS flaps; everything else is set.
 *
 * The sizes come from the sketch rather than from a house scale. Measuring its
 * ink gave five rows: 82.5% / 69.1% / 45.1% / 42.9% of the frame wide, with a
 * hairline between the first two. Dividing each measured width by that line's
 * width in em gives the size that reproduces it — 11vw, 10.3vw, 8.8vw, 8.4vw
 * — and those four sizes stack to 65% of the hero height, which is what the
 * sketch measures. The last row is as tall as the first but under half its
 * width, so it is two lines, not one: SKELETON over the U+P lockup.
 *
 * Colour keeps the homepage's order read top to bottom: bone, tan, tan, lime.
 * No scrim, no drop shadow.
 */

const FLAP1_START = 1100; // let the headline land before the flip

export type Layout = 'sketch' | 'stack' | 'centred' | 'split' | 'left';
export type Palette = 'homepage' | 'lime' | 'bone';

const PALETTES: Record<Palette, { word: string; flip: string; lead: string; tail: string; knock: string }> = {
  homepage: { word: 'text-[#f5f3ee]', flip: 'text-[#d7ff4f]', lead: 'text-[#d7c4aa]', tail: 'text-[#d7ff4f]', knock: 'text-[#f5f3ee]' },
  lime: { word: 'text-[#d7ff4f]', flip: 'text-[#f5f3ee]', lead: 'text-[#d7c4aa]', tail: 'text-[#d7ff4f]', knock: 'text-[#f5f3ee]' },
  bone: { word: 'text-[#f5f3ee]', flip: 'text-[#d7ff4f]', lead: 'text-[#f5f3ee]', tail: 'text-[#d7ff4f]', knock: 'text-[#f5f3ee]' },
};

// Each size reproduces the width that row measures in the sketch.
const L1 = 'text-[clamp(2rem,11vw,3.7rem)] md:text-[clamp(3rem,11vw,12rem)]';
const L2 = 'text-[clamp(1.9rem,10.3vw,3.5rem)] md:text-[clamp(2.9rem,10.3vw,11.3rem)]';
const L3 = 'text-[clamp(1.6rem,8.8vw,3rem)] md:text-[clamp(2.4rem,8.8vw,9.7rem)]';
const L4 = 'text-[clamp(1.5rem,8.4vw,2.9rem)] md:text-[clamp(2.3rem,8.4vw,9.2rem)]';
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

const AboutHeroTitle: React.FC<Props> = ({ layout = 'sketch', palette = 'homepage' }) => {
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

  // sketch — five rows and a hairline, stacked and centred.
  return (
    <h1 className="h-full flex flex-col justify-center font-display items-center text-center">
      <span className="block whitespace-nowrap">{word}</span>

      {/* The hairline the sketch draws between the first row and the rest. */}
      <span aria-hidden className="block w-[51%] h-[2px] my-[1.6vh] bg-[#d7ff4f]" />

      <span className={`block ${L2} ${LEAD} ${pal.lead}`}>OF ART BUILT</span>
      <span className={`block ${L3} ${LEAD} ${pal.lead}`}>FROM THE</span>

      {/* The closing pair: as tall as the display word and under half its
          width in the sketch, which is two rows, not one. */}
      <span className="mt-[3vh] flex flex-col items-center">
        <span className={`block ${L4} ${LEAD} ${pal.tail}`}>SKELETON</span>
        <span className={`block ${L4} ${LEAD} ${pal.tail}`}>
          <UpLock u={pal.tail} p={pal.knock} />
        </span>
      </span>
    </h1>
  );
};

export default AboutHeroTitle;
