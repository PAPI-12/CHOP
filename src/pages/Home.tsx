import React from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import Clients from '../components/Clients';
import WhatIDo from '../components/WhatIDo';
import CTAButton from '../components/CTAButton';
import { ScribbleX } from '../components/Scribbles';
import Reveal from '../components/Reveal';

const Home: React.FC = () => {
  const projects = [
    { title: 'TAU FOODS', subtitle: 'UX/UI', image: '/images/tau-hero-phones.webp', link: '/work/tau-foods' },
    { title: 'CORNETTO', subtitle: 'UI/UX, ART DIRECTION & ILLUSTRATION', image: '/images/cornetto-truck.webp', link: '/work/cornetto' },
    { title: 'SARS', subtitle: 'ART DIRECTION', image: '/images/sars-cover.webp', link: '/work/sars' },
  ];

  return (
    // A single, viewport-locked ambient wash spans the ENTIRE home page — the
    // grain film used to be per-section, and each section's own film sliding
    // into view read as the site "jittering" while scrolling.
    <div
      className="relative z-10 bg-[#171715]"
      style={{
        backgroundImage:
          'radial-gradient(90% 60% at 85% -10%, rgba(215,255,79,0.16), transparent 55%), radial-gradient(70% 50% at -10% 30%, rgba(215,196,170,0.1), transparent 60%), radial-gradient(80% 60% at 50% 120%, rgba(245,243,238,0.06), transparent 62%)',
      }}
    >
      <Hero />

      {/* About holds while What I Do — a full opaque page — scrolls over it. */}
      <div className="relative">
        <section className="sticky top-0 z-0 h-[100svh] min-h-[540px] w-full overflow-hidden bg-[#171715]">
          <div className="absolute inset-0">
            <img loading="lazy"
              src="/images/PAPI RABORIFE ABOUT COVER.webp"
              alt="Papi Raborife"
              className="w-full h-full object-cover object-center grayscale contrast-[1.05] brightness-[0.55]"
              decoding="async"
              fetchPriority="low"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#171715] via-[#171715]/70 to-[#171715]/30" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#171715] via-transparent to-[#171715]/60" />
          </div>

          <div className="relative z-10 h-full flex items-end md:items-center px-4 sm:px-6 lg:px-12 xl:px-24 py-20 md:py-32">
            <div className="max-w-[1600px] w-full mx-auto">
              <Reveal className="max-w-3xl">
                <p className="text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase mb-5 md:mb-6 text-[#8f8f88]">
                  About
                </p>
                <h2 className="text-[11vw] sm:text-[9vw] md:text-[5.5vw] font-display leading-[0.88] text-[#f5f3ee] mb-5 md:mb-6">
                  CRAFTING<br />
                  <span className="text-[#d7c4aa]">AWESOMENESS</span><br />
                  <span className="text-[#d7ff4f]">SINCE 2015</span>
                </h2>
                <p className="text-[#d0d0c8] text-sm md:text-lg max-w-md mb-7 md:mb-8 leading-relaxed">
                  A selectively skilled product designer with strong focus on producing high quality & impactful digital experiences — culture-led, systems-minded.
                </p>
                <div className="flex flex-wrap items-center gap-5 md:gap-6">
                  <CTAButton to="/about">MORE ABOUT ME</CTAButton>
                  <span className="hand-note text-[#d7c4aa] text-lg md:text-2xl rotate-[-3deg]">the maker · JHB SA</span>
                </div>
              </Reveal>
            </div>
          </div>

          <ScribbleX className="absolute top-20 md:top-24 right-6 md:right-16 w-8 h-8 md:w-10 md:h-10 z-20 opacity-70" />
        </section>

        <WhatIDo />
      </div>

      <section className="relative z-20 px-4 sm:px-6 lg:px-12 xl:px-24 py-20 md:py-32 bg-[#1d1d1a]">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 md:mb-16">
            <div>
              <p className="text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase mb-4 text-[#8f8f88]">Selected Work</p>
              <h2 className="text-[11vw] md:text-[5vw] font-display leading-[0.85] text-[#f5f3ee]">
                FEATURED<br /><span className="text-[#d7c4aa]">PROJECTS</span>
              </h2>
            </div>
            <CTAButton to="/work" className="self-start md:self-auto">VIEW ALL PROJECTS</CTAButton>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {projects.map((project, index) => (
              <Reveal
                key={index}
                as="article"
                delay={index * 0.12}
                className="group relative aspect-[4/5] rounded-2xl overflow-hidden"
              >
                <Link to={project.link}>
                  <img
                    src={project.image}
                    alt={project.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover grayscale brightness-50 group-hover:grayscale-0 group-hover:brightness-75 group-hover:scale-105 transition-all duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#171715] via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 p-5 md:p-8">
                    <p className="text-[9px] md:text-[10px] text-[#d7ff4f] uppercase tracking-wider mb-2">{project.subtitle}</p>
                    <h3 className="text-xl md:text-3xl font-display text-[#f5f3ee]">{project.title}</h3>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Clients />

      <section className="px-4 sm:px-6 lg:px-12 xl:px-24 py-20 md:py-32">
        <div className="max-w-[1600px] mx-auto text-center">
          <Reveal>
            <p className="hand-note text-[#d7c4aa] text-2xl md:text-4xl mb-4">let's build something unforgettable</p>
            <h2 className="text-[13vw] md:text-[8vw] font-display leading-[0.85] text-[#f5f3ee] mb-8">
              READY TO<br /><span className="text-[#d7ff4f]">COLLABORATE?</span>
            </h2>
            <CTAButton to="/contact">GET IN TOUCH</CTAButton>
          </Reveal>
        </div>
      </section>
    </div>
  );
};

export default Home;
