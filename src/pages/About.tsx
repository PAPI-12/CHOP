import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import CTAButton from '../components/CTAButton';
import AboutHeroTitle from '../components/AboutHeroTitle';
import WhatIDo from '../components/WhatIDo';
import XrayHero, { type XrayHeroHandle, type Phase } from '../components/XrayHero';

/**
 * About.
 *
 * The hero is a full-bleed, edge-to-edge plate with the copy set ON TOP of it
 * — no gradients, no masks. It idles on the first frame of the x-ray sequence
 * (see components/XrayHero), held as a grayscale study exactly the way the
 * photograph it replaced was; pressing the control runs the sequence in colour
 * and it settles on its closing x-ray frame. The hero carries nothing but the
 * photograph, the headline and the site's nav, so it reads as the same page as
 * the homepage hero. No scrim and no drop shadow: the type sits straight on
 * the plate.
 */
const About: React.FC = () => {
  const heroRef = useRef<HTMLElement>(null);
  const heroCopyRef = useRef<HTMLDivElement>(null);
  const xrayRef = useRef<XrayHeroHandle>(null);

  // While the film is running it owns the hero outright: every piece of page
  // furniture clears so the sequence plays edge to edge, and it all comes
  // back when the video ends. That takeover is the intent, not a side effect
  // — so it is driven from the player's own phase rather than left to chance.
  const [xrayPhase, setXrayPhase] = useState<Phase>('idle');
  const takeover = xrayPhase === 'loading' || xrayPhase === 'playing';
  const takeoverRef = useRef(takeover);
  takeoverRef.current = takeover;

  const applyHeroCopy = useCallback(() => {
    const hero = heroRef.current;
    const copy = heroCopyRef.current;
    if (!hero || !copy) return;
    const h = hero.offsetHeight || window.innerHeight;
    const rect = hero.getBoundingClientRect();
    const p = h > 0 ? Math.min(1, Math.max(0, -rect.top / h)) : 0;
    // Ease the tail so the copy is mostly gone before the panel fully covers.
    const t = 1 - Math.pow(1 - p, 3);
    const dim = takeoverRef.current ? 0 : 1;
    copy.style.opacity = String((1 - t * 0.94) * dim);
    const scale = 1 - t * 0.05;
    const y = -t * 26;
    copy.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0) scale(${scale.toFixed(4)})`;
    copy.style.willChange = 'opacity, transform';
  }, []);

  // The hero "contracts" as it scrolls away: the copy scales down a touch,
  // lifts, and fades to nothing as the What I Do black panel grows over it.
  // Scroll-linked, passive — the intro runs once, the contract follows the
  // scroll so it never fights the pinned section underneath.
  useEffect(() => {
    let raf = 0;
    const queue = () => {
      if (!raf) raf = requestAnimationFrame(() => { raf = 0; applyHeroCopy(); });
    };
    applyHeroCopy();
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', queue);
      window.removeEventListener('resize', queue);
    };
  }, [applyHeroCopy]);

  // The takeover is not scroll-linked, so it gets its own pass.
  useEffect(() => { applyHeroCopy(); }, [takeover, applyHeroCopy]);

  return (
    <div className="min-h-screen bg-[#000000]">
      {/* ── About hero ──────────────────────────────────────────────────
          Stripped back to the same furniture the homepage hero runs: the
          photograph, the headline, and the nav. The eyebrow, the facts rail,
          the caption strip, the corner registrations, the contact-sheet
          hairlines, the index tab and the scribble are all gone — they were
          About-only decoration that made the two heroes read as different
          pages. The lime origin hairline went with them; the scroll wipe into
          What I Do draws its own line inside that component, so the
          transition is unaffected. */}
      <section
        ref={heroRef}
        className="relative h-[100svh] min-h-[560px] overflow-hidden bg-[#000000]"
      >
        {/* The hero plate: idles on the opening frame of the sequence, held in
            the grayscale study treatment. Running the sequence holds on its
            closing x-ray frame when it ends. */}
        <XrayHero ref={xrayRef} onPhaseChange={setXrayPhase} />

        {/* Copy on top. The whole line is set as one centred display lockup
            that fills the frame, after the homepage hero. */}
        <div className="relative z-10 h-full px-4 sm:px-6 lg:px-12 xl:px-24">
          <div
            ref={heroCopyRef}
            className={`h-full py-[8svh] max-w-[1600px] mx-auto will-change-[opacity,transform] ${
              takeover ? 'pointer-events-none transition-opacity duration-500 ease-out' : ''
            }`}
          >
            {/* The headline is also the trigger: MAAAADNESSS flaps to
                ARCHITECTURE, SKELETON UP flaps to UNLOCK SKELETON, and that
                last word starts the film. */}
            <AboutHeroTitle
              onUnlock={() => xrayRef.current?.engage()}
              suppressed={takeover}
              layout="centred"
              palette="homepage"
            />
          </div>
        </div>
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
