import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Fade, Tag } from './shared';
import { Ruler, MousePointerClick, Layers, Banknote, Play, Sparkles } from 'lucide-react';
import { usePrototype } from './prototype/PrototypeContext';

/*
 * The original TAU FOODS case study is hosted on Wix as a single tall PNG
 * (1161 x 10394). The design boards occupy roughly the bottom third of that
 * image, so we crop that band with a translated, overflow-hidden frame and
 * present Papi Raborife's original artwork unedited.
 */
const ORIGINAL_BOARDS =
  'https://static.wixstatic.com/media/bd194a_09ffd087c44f40d3b2a1a0b8457a6191~mv2.png';

// The design boards close out the source image, so the stage is anchored to
// the bottom edge. This guarantees the final artwork is always in frame.
const BAND_HEIGHT = 31.5; // % of source height shown in the stage
const ASPECT = `1161 / ${Math.round(10394 * (BAND_HEIGHT / 100))}`;

function OriginalBoards() {
  const stageRef = useRef<HTMLDivElement>(null);
  const inView = useInView(stageRef, { once: true, margin: '-80px' });

  return (
    <div
      ref={stageRef}
      className="relative rounded-[2rem] overflow-hidden border border-[#243d2c] bg-black"
      style={{ aspectRatio: ASPECT }}
    >
      {/* Ambient stage lighting behind the boards */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(26,77,46,0.55),transparent_60%)]" />
      <motion.img
        src={ORIGINAL_BOARDS}
        alt="Original TAU FOODS high-fidelity design boards by Papi Raborife"
        referrerPolicy="no-referrer"
        loading="lazy"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.9, ease: 'easeOut' }}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
        }}
        className="select-none pointer-events-none"
      />
      {/* Soft edge fades so the crop reads as a deliberate stage */}
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

      <div className="absolute left-4 top-4 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur border border-white/10 text-[10px] uppercase tracking-[0.2em] text-[#74c69d] font-bold">
        Original boards - unedited
      </div>
    </div>
  );
}

