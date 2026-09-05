import { motion } from 'framer-motion';
import { ArrowDown, Play } from 'lucide-react';
import { TauLogo, SAFlag, Fade } from './shared';
import { usePrototype } from './prototype/PrototypeContext';

const TOOLS = ['Figma', 'Python', 'FigJam', 'Ps', 'Ai', 'XD'];

const PRICES = [
  'Maize Meal 5kg · R62.99',
  'Rooibos Tea 80s · R45.00',
  'Free-Range Eggs 30pk · R94.99',
  'Butternut Squash /kg · R18.99',
  'Biltong 100g · R69.99',
  'Amasi 500ml · R18.50',
  'Morogo Bunch · R12.99',
  'Boerewors /kg · R89.99',
  'Samp & Beans 1kg · R29.99',
  'Naartjies /kg · R24.99',
  'Chakalaka 375g · R27.99',
  'Ouma Rusks 500g · R54.99',
];

export default function Hero() {
  const { launch } = usePrototype();
  return (
    <section className="relative min-h-screen bg-[#0a0a0a] flex flex-col overflow-hidden">

      {/* ── Background greenhouse photo ── */}
      <div className="absolute inset-0">
        <img loading="lazy" decoding="async"
          src="/images/tau-greenhouse.webp"
          alt="Local South African farm"
          className="w-full h-full object-cover opacity-[0.12]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/60 via-transparent to-[#0a0a0a]" />
      </div>

      {/* ── Decorative radial glow ── */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-[#1a4d2e]/30 blur-[120px] pointer-events-none" />

      {/* ── Main content ── */}
      <div className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-5 lg:px-8 pt-28 pb-10 flex flex-col lg:flex-row items-center gap-12 lg:gap-6">

        {/* Left column */}
        <div className="flex-1 min-w-0">
          {/* Top row: logo + tools */}
          <Fade>
            <div className="flex items-center gap-3 mb-8 flex-wrap">
              <TauLogo size={40} />
              <span className="font-tau-futura text-2xl font-black text-white tracking-tight">TAU FOODS</span>
              <SAFlag className="w-7 h-5" />
              <div className="ml-2 flex items-center gap-2 flex-wrap">
                {TOOLS.map((t) => (
                  <span
                    key={t}
                    className="px-2.5 py-1 rounded-md bg-[#162b1e] border border-[#243d2c] text-[11px] font-semibold text-[#74c69d]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </Fade>

          {/* Headline */}
          <Fade delay={0.08}>
            <h1 className="font-tau-futura font-black text-5xl sm:text-6xl lg:text-7xl text-white leading-[0.92] mb-6 tracking-tight">
              QUALITY FOOD
              <br />
              <span className="text-[#40916c]">FOR EVERYONE.</span>
            </h1>
          </Fade>

          <Fade delay={0.14}>
            <p className="text-[15px] text-white/55 max-w-lg leading-relaxed mb-8">
              A UI/UX case study for <strong className="text-white/80">TAU FOODS</strong> — 
              a South African e-commerce brand that believes in the fact that everybody 
              should have access to high quality, fresh and affordable foods. Working 
              directly with local farmers and suppliers across Mzansi.
            </p>
          </Fade>

          {/* Meta chips */}
          <Fade delay={0.18}>
            <div className="flex flex-wrap gap-3 mb-10">
              {[
                { label: 'Role', val: 'UI/UX Designer' },
                { label: 'Timeline', val: '4 Weeks' },
                { label: 'Platform', val: 'Mobile App (iOS & Android)' },
                { label: 'Country', val: 'South Africa' },
              ].map((m) => (
                <div key={m.label} className="px-4 py-2.5 rounded-xl bg-[#162b1e] border border-[#243d2c]">
                  <p className="text-[9px] uppercase tracking-[0.2em] text-white/35 mb-0.5">{m.label}</p>
                  <p className="text-xs font-semibold text-white/85">{m.val}</p>
                </div>
              ))}
            </div>
          </Fade>

          <Fade delay={0.22}>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={launch}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#74c69d] text-[#0d1a10] font-bold text-sm hover:bg-[#95d5b2] transition-colors shadow-[0_10px_30px_-10px_rgba(116,198,157,0.5)] group"
              >
                <Play className="w-4 h-4 fill-current" />
                Try Live Prototype
              </button>
              <a
                href="#overview"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#1a4d2e] text-[#74c69d] border border-[#2d6a4f] font-semibold text-sm hover:bg-[#2d6a4f] transition-all group"
              >
                View Case Study
                <ArrowDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
              </a>
            </div>
          </Fade>
        </div>

        {/* Right column — phone mockups */}
        <Fade delay={0.25} className="flex-shrink-0 relative">
          <div className="relative w-[300px] sm:w-[360px]">
            <img loading="lazy" decoding="async"
              src="/images/tau-hero-phones.webp"
              alt="TAU FOODS mobile app screens"
              className="w-full drop-shadow-2xl animate-tau-float rounded-2xl"
            />
            {/* Floating price chip */}
            <div className="absolute -bottom-4 -left-4 px-4 py-2.5 rounded-2xl bg-[#162b1e] border border-[#2d6a4f] tau-card-glow">
              <p className="text-[9px] text-white/40 uppercase tracking-widest">Today's saving</p>
              <p className="text-sm font-bold text-[#74c69d]">R 486 / household</p>
            </div>
          </div>
        </Fade>
      </div>

      {/* ── Price ticker ── */}
      <div className="relative z-10 overflow-hidden border-t border-[#243d2c] bg-[#0d1a10]/80 backdrop-blur-sm">
        <div className="flex items-stretch">
          <div className="shrink-0 px-5 py-3 bg-[#1a4d2e] text-[#74c69d] text-[10px] font-black uppercase tracking-[0.25em] flex items-center">
            Live Prices
          </div>
          <div className="overflow-hidden flex-1">
            <div className="tau-ticker-track flex whitespace-nowrap">
              {[...PRICES, ...PRICES].map((p, i) => (
                <span key={i} className="inline-flex shrink-0 items-center gap-3 px-6 py-3 text-xs text-white/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2d6a4f] shrink-0" />
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scroll cue */}
      <div className="relative z-10 flex justify-center pb-6 pt-3">
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center pt-1.5"
        >
          <div className="w-1 h-1.5 rounded-full bg-white/40" />
        </motion.div>
      </div>
    </section>
  );
}
