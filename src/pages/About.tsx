import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import CTAButton from '../components/CTAButton';
import AboutHeroTitle from '../components/AboutHeroTitle';
import WhatIDo from '../components/WhatIDo';
import XrayHero, { type XrayHeroHandle, type Phase } from '../components/XrayHero';
import SkeletonSwitch from '../components/SkeletonSwitch';

/**
 * About.
 *
 * The hero is a full-bleed, edge-to-edge plate with the copy set ON TOP of it
 * — no gradients, no masks. It idles on the first frame of the x-ray sequence
 * (see components/XrayHero); pressing the control runs the sequence in colour
 * and it settles on its closing x-ray frame. The hero carries nothing but the
 * photograph, the headline and the site's nav, so it reads as the same page as
 * the homepage hero.
 *
 * ── Skeleton mode ──────────────────────────────────────────────────────
 * Every section here has two states, and each one carries its own switch.
 * Normal is the finished surface; skeleton is the structure underneath it.
 * The page's own line — the architecture of art built from the skeleton up —
 * is the whole idea, so the switch is not a theme toggle: it is the same
 * section with the surface taken away.
 *
 *   hero         the photograph becomes the subject's bones (the lime x-ray
 *                the sequence already ends on)
 *   practice     the display type becomes its own skeleton — outlined
 *                letterforms — and the typesetter's construction lines appear
 *                underneath it
 *   experience   the roles outline, and the list grows a spine with a node at
 *                every entry, so a column of rows reads as a structure
 *   cta          the note outlines and the section's centre line is drawn
 *
 * Nothing reflows between the two states. Skeleton mode takes a fill away and
 * leaves a stroke where it was, so switching is a reveal, not a relayout.
 */

/** The sections that carry a switch. */
type SectionKey = 'hero' | 'practice' | 'experience' | 'cta';

const EXPERIENCE = [
  { year: 'NOW', role: 'UI/UX Designer', company: 'Bald Agency' },
  { year: '2025', role: 'AI Creative', company: 'Monkey and Donkey Creative Agency' },
  { year: '2023–25', role: 'UI/UX Designer', company: 'Tau Foods' },
  { year: '2022', role: 'Mid-Senior Art Director & Digital Designer', company: 'Ogilvy Joburg' },
  { year: '2020–21', role: 'Mid Art Director & Digital Designer', company: 'The Niche Guys' },
  { year: '2019–20', role: 'Mid Art Director & Digital Designer', company: 'M&C Saatchi Abel' },
  { year: '2016–19', role: 'Junior Art Director, Digital Designer', company: 'FCB Joburg' },
  { year: '2015', role: 'Junior Graphic Designer', company: 'Umuzi Academy' },
];

