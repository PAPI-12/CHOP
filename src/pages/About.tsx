import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import CTAButton from '../components/CTAButton';
import TimedWordFlip from '../components/TimedWordFlip';
import WhatIDo from '../components/WhatIDo';
import { ScribbleX } from '../components/Scribbles';

/**
 * About.
 *
 * The hero is a full-bleed, edge-to-edge photograph with the copy set ON TOP
 * of it — no gradients, no masks. Readability comes from the photograph itself
 * being reduced to a study (grayscale + a touch of contrast and dimming via a
 * CSS filter, never an overlay gradient), and from a hard-edged left plate (a
 * solid, translucent surface, not a fade) so the headline sits on a clear
 * field while the subject stays visible on the right. A thin lime hairline is
 * struck at the left edge where the headline begins — that line is the origin
 * of the hero→What I Do transition, which grows it into a full-width black
 * panel that reveals the practice.
 */
const About: React.FC = () => {
  const heroRef = useRef<HTMLElement>(null);
  const heroCopyRef = useRef<HTMLDivElement>(null);

  // The hero "contracts" as it scrolls away: the copy scales down a touch,
  // lifts, and fades to nothing as the What I Do black panel grows over it.
  // Scroll-linked, passive — the intro runs once, the contract follows the
  // scroll so it never fights the pinned section underneath.
  useEffect(() => {
    const hero = heroRef.current;
    const copy = heroCopyRef.current;
    if (!hero || !copy) return;
    let raf = 0;
    const write = () => {
      raf = 0;
      const h = hero.offsetHeight || window.innerHeight;
      const rect = hero.getBoundingClientRect();
      const p = h > 0 ? Math.min(1, Math.max(0, -rect.top / h)) : 0;
      // Ease the tail so the copy is mostly gone before the panel fully covers.
      const t = 1 - Math.pow(1 - p, 3);
      const opacity = String(1 - t * 0.94);
      const scale = 1 - t * 0.05;
      const y = -t * 26;
      copy.style.opacity = opacity;
      copy.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0) scale(${scale.toFixed(4)})`;
      copy.style.willChange = 'opacity, transform';
    };
    const queue = () => { if (!raf) raf = requestAnimationFrame(write); };
    write();
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', queue);
      window.removeEventListener('resize', queue);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#000000]">
      {/* ── About hero — full-bleed image, copy on top ──────────────────
          No gradients and no masks. The photograph is dimmed with a CSS filter
          (the study look), and the copy sits on a hard-edged translucent left
          plate. The lime hairline at the left is where the headline begins and
          where the transition line is struck. */}
      <section
        ref={heroRef}
        className="relative h-[100svh] min-h-[560px] overflow-hidden bg-[#000000]"
      >
        {/* Full-bleed photograph. Dimmed via filter, never an overlay gradient. */}
        <div aria-hidden className="absolute inset-0">
          <img
            loading="eager"
            decoding="async"
            src="/images/about-hero.webp"
            alt=""
            width={1500}
            height={810}
            className="h-full w-full object-cover object-[58%_32%] grayscale contrast-[1.06] brightness-[0.7]"
          />
          {/* Hard-edged translucent plate for the copy — a solid scrim, not a
              gradient, so the subject stays visible on the right. */}
          <div className="absolute inset-y-0 left-0 w-[72%] sm:w-[60%] lg:w-[50%] xl:w-[46%] bg-[#000]/55 border-r border-white/10" />
          {/* Contact-sheet hairlines framing the plate. */}
          <div className="absolute inset-x-0 top-0 h-px bg-white/10" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-white/10" />
          {/* The transition's origin line: a thin lime vertical hairline where
              the headline begins on the left. It grows into the wipe. */}
          <div className="absolute inset-y-0 left-4 sm:left-6 lg:left-12 xl:left-24 w-[2px] bg-[#d7ff4f]/50" />
        </div>

        {/* Mono corner registrations, like the edge of a contact sheet. */}
        <span aria-hidden className="absolute top-5 left-4 sm:left-6 lg:left-12 xl:left-24 z-20 font-mono text-[9px] tracking-[0.3em] text-[#8f8f88]">+</span>
        <span aria-hidden className="absolute bottom-5 right-4 sm:right-6 lg:right-12 xl:right-24 z-20 font-mono text-[9px] tracking-[0.3em] text-[#8f8f88]">+</span>

        <ScribbleX className="absolute top-16 md:top-20 right-4 md:right-10 w-6 h-6 md:w-8 md:h-8 opacity-70 hidden md:block z-20" />

        {/* Copy on top. Contained to the hard-edged left plate. */}
        <div className="relative z-10 h-full flex items-center px-4 sm:px-6 lg:px-12 xl:px-24">
          <div
            ref={heroCopyRef}
            className="max-w-[1600px] w-full mx-auto will-change-[opacity,transform]"
          >
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <div className="flex items-center gap-4 mb-6 md:mb-10">
                <p className="text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase text-[#8f8f88]">About Me</p>
                <span className="h-px flex-1 bg-[#f5f3ee]/12" aria-hidden />
                <p className="font-mono text-[10px] md:text-xs tracking-[0.3em] text-[#8f8f88]">JHB · SA</p>
              </div>

              {/* The headings with timed, synchronized, non-jitter transitions on load */}
              <h1 className="text-[10.5vw] sm:text-[8.5vw] lg:text-[5vw] font-display leading-[0.88] text-[#f5f3ee]">
                I'M A{' '}
                <TimedWordFlip
                  startWord="FUUUUUUCKEN"
                  targetWord="SELECTIVELY"
                  delayMs={1000}
                  settledClassName="text-[#d7ff4f]"
                  flippingClassName="text-[#d7ff4f]"
                />{' '}
                SKILLED{' '}
                <TimedWordFlip
                  startWord="DOPEASS"
                  targetWord="PRODUCT"
                  delayMs={1000}
                  settledClassName="text-[#d7c4aa]"
                  flippingClassName="text-[#d7ff4f]"
                />{' '}
                DESIGNER WITH A STRONG FOCUS ON PRODUCING HIGH QUALITY &amp; IMPACTFUL{' '}
                <span className="text-[#d7ff4f]">DIGITAL EXPERIENCES.</span>
              </h1>

              <motion.div className="mt-6 md:mt-9 inline-block" style={{ transform: 'rotate(-4deg)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                <span className="hand-note text-[#d7c4aa] text-lg md:text-3xl">design that moves people</span>
              </motion.div>

              {/* Facts rail: three plain cells, hairline-separated. Reads as a
                  colophon under the headline rather than decoration. */}
              <dl className="mt-8 md:mt-12 grid grid-cols-2 sm:grid-cols-3 border-t border-[#f5f3ee]/12 max-w-md lg:max-w-lg">
                {[
                  { k: 'Based in', v: 'Johannesburg' },
                  { k: 'Practising since', v: '2015' },
                  { k: 'Currently', v: 'Open to work' },
                ].map((item) => (
                  <div key={item.k} className="py-4 pr-4 border-b sm:border-b-0 border-[#f5f3ee]/12">
                    <dt className="font-mono text-[9px] md:text-[10px] tracking-[0.28em] uppercase text-[#8f8f88]">{item.k}</dt>
                    <dd className="mt-1.5 text-[#f5f3ee] text-sm md:text-base font-medium">{item.v}</dd>
                  </div>
                ))}
              </dl>

              {/* Caption strip tying the plate back to the portrait. */}
              <div className="mt-6 md:mt-8 flex items-center justify-between gap-4 max-w-md lg:max-w-lg border-t border-[#f5f3ee]/12 pt-3">
                <span className="font-mono text-[9px] md:text-[10px] tracking-[0.28em] uppercase text-[#8f8f88]">Papi Raborife</span>
                <span className="font-mono text-[9px] md:text-[10px] tracking-[0.28em] uppercase text-[#8f8f88]">Art comes 1st</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Index tab — the single point of overlap, in brand lime. */}
        <span className="absolute z-20 left-4 sm:left-6 lg:left-12 xl:left-24 top-22 md:top-24 rotate-[-2deg] bg-[#d7ff4f] text-[#000000] font-mono text-[9px] md:text-[10px] font-bold tracking-[0.3em] uppercase px-3 py-1.5">
          Fig. 01 — the maker
        </span>
      </section>

      <WhatIDo variant="about" />

      <section className="px-4 sm:px-6 lg:px-12 xl:px-24 py-14 md:py-24">
        <div className="max-w-[1600px] mx-auto">
          <p className="text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase mb-8 md:mb-16 text-[#8f8f88]">Experience</p>
          <div className="space-y-6 md:space-y-12">
            {[
              { year: 'NOW', role: 'UI/UX Designer', company: 'Bald Agency' },
              { year: '2025', role: 'AI Creative', company: 'Monkey and Donkey Creative Agency' },
              { year: '2023–25', role: 'UI/UX Designer', company: 'Tau Foods' },
              { year: '2022', role: 'Mid-Senior Art Director & Digital Designer', company: 'Ogilvy Joburg' },
              { year: '2020–21', role: 'Mid Art Director & Digital Designer', company: 'The Niche Guys' },
              { year: '2019–20', role: 'Mid Art Director & Digital Designer', company: 'M&C Saatchi Abel' },
              { year: '2016–19', role: 'Junior Art Director, Digital Designer', company: 'FCB Joburg' },
              { year: '2015', role: 'Junior Graphic Designer', company: 'Umuzi Academy' },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="flex flex-col md:flex-row md:items-center gap-1 md:gap-8 pb-6 md:pb-8 border-b border-white/10">
                <span className="text-[#d7ff4f] font-bold text-xs md:text-base w-14 md:w-20">{item.year}</span>
                <h3 className="text-base md:text-2xl font-display text-[#f5f3ee]">{item.role}</h3>
                <span className="text-[#8f8f88] text-xs md:text-base md:ml-auto">{item.company}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-12 xl:px-24 py-14 md:py-24 bg-[#000000]">
        <div className="max-w-[1600px] mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p className="hand-note text-[#d7c4aa] text-2xl md:text-4xl mb-5 md:mb-6">ready to collaborate?</p>
            <CTAButton to="/resume">VIEW RESUME</CTAButton>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default About;
