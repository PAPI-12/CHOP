import React, { useEffect, useState } from 'react';
import SplitFlapSwap from './SplitFlapSwap';

/**
 * AboutHeroTitle — the hero headline, and the control that starts the film.
 *
 * After the reference: one line of display type set high in the frame, and
 * the rest of the copy as a small centred block at the bottom.
 *
 *     MAAAADNESSS → ARCHITECTURE
 *
 *                    OF ART BUILT FROM THE
 *                  SKELETON UP → UNLOCK SKELETON
 *
 * Colour follows the homepage hero's own three-line hierarchy, read in the
 * order the lines run — CRAFTING bone, AWESOMENESS tan, SINCE 2015 lime —
 * and mapped onto our three elements in the same top-to-bottom order: the
 * display word bone, the lead tan, the closing word lime. Both flips pass
 * through lime, which is the homepage's flip colour.
 *
 * No scrim, no drop shadow: the type sits straight on the plate.
 */

const FLAP1_START = 1100; // let the headline land before the first flip
const GAP_MS = 250; // a beat between the two flips

/** Where the closing block sits. */
export type Layout = 'centred' | 'split' | 'left';
/** Colour treatment; `homepage` is the mapping described above. */
export type Palette = 'homepage' | 'lime' | 'bone';

const PALETTES: Record<Palette, { word: string; flip: string; lead: string; tail: string }> = {
  homepage: { word: 'text-[#f5f3ee]', flip: 'text-[#d7ff4f]', lead: 'text-[#d7c4aa]', tail: 'text-[#d7ff4f]' },
  lime: { word: 'text-[#d7ff4f]', flip: 'text-[#d7ff4f]', lead: 'text-[#d7c4aa]', tail: 'text-[#f5f3ee]' },
  bone: { word: 'text-[#f5f3ee]', flip: 'text-[#d7ff4f]', lead: 'text-[#f5f3ee]', tail: 'text-[#d7ff4f]' },
};

// The homepage hero's exact scale, so the two headlines are the same size.
const DISPLAY =
  'block text-[clamp(2.2rem,10.8vw,10rem)] md:text-[clamp(3.5rem,8.6vw,9.5rem)] leading-[0.86] tracking-[-0.04em]';
// The bottom block is deliberately small: it measured about a quarter of the
// frame wide and two lines tall, against a display word that spans it.
const SMALL = 'block text-[clamp(1rem,2.4vw,1.75rem)] leading-[1.25] tracking-[-0.01em]';

type Phase = 'intro' | 'flap1' | 'gap' | 'flap2' | 'ready';

type Props = {
  onUnlock: () => void;
  /** true while the film owns the hero, so the control stands down */
  suppressed?: boolean;
  layout?: Layout;
  palette?: Palette;
};

const AboutHeroTitle: React.FC<Props> = ({
  onUnlock,
  suppressed = false,
  layout = 'centred',
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
    <span className="block whitespace-nowrap">
      <SplitFlapSwap
        from="MAAAADNESSS"
        to="ARCHITECTURE"
        run={phase !== 'intro'}
        settledClassName={pal.word}
        flippingClassName={pal.flip}
        onComplete={onFlap1Done}
        className={DISPLAY}
      />
    </span>
  );

  const lead = <span className={`${SMALL} ${pal.lead}`}>OF ART BUILT FROM THE</span>;

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
        className={SMALL}
      />
      {/* The affordance: a lime hairline that draws under the word once it is
          live, so it reads as a control without recolouring the tiles
          (changing their settled class mid-life would restart the flap). */}
      <span
        aria-hidden
        className={`absolute -bottom-[0.15em] left-0 h-[2px] bg-[#d7ff4f] origin-left transition-transform duration-500 ease-out ${
          ready && !suppressed ? 'scale-x-100' : 'scale-x-0'
        }`}
        style={{ width: '100%' }}
      />
    </button>
  );

  const h1 = 'h-full flex flex-col justify-between gap-12 md:gap-16 font-display';

  if (layout === 'split') {
    return (
      <h1 className={h1}>
        {word}
        <span className="flex items-end justify-between gap-6 md:gap-10">
          {lead}
          {tailControl}
        </span>
      </h1>
    );
  }

  if (layout === 'left') {
    return (
      <h1 className={`${h1} items-start text-left`}>
        {word}
        <span className="flex flex-col items-start gap-2">
          {lead}
          {tailControl}
        </span>
      </h1>
    );
  }

  // centred — the closing copy as a small centred block at the bottom.
  return (
    <h1 className={`${h1} items-center text-center`}>
      {word}
      <span className="flex flex-col items-center gap-1.5 md:gap-2">
        {lead}
        {tailControl}
      </span>
    </h1>
  );
};

export default AboutHeroTitle;
