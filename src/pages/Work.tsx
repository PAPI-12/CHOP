import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import CTAButton from '../components/CTAButton';

type Project = {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  image: string;
  link: string;
  year: string;
  tags: string[];
  featured?: boolean;
};

const projects: Project[] = [
  {
    id: 'cornetto',
    title: 'CORNETTO CULTURE',
    subtitle: 'Johannesburg Skatepark — UI/UX, Art Direction & Illustration',
    category: 'UI/UX, ART DIRECTION & ILLUSTRATION',
    image: '/images/cornetto-truck.webp',
    link: '/work/cornetto',
    year: '2023',
    tags: ['UI/UX', 'ART DIRECTION', 'ILLUSTRATION'],
    featured: true,
  },
  {
    id: 'tau',
    title: 'TAU FOODS',
    subtitle: 'Tau Foods — UX/UI',
    category: 'UX/UI',
    image: '/images/tau-hero-phones.webp',
    link: '/work/tau-foods',
    year: '2024',
    tags: ['UX/UI'],
    featured: true,
  },
  {
    id: 'sars',
    title: 'SARS',
    subtitle: 'SARS MobiApp — Art Direction',
    category: 'ART DIRECTION',
    image: '/images/sars-cover.webp',
    link: '/work/sars',
    year: '2023',
    tags: ['ART DIRECTION'],
    featured: true,
  },
  {
    id: 'nandos',
    title: "NANDO'S",
    subtitle: 'Boujee Bowl — Art Direction',
    category: 'ART DIRECTION',
    image: '/images/boujee-bowl.webp',
    link: '/work/nandos',
    year: '2019',
    tags: ['ART DIRECTION'],
    featured: true,
  },
  {
    id: 'louis-vuitton',
    title: 'LOUIS VUITTON',
    subtitle: 'Outlandish — From Outlaws to High Fashion',
    category: 'AI',
    image: '/images/01-the-outlaw.webp',
    link: '/work/louis-vuitton',
    year: '2026',
    tags: ['AI'],
    featured: true,
  },
  {
    id: 'audi',
    title: 'AUDI',
    subtitle: 'A Curated Collection — AI Advertising',
    category: 'AI ADVERTISING',
    image: '/images/audi-01.webp',
    link: '/work/audi',
    year: '2024',
    tags: ['AI ADVERTISING'],
    featured: true,
  },
  {
    id: 'joshua',
    title: 'JOSHUA THE IAM',
    subtitle: 'OTR Special — Cinematography',
    category: 'CINEMATOGRAPHY',
    image: 'https://img.youtube.com/vi/VUCKP8Z2frQ/maxresdefault.jpg',
    link: '/work/joshua',
    year: '2022',
    tags: ['CINEMATOGRAPHY'],
    featured: true,
  },
  {
    id: 'vodacom',
    title: 'VODACOM',
    subtitle: 'Ready Business — Monopoly Campaign, Art Direction',
    category: 'ART DIRECTION',
    image: '/images/hero-collage.webp',
    link: '/work/vodacom',
    year: '2016',
    tags: ['ART DIRECTION'],
    featured: true,
  },
];

const filters = ['ALL', 'UX/UI', 'UI/UX', 'ART DIRECTION', 'ILLUSTRATION', 'AI', 'AI ADVERTISING', 'CINEMATOGRAPHY'];

const FeaturedProject: React.FC<{ project: Project; reverse?: boolean }> = ({ project, reverse = false }) => {
  const isInternal = project.link.startsWith('/');
  const Wrapper: any = isInternal ? Link : 'a';
  const linkProps = isInternal ? { to: project.link } : { href: project.link, target: '_blank', rel: 'noopener noreferrer' };
  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7 }}
      className="group relative grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10 items-center"
    >
      <Wrapper
        {...linkProps}
        className={`col-span-1 lg:col-span-7 ${reverse ? 'lg:order-2' : ''} block relative aspect-[16/10] md:aspect-[16/9] overflow-hidden rounded-2xl md:rounded-[2.5rem]`}
      >
        <img loading="lazy" decoding="async" src={project.image} alt={project.title} className="w-full h-full object-cover grayscale brightness-[0.5] group-hover:grayscale-0 group-hover:brightness-[0.65] group-hover:scale-[1.04] transition-all duration-[900ms]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#171715]/80 via-transparent to-transparent" />
        <div className="absolute bottom-4 right-4 md:bottom-5 md:right-5 text-[9px] md:text-[10px] font-black tracking-[0.3em] text-white/50 uppercase">{project.year}</div>
      </Wrapper>

      <div className={`col-span-1 lg:col-span-5 ${reverse ? 'lg:order-1 lg:text-right' : ''}`}>
        <p className="hand-note text-[#d7ff4f] text-xl md:text-3xl mb-3 md:mb-4 rotate-[-4deg] inline-block">{project.subtitle}</p>
        <h3 className="font-display text-[11vw] md:text-[5.5vw] leading-[0.88] text-[#f5f3ee] group-hover:text-[#d7c4aa] transition-colors">{project.title}</h3>
        <p className="mt-3 md:mt-4 text-[10px] md:text-sm font-bold uppercase tracking-[0.25em] text-[#8f8f88]">{project.category}</p>
        <div className={`mt-4 md:mt-6 flex flex-wrap gap-2 ${reverse ? 'lg:justify-end' : ''}`}>
          {project.tags.map((t) => (<span key={t} className="px-3 py-1 text-[9px] font-black uppercase tracking-[0.15em] border border-white/15 rounded-full text-[#d0d0c8]">{t}</span>))}
        </div>
        <Wrapper {...linkProps} className="inline-flex items-center gap-3 mt-6 md:mt-8 text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-[#d7ff4f] group/btn hover:text-white transition-colors">
          View Project
          <span className="w-8 h-[1px] bg-[#d7ff4f] group-hover/btn:w-12 group-hover/btn:bg-white transition-all" />
        </Wrapper>
      </div>
    </motion.article>
  );
};

