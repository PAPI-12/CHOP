import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Download } from 'lucide-react';
import CTAButton from '../components/CTAButton';
import { ScribbleX, ScribbleUnderline } from '../components/Scribbles';

const skills = ['SKETCH', 'ADOBE XD', 'FIGMA', 'PHOTOSHOP', 'INDESIGN', 'ILLUSTRATOR', 'PREMIERE PRO', 'DAVINCI RESOLVE'];

const experience = [
  { range: 'MAR 2026 — NOW', role: 'UI/UX Designer', company: 'Bald Agency', desc: 'Leading UI/UX design across digital products and campaign work, from concept through to final delivery.' },
  { range: 'APR 2025 — 2025', role: 'AI Creative', company: 'Monkey and Donkey Creative Agency', desc: 'Produced AI-driven advertising and creative concepts, exploring generative image and video workflows for brand campaigns.' },
  { range: 'MAR 2023 — 2025', role: 'UI/UX Designer', company: 'Tau Foods — UX/UI', desc: 'Created the Tau Foods UI for web and mobile using Figma and Adobe CC, building prototypes while guiding stakeholders and owning budgets plus API integrations.' },
  { range: 'JAN — NOV 2022', role: 'UI/UX · Mid-Senior Art Director & Digital Designer', company: 'Ogilvy Joburg — 360 campaigns', desc: 'Handled above and below the line design elements with quick turnaround, directing art direction and flagging delivery risks early.' },
  { range: 'JUN 2020 — APR 2021', role: 'UI/UX · Mid Art Director & Digital Designer', company: 'The Niche Guys', desc: 'Created graphics across print, social and ATL/BTL, maintaining CI consistency and managing multiple deadlines.' },
  { range: 'JUL 2019 — APR 2020', role: 'UI/UX · Mid Art Director & Digital Designer', company: 'M&C Saatchi Abel', desc: 'Conceived big ideas to shift behaviour and directed visuals with layout, fonts, illustration and typography.' },
  { range: 'FEB 2016 — JUL 2019', role: 'Junior Art Director, Digital Designer', company: 'FCB Joburg', desc: 'Developed concepts, graphics, logos and websites with CD/ECD reviews.' },
  { range: 'FEB — NOV 2015', role: 'Junior Graphic Designer', company: 'Umuzi Academy', desc: 'Built concepts and sites against brief deliverables with lecturer reviews.' },
];

const education = [
  { level: 'University', places: ['University of Cape Town', 'UNISA', 'University of the Witwatersrand'] },
  { level: 'School', places: ['St Stithians College', 'Ferndale High School', 'Victory House Private School'] },
];

const marquee = [
  'CULTURE LED CREATIVE',
  'CRAFTING AWESOMENESS SINCE 2015',
  'TAU FOODS: UX/UI',
  'SARS: ART DIRECTION',
  'LOUIS VUITTON: AI',
  'CORNETTO: UI/UX, ART DIR & ILLUSTRATION',
  'AUDI: AI ADVERTISING',
  'DEBONAIRS: ART DIR & CINE',
  'JOSHUA THE IAM: CINEMATOGRAPHY',
];

