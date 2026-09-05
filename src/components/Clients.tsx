import React from 'react';
import { ScribbleX, ScribbleUnderline, ScribbleWave } from './Scribbles';
import Reveal from './Reveal';

const brands = [
  { name: "NANDO'S", color: 'text-[#f5f3ee]', scale: 1.00 },
  { name: 'AUDI', color: 'text-[#d7c4aa]', scale: 0.88 },
  { name: 'LOUIS VUITTON', color: 'text-[#d7ff4f]', scale: 0.92 },
  { name: 'CORNETTO', color: 'text-[#f5f3ee]', scale: 1.00 },
  { name: 'SARS', color: 'text-[#d7c4aa]', scale: 1.12 },
  { name: 'DEBONAIRS', color: 'text-[#d7ff4f]', scale: 0.90 },
  { name: 'TAU FOODS', color: 'text-[#f5f3ee]', scale: 0.98 },
  { name: 'VODACOM', color: 'text-[#d7ff4f]', scale: 0.94 },
];

// Estimated average advance width for the display typeface. This keeps the
// type large without ever exceeding the section's own margins.
const estimatedWidth = (name: string) =>
  [...name].reduce((total, char) => {
    if (char === ' ') return total + 0.34;
    if ("ILJ'".includes(char)) return total + 0.28;
    if ('MW'.includes(char)) return total + 0.88;
    return total + 0.62;
  }, 0);

const clampFont = (name: string, baseScale: number, mobileBase: number, desktopBase: number) => {
  const width = estimatedWidth(name);
  return {
    '--brand-mobile-max': `${Math.min(mobileBase * baseScale, 100 / width).toFixed(3)}vw`,
    '--brand-desktop-max': `${Math.min(desktopBase * baseScale, 100 / width).toFixed(3)}vw`,
  } as React.CSSProperties;
};

