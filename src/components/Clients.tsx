import React from 'react';
import { ScribbleX, ScribbleUnderline, FloatingCross, FloatingWave } from './Scribbles';
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
    <section className="relative min-h-screen bg-[#000000] overflow-x-clip py-20 md:py-28 lg:py-32">
      <div className="absolute inset-0 bg-[#000000]" />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 50% 42%, rgba(245,243,238,0.05), transparent 58%), linear-gradient(90deg, rgba(0, 0, 0,0.92), transparent 18%, transparent 82%, rgba(0, 0, 0,0.92))',
        }}
      />
      <div aria-hidden className="film-grain" />

      <div className="relative z-10 px-4 sm:px-6 lg:px-12 xl:px-24 max-w-[1600px] mx-auto">
        <p className="text-[10px] md:text-xs font-bold tracking-[0.35em] uppercase text-[#8f8f88] mb-14 md:mb-24 lg:mb-28">
          Clients & Partners
        </p>
      </div>

      {/* ── Ambient drift ────────────────────────────────────────────
          A constellation of crosses and waves in mixed sizes, weights and
          cadences. These are the FLOATING variants, not the static ones —
          the whole point of this section is that the marks keep moving
          behind the names, so the wall of type never sits still. Every
          duration is deliberately a different prime-ish number so the
          field never falls into visible lockstep, and each one is behind
          its own breakpoint so a phone is not asked to animate thirty
          elements it has no room to show. */}
      <FloatingCross className="absolute top-[8%] left-[10%] z-[1] hidden sm:block" size={38} duration={6.5} delay={0} />
      <FloatingCross className="absolute top-[13%] right-[9%] z-[1] hidden sm:block" size={26} duration={7.3} delay={0.6} />
      <FloatingCross className="absolute top-[19%] left-[26%] z-[1] hidden lg:block" size={16} duration={5.4} delay={1.2} />
      <FloatingCross className="absolute top-[24%] right-[24%] z-[1] hidden md:block" size={20} duration={8.1} delay={0.3} />
      <FloatingCross className="absolute top-[31%] left-[5%] z-[1] hidden md:block" size={30} duration={6.9} delay={1.5} />
      <FloatingCross className="absolute top-[37%] right-[13%] z-[1] hidden sm:block" size={22} duration={5.8} delay={0.9} />
      <FloatingCross className="absolute top-[44%] left-[17%] z-[1] hidden lg:block" size={14} duration={7.7} delay={0.2} />
      <FloatingCross className="absolute top-[51%] right-[6%] z-[1] hidden md:block" size={34} duration={6.2} delay={1.8} />
      <FloatingCross className="absolute top-[58%] left-[9%] z-[1] hidden sm:block" size={18} duration={8.4} delay={0.5} />
      <FloatingCross className="absolute top-[64%] right-[28%] z-[1] hidden xl:block" size={13} duration={5.6} delay={1.1} />
      <FloatingCross className="absolute top-[71%] left-[31%] z-[1] hidden xl:block" size={16} duration={7.1} delay={0.7} />
      <FloatingCross className="absolute top-[77%] right-[11%] z-[1] hidden md:block" size={28} duration={6.6} delay={1.4} />
      <FloatingCross className="absolute bottom-[13%] left-[13%] z-[1] hidden sm:block" size={24} duration={7.9} delay={0.4} />
      <FloatingCross className="absolute bottom-[7%] right-[18%] z-[1] hidden lg:block" size={19} duration={6.1} delay={1.6} />
      <FloatingCross className="absolute bottom-[4%] left-[42%] z-[1] hidden xl:block" size={15} duration={8.6} delay={1} />

      <FloatingWave className="absolute top-[11%] left-[33%] z-[1] hidden lg:block" width={130} duration={7.4} delay={0.2} />
      <FloatingWave className="absolute top-[21%] right-[4%] z-[1] hidden md:block" width={96} duration={8.8} delay={1.3} />
      <FloatingWave className="absolute top-[34%] left-[3%] z-[1] hidden xl:block" width={112} duration={6.7} delay={0.8} />
      <FloatingWave className="absolute top-[47%] right-[20%] z-[1] hidden xl:block" width={88} duration={7.8} delay={1.7} />
      <FloatingWave className="absolute top-[56%] left-[24%] z-[1] hidden lg:block" width={120} duration={6.3} delay={0.5} />
      <FloatingWave className="absolute top-[68%] right-[7%] z-[1] hidden md:block" width={140} duration={8.2} delay={0} />
      <FloatingWave className="absolute top-[81%] left-[7%] z-[1] hidden sm:block" width={104} duration={7} delay={1.1} />
      <FloatingWave className="absolute bottom-[9%] right-[30%] z-[1] hidden xl:block" width={92} duration={6.8} delay={1.9} />
      <FloatingWave className="absolute bottom-[19%] left-[36%] z-[1] hidden xl:block" width={116} duration={8.5} delay={0.6} />

      {/* A few marks stay still on purpose. An entirely moving field reads
          as noise; the static ones give the eye somewhere to rest. */}
      <ScribbleUnderline className="absolute top-[29%] left-[4%] w-28 h-4 opacity-30 rotate-[-8deg] hidden lg:block" />
      <ScribbleUnderline className="absolute top-[62%] left-[38%] w-36 h-4 opacity-35 rotate-2 hidden xl:block" />
      <ScribbleUnderline className="absolute bottom-[22%] right-[16%] w-44 h-5 opacity-40 hidden lg:block" />
      <ScribbleX className="absolute top-[42%] right-[34%] w-3 h-3 opacity-35 rotate-45 hidden xl:block" />
      <ScribbleX className="absolute bottom-[31%] left-[21%] w-3.5 h-3.5 opacity-40 rotate-[72deg] hidden xl:block" />

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
