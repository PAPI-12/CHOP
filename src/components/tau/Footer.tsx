import { Link } from 'react-router-dom';
import { Fade, TauLogo, SAFlag } from './shared';
import { ExternalLink, Code2 } from 'lucide-react';

export default function Footer() {
  return (
    <div className="bg-[#060e08] border-t border-[#243d2c]">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-16 lg:py-20">

        {/* Portfolio badge */}
        <Fade className="mb-16">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 p-6 rounded-2xl bg-[#0d1a10] border border-[#243d2c]">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-[#1a4d2e] border border-[#2d6a4f] flex items-center justify-center shrink-0">
                <Code2 className="w-5 h-5 text-[#74c69d]" />
              </div>
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-widest mb-0.5">Featured in</p>
                <p className="font-bold text-white">Papi Raborife &mdash; React Portfolio Project</p>
              </div>
            </div>
            <Link
              to="/work"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#74c69d] text-[#0a0a0a] font-bold text-sm hover:bg-[#95d5b2] transition-all w-fit"
            >
              View Portfolio <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </Fade>

        {/* Logo + links */}
        <Fade>
          <div className="mb-14">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <TauLogo size={36} />
                <span className="font-tau-futura font-black text-lg text-white tracking-tight">TAU FOODS</span>
                <SAFlag className="w-7 h-5" />
              </div>
              <p className="text-[13px] text-white/40 max-w-xs leading-relaxed">
                Quality food, priced in rands, made for all. A South African e-commerce 
                experience designed with Mzansi in mind — from spaza to stoep.
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                {['Built with React + Vite', 'Tailwind CSS', 'Framer Motion', 'Designed in Figma', 'Analysed with Python'].map((t) => (
                  <span key={t} className="text-[10px] text-white/30 bg-[#0d1a10] border border-[#243d2c] px-2.5 py-1 rounded-lg">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="tau-section-line pt-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <p className="text-[11px] text-white/20">
              &copy; 2024 Papi Raborife. TAU FOODS UI/UX Case Study. React Portfolio Project.
            </p>
            <div className="flex items-center gap-2">
              <p className="text-[11px] text-white/20">Designed & developed in South Africa</p>
              <SAFlag className="w-5 h-3.5" />
            </div>
          </div>

          <p className="text-[10px] text-white/15 mt-6 leading-relaxed max-w-4xl">
            TAU FOODS is a conceptual South African e-commerce brand created for this UI/UX case study. 
            All statistics, metrics, personas and research findings are illustrative and created for 
            demonstration purposes. Pricing shown in South African Rand (ZAR). This case study forms 
            part of Papi Raborife&apos;s React Portfolio Project and showcases the full UX process — 
            qualitative and quantitative research (using Python/pandas), job stories, customer journey 
            mapping, information architecture, user flows, Kano model, lo-fi prototyping, user testing, 
            and high-fidelity UI design.
          </p>
        </Fade>
      </div>
    </div>
  );
}