const Work: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const filtered = activeFilter === 'ALL' ? projects : projects.filter((p) => p.tags.some((t) => t.toLowerCase().includes(activeFilter.toLowerCase())) || p.category.toLowerCase().includes(activeFilter.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#171715] pt-24 md:pt-32 pb-20">
      <section className="px-4 sm:px-6 lg:px-12 xl:px-24 mb-14 md:mb-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-[1600px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 md:gap-8 mb-8 md:mb-10">
            <div>
              <p className="text-[10px] md:text-xs font-bold tracking-[0.4em] uppercase mb-4 md:mb-6 text-[#8f8f88]">Archive / 2015–2024</p>
              <h1 className="font-display leading-[0.82] text-[#f5f3ee]">
                <span className="block text-[16vw] md:text-[12vw]">SELECTED</span>
                <span className="block text-[16vw] md:text-[12vw] text-[#d7c4aa] italic">WORK<span className="text-[#d7ff4f]">.</span></span>
              </h1>
            </div>
            <div className="md:max-w-sm md:text-right">
              <p className="hand-note text-[#d7ff4f] text-2xl md:text-4xl mb-3 md:mb-4 rotate-[-4deg]">culture led projects</p>
              <p className="text-xs md:text-sm text-[#8f8f88] leading-relaxed">TAU FOODS: UX/UI · SARS: ART DIRECTION · LOUIS VUITTON: AI · CORNETTO: UI/UX, ART DIRECTION & ILLUSTRATION · AUDI: AI ADVERTISING · NANDO'S: ART DIRECTION · VODACOM: ART DIRECTION · JOSHUA THE IAM: CINEMATOGRAPHY</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 md:gap-3 pt-5 md:pt-6 border-t border-white/10">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3 md:px-4 py-2 text-[9px] md:text-xs font-black uppercase tracking-[0.2em] rounded-full transition-all duration-300 ${activeFilter === f ? 'bg-[#d7ff4f] text-[#171715]' : 'border border-white/10 text-[#8f8f88] hover:border-[#d7c4aa] hover:text-[#d7c4aa]'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="px-4 sm:px-6 lg:px-12 xl:px-24 mb-16 md:mb-32">
        <div className="max-w-[1600px] mx-auto space-y-8 md:space-y-16">
          {filtered.map((project, index) => (<FeaturedProject key={project.id} project={project} reverse={index % 2 === 1} />))}
          {filtered.length === 0 && (
            <div className="py-20 text-center">
              <p className="hand-note text-[#d7ff4f] text-3xl rotate-[-6deg] mb-4">No projects here yet</p>
              <button onClick={() => setActiveFilter('ALL')} className="text-sm text-[#8f8f88] hover:text-white transition-colors uppercase tracking-[0.2em]">← Back to all work</button>
            </div>
          )}
        </div>
      </section>

      <section className="py-8 md:py-12 mb-16 md:mb-32 border-y border-white/10 overflow-hidden bg-[#1d1d1a]">
        <div className="flex gap-8 md:gap-16 whitespace-nowrap will-change-transform work-marquee-track">
          {[...Array(2)].map((_, i) => (
            <React.Fragment key={i}>
              {['UX/UI', 'ART DIRECTION', 'ILLUSTRATION', 'AI', 'AI ADVERTISING', 'CINEMATOGRAPHY', 'CAMPAIGN CRAFT'].map((label, j) => (
                <span key={j} className="font-display text-4xl md:text-7xl text-transparent shrink-0" style={{ WebkitTextStroke: '1px rgba(215, 255, 79, 0.25)' }}>{label} ✦</span>
              ))}
            </React.Fragment>
          ))}
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-12 xl:px-24 mt-20 md:mt-32">
        <div className="max-w-[1600px] mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="border-t border-white/10 pt-14 md:pt-24 text-center">
            <p className="hand-note text-[#d7c4aa] text-2xl md:text-4xl mb-5 md:mb-6 rotate-[-3deg]">have a project in mind?</p>
            <h2 className="font-display text-[13vw] md:text-[8vw] leading-[0.85] text-[#f5f3ee] mb-8 md:mb-10">LET'S BUILD<br /><span className="text-[#d7ff4f]">SOMETHING DOPE.</span></h2>
            <CTAButton to="/contact">Start a Project</CTAButton>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Work;
