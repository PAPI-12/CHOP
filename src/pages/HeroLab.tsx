import React from 'react';
import AboutHeroTitle, { type Layout, type Palette } from '../components/AboutHeroTitle';

/**
 * HeroLab — a scratch pad for choosing the About hero's arrangement.
 *
 * It renders the real AboutHeroTitle in several layout/palette combinations
 * over the real hero plate, so a choice can be made by looking rather than by
 * describing. The lab shares the component with the page, so whatever wins
 * here is exactly what ships — there is no preview/page drift.
 *
 * Temporary: delete once a direction is chosen.
 */

const OPTIONS: { n: string; layout: Layout; palette: Palette; note: string }[] = [
  { n: '01', layout: 'stack', palette: 'homepage', note: 'shipping — 4-line centred lockup, bone/tan/lime' },
  { n: '02', layout: 'stack', palette: 'lime', note: 'lime display word, bone tail' },
  { n: '03', layout: 'stack', palette: 'bone', note: 'bone word + lead, lime tail only' },
  { n: '07', layout: 'left', palette: 'lime', note: 'flush left, lime display word' },
  { n: '04', layout: 'left', palette: 'homepage', note: 'same lockup, flush left' },
  { n: '05', layout: 'centred', palette: 'homepage', note: 'word high, small block low' },
  { n: '06', layout: 'split', palette: 'homepage', note: 'lead/tail in the bottom corners' },
];

const HeroLab: React.FC = () => (
  <div className="bg-[#000000]">
    {OPTIONS.map((o) => (
      <section
        key={o.n}
        className="relative h-[100svh] min-h-[560px] overflow-hidden bg-[#000000] border-b border-[#f5f3ee]/10"
      >
        <img
          src="/images/about-hero-idle.webp"
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover grayscale contrast-[1.04] brightness-[0.95]"
        />
        <span className="absolute z-20 top-4 left-4 sm:left-6 lg:left-12 xl:left-24 font-mono text-[10px] tracking-[0.3em] uppercase text-[#d7ff4f]">
          {o.n} — {o.note}
        </span>
        <div className="relative z-10 h-full px-4 sm:px-6 lg:px-12 xl:px-24">
          <div className="h-full py-[8svh] max-w-[1600px] mx-auto">
            <AboutHeroTitle layout={o.layout} palette={o.palette} />
          </div>
        </div>
      </section>
    ))}
  </div>
);

export default HeroLab;