const Resume: React.FC = () => {
  const handlePrint = () => window.print();

  return (
    <div className="resume-page min-h-screen bg-[#171715] pt-24 md:pt-28 pb-0 overflow-hidden">
      <div className="resume-actions px-4 sm:px-6 lg:px-12 xl:px-24 mb-8 md:mb-14">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-3 md:gap-4 flex-wrap">
          <Link to="/" className="inline-flex items-center gap-2 text-[10px] md:text-xs font-bold uppercase tracking-[0.25em] text-[#8f8f88] hover:text-[#d7ff4f] transition-colors">
            <ArrowLeft size={14} /> Back
          </Link>
          <div className="flex items-center gap-3 md:gap-4 flex-wrap">
            <span className="hidden lg:inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-[#8f8f88]">
              <span className="w-8 h-[1px] bg-white/20" /> DOSSIER // SERIAL: PR-2015-LV
            </span>
            <CTAButton onClick={handlePrint} icon={<Download size={13} />} ariaLabel="Print or save resume as PDF">
              INJECT THE CULTURE
            </CTAButton>
          </div>
        </div>
      </div>

      <div className="resume-content px-4 sm:px-6 lg:px-12 xl:px-24">
        <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-y-14 lg:gap-x-10 xl:gap-x-12 items-start">
          {/* LEFT — identity (sticky on large screens) */}
          <div className="lg:col-span-5 lg:sticky lg:top-28">
            <p className="font-mono text-[10px] md:text-xs tracking-[0.3em] uppercase text-[#8f8f88] mb-5 md:mb-6">DOSSIER // FILE: PR-2015</p>

            <div className="relative">
              <h1 className="font-display leading-[0.82] text-[17vw] sm:text-[13vw] lg:text-[6.4vw] text-[#f5f3ee]">PAPI</h1>
              <h1 className="font-display leading-[0.82] text-[17vw] sm:text-[13vw] lg:text-[6.4vw] text-[#d7ff4f] -mt-1 md:-mt-2">RABORIFE</h1>
              <ScribbleX className="absolute -top-2 right-2 md:right-8 w-8 h-8 md:w-10 md:h-10 opacity-70" />
            </div>

            <p className="mt-5 md:mt-8 text-xs md:text-base font-bold uppercase tracking-[0.15em] text-[#d7c4aa]">
              UI/UX Design <span className="text-[#8f8f88]">·</span> Art Direction <span className="text-[#8f8f88]">·</span> Graphic Design
            </p>
            <ScribbleUnderline className="w-24 md:w-28 h-3 md:h-4 opacity-60 mt-3 md:mt-4 -rotate-2" />

            <div className="mt-10 md:mt-16">
              <div className="flex items-center gap-3 mb-5 md:mb-6">
                <span className="w-8 h-[1px] bg-[#d7ff4f]" />
                <p className="text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase text-[#d7ff4f]">PHASE 03 — CAPABILITY MATRIX</p>
              </div>
              <div className="grid grid-cols-1 divide-y divide-white/10 border-y border-white/10 bg-[#1d1d1a] rounded-xl overflow-hidden">
                {skills.map((s) => (
                  <div key={s} className="flex items-center justify-between px-4 py-3 md:py-3.5">
                    <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.15em] text-[#f5f3ee]">{s}</span>
                    <span className="px-2.5 py-1 border border-[#d7ff4f]/70 rounded-[2px] text-[9px] font-black uppercase tracking-[0.15em] text-[#d7ff4f]">ACTIVE</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-10 md:mt-16">
              <div className="flex items-center gap-3 mb-4 md:mb-5">
                <span className="w-8 h-[1px] bg-[#d7ff4f]" />
                <p className="text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase text-[#8f8f88]">TRANSMISSION</p>
              </div>
              <div className="flex flex-col items-start gap-1">
                <a href="mailto:papiraborife@gmail.com" className="font-display text-[7vw] sm:text-[4.5vw] lg:text-[2.6vw] leading-[0.95] text-[#f5f3ee] hover:text-[#d7ff4f] transition-colors break-all">PAPIRABORIFE@GMAIL.COM</a>
                <a href="tel:+27636965065" className="font-display text-[7vw] sm:text-[4.5vw] lg:text-[2.6vw] leading-[0.95] text-[#d7c4aa] hover:text-[#d7ff4f] transition-colors">+27 63 696 5065</a>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 items-center">
                  <a href="https://papi-raborife.vercel.app" target="_blank" rel="noreferrer" className="font-display text-base md:text-2xl text-[#f5f3ee] hover:text-[#d7ff4f] transition-colors">WEBSITE</a>
                  <span className="text-[#8f8f88] text-base md:text-xl">/</span>
                  <a href="https://www.linkedin.com/papi-raborife" target="_blank" rel="noreferrer" className="font-display text-base md:text-2xl text-[#f5f3ee] hover:text-[#d7ff4f] transition-colors">LINKEDIN</a>
                  <span className="text-[#8f8f88] text-base md:text-xl">/</span>
                  <Link to="/contact" className="inline-flex items-center gap-2 font-display text-base md:text-2xl text-[#f5f3ee] hover:text-[#d7ff4f] transition-colors">CONTACT ME <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5" /></Link>
                </div>
                <div className="mt-4">
                  <CTAButton onClick={handlePrint} icon={false} ariaLabel="Print or save resume as PDF">
                    READ.CV / PRINT
                  </CTAButton>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — phases */}
          <div className="lg:col-span-7">
            <div className="mb-14 md:mb-24">
              <div className="flex items-center gap-3 mb-5 md:mb-6">
                <span className="w-8 h-[1px] bg-[#d7ff4f]" />
                <p className="text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase text-[#d7ff4f]">PHASE 01 — SUBJECT HISTORY</p>
              </div>
              <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="font-display text-[9vw] md:text-[3.6vw] leading-[0.92] text-[#f5f3ee]">
                A SELECTIVELY SKILLED <span className="text-[#d7ff4f]">PRODUCT DESIGNER</span> & ART DIRECTOR.
              </motion.h2>
              <p className="mt-5 md:mt-6 text-sm md:text-base text-[#8f8f88] max-w-xl leading-relaxed">
                Over a decade shaping product interfaces, campaign systems and digital experiences for brands across SA — moving fluidly between UX/UI, art direction, illustration, AI advertising and cinematography without losing sight of the culture.
              </p>
            </div>

            <div className="mb-14 md:mb-24">
              <div className="flex items-center gap-3 mb-8 md:mb-10">
                <span className="w-8 h-[1px] bg-[#d7ff4f]" />
                <p className="text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase text-[#d7ff4f]">PHASE 02 — EXPERIENCE ARCHIVE</p>
              </div>
              <div className="border-t border-white/10">
                {experience.map((job, i) => (
                  <motion.div key={job.company} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }} className="group grid grid-cols-1 md:grid-cols-[130px_1fr] gap-1 md:gap-8 py-6 md:py-8 border-b border-white/10">
                    <span className="font-mono text-[10px] md:text-xs text-[#d7ff4f] uppercase tracking-[0.1em] md:pt-1">{job.range}</span>
                    <div>
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-2">
                        <h3 className="font-display text-lg md:text-[2vw] leading-[0.95] text-[#f5f3ee] group-hover:text-[#d7ff4f] transition-colors">{job.company}</h3>
                        <span className="text-[9px] md:text-xs uppercase tracking-[0.15em] text-[#d7c4aa]">{job.role}</span>
                      </div>
                      <p className="text-xs md:text-sm text-[#8f8f88] leading-relaxed max-w-2xl">{job.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="mb-14 md:mb-24">
              <div className="flex items-center gap-3 mb-8 md:mb-10">
                <span className="w-8 h-[1px] bg-[#d7ff4f]" />
                <p className="text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase text-[#d7ff4f]">PHASE 04 — EDUCATION</p>
              </div>
              <div className="space-y-6 md:space-y-8">
                {education.map((edu, i) => (
                  <motion.div key={edu.level} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="border-b border-white/10 pb-6 md:pb-8">
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#d7ff4f] mb-2 md:mb-3">{edu.level}</p>
                    <h3 className="font-display text-lg sm:text-2xl md:text-3xl leading-tight text-[#f5f3ee]">{edu.places.join(' / ')}</h3>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative mt-16 md:mt-28 py-4 md:py-5 bg-[#d7ff4f] overflow-hidden no-print">
        <div className="flex gap-8 md:gap-14 whitespace-nowrap will-change-transform work-marquee-track">

          {[...Array(2)].map((_, dup) => (
            <div key={dup} className="flex gap-8 md:gap-14 items-center shrink-0">
              {marquee.map((item, j) => (
                <span key={j} className="flex shrink-0 items-center gap-8 md:gap-14">
                  <span className="font-mono text-[10px] md:text-sm font-black uppercase tracking-[0.2em] text-[#171715]">{item}</span>
                  <span className="text-[#171715] text-sm">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Resume;