const About: React.FC = () => {
  const heroRef = useRef<HTMLElement>(null);
  const heroCopyRef = useRef<HTMLDivElement>(null);
  const xrayRef = useRef<XrayHeroHandle>(null);

  // Each section keeps its own switch. They are independent on purpose: the
  // point is to be able to put one section into its skeleton and leave the
  // rest alone, not to flip the whole page at once.
  const [skeleton, setSkeleton] = useState<Record<SectionKey, boolean>>({
    hero: false,
    practice: false,
    experience: false,
    cta: false,
  });
  const toggle = useCallback(
    (key: SectionKey) => setSkeleton((s) => ({ ...s, [key]: !s[key] })),
    [],
  );

  // While the film is running it owns the hero outright: every piece of page
  // furniture clears so the sequence plays edge to edge, and it all comes
  // back when the video ends. That takeover is the intent, not a side effect
  // — so it is driven from the player's own phase rather than left to chance.
  const [xrayPhase, setXrayPhase] = useState<Phase>('idle');
  const takeover = xrayPhase === 'loading' || xrayPhase === 'playing';
  // The headline is launched from the moment the control is pressed until the
  // film ends: it arms its rockets and clears the frame, and comes back down
  // afterwards. The 'launching' beat is not a takeover — the title is still
  // on screen, flying out under its own animation.
  const launched = xrayPhase === 'launching' || takeover;
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
          photograph, the headline, and the nav. */}
      <section
        ref={heroRef}
        className="relative h-[100svh] min-h-[560px] overflow-hidden bg-[#000000]"
      >
        {/* The hero plate. In skeleton mode it idles on the bones instead of
            the photograph — the surface is taken away and what is left is
            what holds the subject up. */}
        <XrayHero ref={xrayRef} onPhaseChange={setXrayPhase} skeleton={skeleton.hero} />

        {/* The hero's switch. Bottom-LEFT, because the sequence control
            already owns the bottom-right corner.

            It clears while the film runs. Skeleton mode chooses between the
            photograph and the bones, and neither is on screen during the
            sequence — leaving the switch up would offer a control that does
            nothing until the film ends. */}
        <div
          className="absolute z-20 bottom-14 left-4 sm:left-6 lg:left-12 xl:left-24 transition-opacity duration-500 ease-out"
          style={{
            opacity: takeover ? 0 : 1,
            pointerEvents: takeover ? 'none' : 'auto',
          }}
        >
          <SkeletonSwitch
            on={skeleton.hero}
            onChange={() => toggle('hero')}
            label="Skeleton mode for the hero"
          />
        </div>

        {/* Copy on top. The whole line is set as one centred display lockup
            that fills the frame, after the homepage hero. */}
        <div className="relative z-10 h-full px-4 sm:px-6 lg:px-12 xl:px-24">
          <div
            ref={heroCopyRef}
            className={`h-full py-[8svh] max-w-[1600px] mx-auto will-change-[opacity,transform] ${
              takeover ? 'pointer-events-none transition-opacity duration-500 ease-out' : ''
            }`}
          >
            {/* Six rows widening downward — ARCHITECTURE, OF ART BUILT FROM
                THE, SKELETON — so the block silhouettes a tree, with the
                U+P lockup hanging below as the stem. It opens on MADNESS and
                stays there: pressing Launch Madness turns the U and P into
                rockets and sends the whole block out of frame before the film
                runs, and the X's flap the new line out when it lands. */}
            <AboutHeroTitle layout="tree" palette="homepage" launched={launched} />
          </div>
        </div>
      </section>

      <WhatIDo
        variant="about"
        skeleton={skeleton.practice}
        onSkeletonChange={() => toggle('practice')}
      />

      <section className="px-4 sm:px-6 lg:px-12 xl:px-24 py-14 md:py-24">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-center justify-between gap-4 mb-8 md:mb-16">
            <p className="text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase text-[#8f8f88]">
              Experience
            </p>
            <SkeletonSwitch
              on={skeleton.experience}
              onChange={() => toggle('experience')}
              label="Skeleton mode for Experience"
              flip
            />
          </div>

          {/* Skeleton mode gives the list a spine: a vertical hairline down
              the left with a node at every entry, so eight rows read as one
              structure instead of eight separate lines. The spine and the
              nodes live in the section's left padding, which is why nothing
              has to move to make room for them. */}
          <div className="relative space-y-6 md:space-y-12">
            {skeleton.experience && (
              <span aria-hidden className="skel-spine" style={{ left: -8 }} />
            )}
            {EXPERIENCE.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="relative pb-6 md:pb-8 border-b border-white/10"
              >
                <div className="relative flex flex-col md:flex-row md:items-center gap-1 md:gap-8">
                  {skeleton.experience && (
                    <span aria-hidden className="skel-node" style={{ left: -8, top: '50%' }} />
                  )}
                  <span className="text-[#d7ff4f] font-bold text-xs md:text-base w-14 md:w-20">
                    {item.year}
                  </span>
                  <h3
                    className={`text-base md:text-2xl font-display ${
                      skeleton.experience ? 'skel-stroke' : ''
                    }`}
                    style={{
                      // Set inline rather than leaving it to the cascade: a
                      // Tailwind colour utility would otherwise be a coin
                      // toss against .skel-stroke depending on layer order.
                      color: skeleton.experience ? 'transparent' : '#f5f3ee',
                      ['--skel-stroke' as any]: '#f5f3ee',
                    }}
                  >
                    {item.role}
                  </h3>
                  <span className="text-[#8f8f88] text-xs md:text-base md:ml-auto">
                    {item.company}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative px-4 sm:px-6 lg:px-12 xl:px-24 py-14 md:py-24 bg-[#000000]">
        {/* Skeleton mode draws the axis this section is composed on — the
            vertical centre line the note and the button are both set to. */}
        {skeleton.cta && (
          <span
            aria-hidden
            className="skel-spine hidden md:block"
            style={{ left: '50%', top: '2rem', bottom: '2rem' }}
          />
        )}
        <div className="max-w-[1600px] mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p
              className={`hand-note text-2xl md:text-4xl mb-5 md:mb-6 ${
                skeleton.cta ? 'skel-stroke skel-stroke--xl' : ''
              }`}
              style={{
                color: skeleton.cta ? 'transparent' : '#d7c4aa',
                ['--skel-stroke' as any]: '#d7c4aa',
              }}
            >
              ready to collaborate?
            </p>
            <CTAButton to="/resume">VIEW RESUME</CTAButton>
          </motion.div>
        </div>

        <div className="mt-10 md:mt-14 flex justify-center">
          <SkeletonSwitch
            on={skeleton.cta}
            onChange={() => toggle('cta')}
            label="Skeleton mode for the closing section"
          />
        </div>
      </section>
    </div>
  );
};

export default About;
