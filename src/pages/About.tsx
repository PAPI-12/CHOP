import React from 'react';
import { motion } from 'framer-motion';
import CTAButton from '../components/CTAButton';
import TimedWordFlip from '../components/TimedWordFlip';
import WhatIDo from '../components/WhatIDo';
import { ScribbleX } from '../components/Scribbles';

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#171715] pt-24 md:pt-32">
      {/* ── About hero ────────────────────────────────────────────────
          No gradients, no masks: the portrait is a hard-edged plate that
          bleeds off the right margin, and the copy is set against it like a
          spread — headline column left, photograph right, a mono contact-sheet
          strip holding the two together. The only overlap is the lime index
          tab, which crosses the plate edge so the two columns interlock
          instead of merely sitting side by side. */}
      <section className="relative px-4 sm:px-6 lg:px-12 xl:px-24 py-10 md:py-16 overflow-hidden">
        <ScribbleX className="absolute top-16 md:top-20 right-4 md:right-10 w-6 h-6 md:w-8 md:h-8 opacity-60 hidden md:block" />

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="relative max-w-[1600px] mx-auto">
          <div className="flex items-center gap-4 mb-6 md:mb-10">
            <p className="text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase text-[#8f8f88]">About Me</p>
            <span className="h-px flex-1 bg-[#f5f3ee]/12" aria-hidden />
            <p className="font-mono text-[10px] md:text-xs tracking-[0.3em] text-[#8f8f88]">JHB · SA</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-16 items-start">
            {/* Copy column */}
            <div className="lg:col-span-7">
              {/* The headings with timed, synchronized, non-jitter transitions on load */}
              <h1 className="text-[11vw] sm:text-[9vw] lg:text-[5.2vw] font-display leading-[0.86] text-[#f5f3ee]">
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
              <dl className="mt-8 md:mt-12 grid grid-cols-2 sm:grid-cols-3 border-t border-[#f5f3ee]/12">
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
            </div>

            {/* Portrait plate. Bleeds into the right page margin on desktop so
                the crop feels like a printed edge, not a floating card. */}
            <figure className="lg:col-span-5 relative -mx-4 sm:-mx-6 lg:mx-0 lg:-mr-12 xl:-mr-24 lg:mt-1">
              <div className="relative overflow-hidden lg:rounded-l-2xl border-y lg:border-l lg:border-r-0 border-[#f5f3ee]/12 bg-[#1d1d1a]">
                <img
                  loading="eager"
                  decoding="async"
                  src="/images/PAPI RABORIFE ABOUT COVER.webp"
                  alt="Papi Raborife"
                  width={1500}
                  height={810}
                  className="block w-full h-[68vw] sm:h-[52vw] lg:h-[34vw] lg:max-h-[560px] object-cover object-[52%_22%] grayscale contrast-[1.06] transition-[filter] duration-700 ease-out hover:grayscale-0"
                />
              </div>

              {/* Index tab — the single point of overlap between the two
                  columns, in brand lime so the eye ties them together. It
                  lives OUTSIDE the clipped plate so it can cross the edge. */}
              <span className="absolute z-10 left-4 sm:left-6 lg:-left-5 top-6 md:top-8 rotate-[-2deg] bg-[#d7ff4f] text-[#171715] font-mono text-[9px] md:text-[10px] font-bold tracking-[0.3em] uppercase px-3 py-1.5">
                Fig. 01 — the maker
              </span>

              {/* Contact-sheet strip: caption, not a caption bar over the art. */}
              <figcaption className="flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-0 lg:pl-1 pt-3">
                <span className="font-mono text-[9px] md:text-[10px] tracking-[0.28em] uppercase text-[#8f8f88]">
                  Papi Raborife
                </span>
                <span className="font-mono text-[9px] md:text-[10px] tracking-[0.28em] uppercase text-[#8f8f88] lg:pr-12 xl:pr-24">
                  Art comes 1st
                </span>
              </figcaption>
            </figure>
          </div>
        </motion.div>
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

      <section className="px-4 sm:px-6 lg:px-12 xl:px-24 py-14 md:py-24 bg-[#1d1d1a]">
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
