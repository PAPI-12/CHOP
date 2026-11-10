import React, { useEffect, useState } from 'react';
import SplitFlapSwap from './SplitFlapSwap';

/**
 * AboutHeroTitle — the hero headline, and the control that starts the film.
 *
 * The whole line is set as one stacked display lockup, the way the homepage
 * hero sets CRAFTING / AWESOMENESS / SINCE 2015. A single word at the top
 * with a small block at the bottom left a hole through the middle of the
 * frame; stacking it fills the hero, and centring it keeps the space above
 * and below balanced rather than stranded.
 *
 *     MAAAADNESSS → ARCHITECTURE
 *     OF ART BUILT
 *     FROM THE
 *     SKELETON UP → UNLOCK SKELETON
 *
 * Four lines, because the longest is UNLOCK SKELETON at fifteen characters —
 * that is what sets the size ceiling, and four lines at that scale is what
 * fills the frame. Colour follows the homepage's order read top to bottom:
 * bone, tan, tan, lime. Both flips pass through lime.
 *
 * No scrim, no drop shadow: the type sits straight on the plate.
 */

const FLAP1_START = 1100; // let the headline land before the first flip
const GAP_MS = 250; // a beat between the two flips

export type Layout = 'stack' | 'centred' | 'split' | 'left';
export type Palette = 'homepage' | 'lime' | 'bone';

const PALETTES: Record<Palette, { word: string; flip: string; lead: string; tail: string }> = {
  homepage: { word: 'text-[#f5f3ee]', flip: 'text-[#d7ff4f]', lead: 'text-[#d7c4aa]', tail: 'text-[#d7ff4f]' },
  lime: { word: 'text-[#d7ff4f]', flip: 'text-[#f5f3ee]', lead: 'text-[#d7c4aa]', tail: 'text-[#f5f3ee]' },
  bone: { word: 'text-[#f5f3ee]', flip: 'text-[#d7ff4f]', lead: 'text-[#f5f3ee]', tail: 'text-[#d7ff4f]' },
};

// Sized to the longest line rather than to the homepage's scale: fifteen
// characters is the width ceiling, and this is as large as that allows.
const LINE =
  'block text-[clamp(1.8rem,8.5vw,3.6rem)] md:text-[clamp(3rem,8vw,8.5rem)] leading-[0.86] tracking-[-0.04em]';
const SMALL = 'block text-[clamp(1rem,2.4vw,1.75rem)] leading-[1.25] tracking-[-0.01em]';

type Phase = 'intro' | 'flap1' | 'gap' | 'flap2' | 'ready';

type Props = {
  onUnlock: () => void;
  suppressed?: boolean;
  layout?: Layout;
  palette?: Palette;
};

const AboutHeroTitle: React.FC<Props> = ({
  onUnlock,
  suppressed = false,
  layout = 'stack',
  palette = 'homepage',
}) => {
  const [phase, setPhase] = useState<Phase>('intro');
  const ready = phase === 'ready';
  const pal = PALETTES[palette];

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

  const word = (
    <SplitFlapSwap
      from="MAAAADNESSS"
      to="ARCHITECTURE"
      run={phase !== 'intro'}
      settledClassName={pal.word}
      flippingClassName={pal.flip}
      onComplete={onFlap1Done}
      className={LINE}
    />
  );

  const tailControl = (
    <button
      type="button"
      onClick={ready && !suppressed ? onUnlock : undefined}
      disabled={!ready || suppressed}
      aria-label={ready ? 'Unlock skeleton — play the x-ray sequence' : 'Skeleton up'}
      className={`relative inline-block align-baseline whitespace-nowrap text-left transition-opacity duration-300 ${
        ready && !suppressed ? 'cursor-pointer focus-visible:outline-none' : 'cursor-default'
      } ${suppressed ? 'opacity-0' : 'opacity-100'}`}
    >
      <SplitFlapSwap
        from="SKELETON UP"
        to="UNLOCK SKELETON"
        run={phase === 'flap2' || phase === 'ready'}
        settledClassName={pal.tail}
        flippingClassName={pal.flip}
        onComplete={onFlap2Done}
        className={LINE}
      />
      {/* The affordance: a lime hairline that draws under the word once it is
          live, so it reads as a control without recolouring the tiles
          (changing their settled class mid-life would restart the flap). */}
      <span
        aria-hidden
        className={`absolute -bottom-[0.06em] left-0 h-[2px] bg-[#d7ff4f] origin-left transition-transform duration-500 ease-out ${
          ready && !suppressed ? 'scale-x-100' : 'scale-x-0'
        }`}
        style={{ width: '100%' }}
      />
    </button>
  );

  const leadLines = (
    <>
      <span className={`${LINE} ${pal.lead}`}>OF ART BUILT</span>
      <span className={`${LINE} ${pal.lead}`}>FROM THE</span>
    </>
  );

  const h1 = 'h-full flex flex-col justify-center gap-[0.02em] font-display';

  if (layout === 'split') {
    return (
      <h1 className="h-full flex flex-col justify-between gap-10 md:gap-14 font-display">
        <span className="block whitespace-nowrap">{word}</span>
        <span className="flex items-end justify-between gap-6 md:gap-10">
          <span className={`${SMALL} ${pal.lead}`}>OF ART BUILT FROM THE</span>
          {tailControl}
        </span>
      </h1>
    );
  }

  if (layout === 'left') {
    return (
      <h1 className={`${h1} items-start text-left`}>
        <span className="block whitespace-nowrap">{word}</span>
        {leadLines}
        {tailControl}
      </h1>
    );
  }

  if (layout === 'centred') {
    return (
      <h1 className="h-full flex flex-col justify-between gap-12 md:gap-16 font-display items-center text-center">
        <span className="block whitespace-nowrap">{word}</span>
        <span className="flex flex-col items-center gap-1.5 md:gap-2">
          <span className={`${SMALL} ${pal.lead}`}>OF ART BUILT FROM THE</span>
          {tailControl}
        </span>
      </h1>
    );
  }

  // stack — the whole line as one centred display lockup.
  return (
    <h1 className={`${h1} items-center text-center`}>
      <span className="block whitespace-nowrap">{word}</span>
      {leadLines}
      {tailControl}
    </h1>
  );
};

export default AboutHeroTitle;