export default function Design() {
  const { launch } = usePrototype();
  return (
    <section id="tau-design" className="py-20 lg:py-28 bg-[#0d1a10] relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(26,77,46,0.35),transparent_42%)] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[520px] h-[520px] rounded-full bg-[#1a4d2e]/20 blur-[110px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-5 lg:px-8">
        {/* Header, mirroring the original THE DESIGN composition */}
        <Fade className="mb-14">
          <Tag>The Design</Tag>
          <div className="mt-4 grid lg:grid-cols-[0.9fr_1.1fr] gap-10 items-end">
            <div>
              <h2 className="font-tau-futura font-black text-5xl sm:text-7xl text-[#2e9e5b] tracking-tight leading-[0.88]">
                THE
                <br />
                DESIGN
              </h2>
            </div>
            <p className="text-[15px] text-white/60 leading-relaxed lg:pb-2">
              Regarding the interface, commands were made clearly visible with the use of
              the <span className="text-[#40916c] font-semibold">dark green</span> derived
              from the CI colour palette. A combination of these methods results in an
              impactful, user-friendly product - presented here exactly as originally
              designed, on the real 393 x 852 mobile canvas.
            </p>
          </div>
        </Fade>

        {/* Launch the interactive prototype */}
        <Fade className="mb-10">
          <div className="relative overflow-hidden rounded-3xl border border-[#2d6a4f] bg-gradient-to-r from-[#0f2617] via-[#122d1c] to-[#0d1a10] p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="absolute -right-24 -top-24 w-72 h-72 rounded-full bg-[#40916c]/15 blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1a4d2e] border border-[#2d6a4f] mb-3">
                <Sparkles className="w-3 h-3 text-[#74c69d]" />
                <span className="text-[10px] uppercase tracking-widest font-bold text-[#74c69d]">Fully Interactive</span>
              </div>
              <p className="font-tau-futura font-black text-2xl sm:text-3xl text-white tracking-tight leading-tight">
                Try the Tau Foods prototype
              </p>
              <p className="text-sm text-white/55 mt-1.5 max-w-md">
                Sign in, browse the store, add groceries, apply <span className="font-mono text-[#74c69d]">TAU10</span>, pick a
                South African payment method and place a real order — no download required.
              </p>
            </div>
            <button
              type="button"
              onClick={launch}
              className="relative shrink-0 inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#74c69d] text-[#0d1a10] font-bold text-sm hover:bg-[#95d5b2] transition-colors shadow-[0_10px_30px_-10px_rgba(116,198,157,0.6)]"
            >
              <Play className="w-4 h-4 fill-current" />
              Launch Prototype
            </button>
          </div>
        </Fade>

        {/* The original artwork */}
        <Fade>
          <div className="grid lg:grid-cols-[0.72fr_1.28fr] gap-10 items-start">
            {/* Left rail: design notes */}
            <div className="space-y-5 lg:sticky lg:top-24">
              <div className="p-6 rounded-2xl bg-[#0a0a0a] border border-[#243d2c]">
                <p className="text-[10px] uppercase tracking-[0.22em] text-[#74c69d] font-bold mb-4">
                  What the boards show
                </p>
                <ul className="space-y-3 text-[13px] text-white/55">
                  {[
                    'Welcome splash with the lion mark and produce scatter',
                    'Store screen - Vegetables hero, yellow category cards, Chicken feature',
                    'Recipes screen with All / Vegan / Keto filtering',
                    'Onboarding, live chat, voice search and sign-in flows',
                    'Full isometric system view of 20+ final screens',
                  ].map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 bg-[#40916c]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-6 rounded-2xl bg-[#0a0a0a] border border-[#243d2c]">
                <p className="text-[10px] uppercase tracking-[0.22em] text-[#74c69d] font-bold mb-4">
                  CI palette in use
                </p>
                <div className="space-y-2.5">
                  {[
                    ['#1A4D2E', 'Primary - commands & CTAs'],
                    ['#2E9E5B', 'Display - headlines'],
                    ['#F0D24B', 'Accent - category cards'],
                    ['#F9F9F7', 'Canvas - app surfaces'],
                  ].map(([hex, label]) => (
                    <div key={hex} className="flex items-center gap-3">
                      <span
                        className="w-7 h-7 rounded-lg border border-white/10 shrink-0"
                        style={{ backgroundColor: hex }}
                      />
                      <div>
                        <p className="text-[12px] text-white/75">{label}</p>
                        <p className="text-[10px] font-mono text-white/30">{hex}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: the original boards, unedited */}
            <OriginalBoards />
          </div>
        </Fade>

        {/* Spec strip */}
        <Fade className="mt-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: Ruler,
                label: 'Mobile canvas',
                value: '393 x 852 pt',
                detail: 'iPhone 14 Pro / 15 / 16 Pro design size',
              },
              {
                icon: MousePointerClick,
                label: 'Touch target',
                value: '44 x 44 pt',
                detail: 'Minimum accessible interaction area',
              },
              {
                icon: Layers,
                label: 'Final screens',
                value: '20+',
                detail: 'Covered across the isometric system view',
              },
              {
                icon: Banknote,
                label: 'Price format',
                value: 'R764.94/mo',
                detail: 'South African Rand, as designed',
              },
            ].map((s) => (
              <div
                key={s.label}
                className="group p-5 rounded-2xl bg-[#0a0a0a] border border-[#243d2c] hover:border-[#2d6a4f] transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-[#1a4d2e] border border-[#2d6a4f] flex items-center justify-center mb-4 group-hover:bg-[#2d6a4f] transition-colors">
                  <s.icon className="w-4 h-4 text-[#74c69d]" />
                </div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/30">{s.label}</p>
                <p className="font-tau-futura font-bold text-xl text-[#74c69d] mt-1.5">{s.value}</p>
                <p className="text-[11px] text-white/45 mt-1">{s.detail}</p>
              </div>
            ))}
          </div>
        </Fade>
      </div>
    </section>
  );
}