const Clients: React.FC = () => {
  return (
    <section className="relative min-h-screen bg-[#171715] overflow-x-clip py-20 md:py-28 lg:py-32">
      <div className="absolute inset-0 bg-[#171715]" />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 50% 42%, rgba(245,243,238,0.05), transparent 58%), linear-gradient(90deg, rgba(23,23,21,0.92), transparent 18%, transparent 82%, rgba(23,23,21,0.92))',
        }}
      />
      <div aria-hidden className="film-grain" />

      <div className="relative z-10 px-4 sm:px-6 lg:px-12 xl:px-24 max-w-[1600px] mx-auto">
        <p className="text-[10px] md:text-xs font-bold tracking-[0.35em] uppercase text-[#8f8f88] mb-14 md:mb-24 lg:mb-28">
          Clients & Partners
        </p>
      </div>

      {/* Ambient scribbles — a constellation of crosses and waves in mixed
          sizes and weights, placed in the negative space around the stack. */}
      <ScribbleX className="absolute top-[18%] left-[10%] w-8 h-8 md:w-10 md:h-10 opacity-65 rotate-12 hidden sm:block" />
      <ScribbleX className="absolute top-[42%] right-[7%] w-7 h-7 opacity-55 -rotate-6 hidden md:block" />
      <ScribbleX className="absolute bottom-[8%] right-[12%] w-7 h-7 opacity-55 rotate-12 hidden lg:block" />
      <ScribbleUnderline className="absolute top-[48%] left-[15%] w-44 h-5 opacity-45 hidden md:block" />
      <ScribbleUnderline className="absolute bottom-[18%] right-[18%] w-48 h-5 opacity-45 hidden lg:block" />
      <ScribbleWave className="absolute bottom-[6%] left-[6%] w-20 h-6 opacity-55 hidden md:block" />

      {/* Light tick-marks high, a heavy cross low right, waves running the
          baseline — the rhythm loosely follows the brand rows. */}
      <ScribbleX className="absolute top-[9%] right-[20%] w-4 h-4 opacity-40 rotate-45 hidden md:block" />
      <ScribbleX className="absolute top-[26%] right-[12%] w-3 h-3 opacity-35 -rotate-12 hidden sm:block" />
      <ScribbleX className="absolute top-[52%] left-[6%] w-4 h-4 opacity-45 rotate-[24deg] hidden lg:block" />
      <ScribbleX className="absolute top-[63%] right-[16%] w-6 h-6 opacity-50 rotate-6 hidden md:block" />
      <ScribbleX className="absolute bottom-[14%] left-[9%] w-12 h-12 opacity-[0.38] -rotate-12 hidden sm:block" />
      <ScribbleX className="absolute bottom-[26%] left-[30%] w-3.5 h-3.5 opacity-40 rotate-[72deg] hidden xl:block" />
      <ScribbleWave className="absolute top-[14%] left-[24%] w-28 h-5 opacity-35 rotate-2 hidden lg:block" />
      <ScribbleWave className="absolute top-[58%] right-[26%] w-24 h-4 opacity-30 -rotate-3 hidden xl:block" />
      <ScribbleWave className="absolute bottom-[24%] right-[6%] w-36 h-6 opacity-45 rotate-1 hidden md:block" />
      <ScribbleUnderline className="absolute top-[34%] left-[4%] w-28 h-4 opacity-30 rotate-[-8deg] hidden lg:block" />
      <ScribbleUnderline className="absolute top-[70%] left-[38%] w-36 h-4 opacity-35 rotate-2 hidden xl:block" />

      {/* Stack is strictly contained inside project margins; desktop keeps the
          editorial offset rhythm while mobile remains centered and safe. */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-12 xl:px-24 max-w-[1600px] mx-auto flex flex-col items-stretch justify-center select-none overflow-visible">
        {brands.map((brand, i) => (
          <Reveal
            key={brand.name}
            from={i % 2 === 0 ? 'left' : 'right'}
            delay={i * 0.08}
            duration={1.1}
            className="relative w-full max-w-full text-center leading-none"
          >
            <h3
              className={`brand-name font-display ${brand.color} block max-w-full leading-[0.82] tracking-tight whitespace-nowrap`}
              style={clampFont(brand.name, brand.scale, 15, 10.4)}
            >
              {brand.name}
            </h3>
          </Reveal>
        ))}

        {/* Handwritten signature has its own contextual wrapper instead of a
            fragile page-percentage position, so resizing cannot collide it with
            the neighbouring names. */}
        <div className="relative mt-3 md:mt-1 lg:-mt-5 mb-3 md:mb-1 lg:mb-0 flex justify-center py-2 md:py-4">
          {/*
            `animate` and `whileInView` on one element fight each other: the
            looping animate prop won, so the reveal never played and the
            signature popped in at full opacity. The reveal stays in React; the
            idle sway is a CSS keyframe on an inner span, so they compose
            instead of overwriting one another.
          */}
          <Reveal
            as="span"
            from="scale"
            delay={0.35}
            duration={0.9}
            className="relative block max-w-full z-30 pointer-events-none"
          >
            <span
              className="sway hand-note block text-center text-[#f5f3ee] text-[clamp(1.4rem,5.2vw,4.4rem)] whitespace-nowrap"
              style={{ textShadow: '0 10px 30px rgba(0,0,0,.65)' }}
            >
              Papi Raborife Studio
            </span>
          </Reveal>
        </div>
      </div>

      {/* Was missing `hand-note`, so it rendered in Inter while its twin in the
          hero rendered in Caveat. Sway is now a compositor-only keyframe. */}
      <span className="absolute top-[23%] left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <span className="sway hand-note block text-[#d7ff4f] text-base md:text-2xl whitespace-nowrap">
          culture led creative
        </span>
      </span>
      <span className="absolute bottom-[11%] left-1/2 -translate-x-1/2 z-20 hand-note text-[#d7ff4f] text-base md:text-2xl rotate-[-6deg] whitespace-nowrap pointer-events-none hidden sm:block">
        we build ideas into cultural signals
      </span>

      <div className="relative z-10 mt-14 md:mt-20 px-4 sm:px-6 lg:px-12 xl:px-24 max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 border-t border-white/10 pt-7 md:pt-8">
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#8f8f88]">
          {brands.length} Brands · Culture-Led Partnerships · JHB · SA
        </span>
        <span className="hand-note text-[#d7c4aa] text-lg md:text-xl rotate-[-3deg]">and the work keeps growing</span>
      </div>
    </section>
  );
};

export default Clients;
