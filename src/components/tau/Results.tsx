import { Fade, Tag, Counter } from './shared';
import { TrendingUp, Users, Star, Wallet, ArrowUpRight } from 'lucide-react';

export default function Results() {
  return (
    <section id="tau-results" className="py-20 lg:py-28 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-5 lg:px-8">

        {/* ── CTA Banner (like Measured "Get Early Access") ── */}
        <Fade className="mb-20">
          <div className="relative rounded-3xl bg-[#0d1a10] border border-[#2d6a4f] overflow-hidden p-10 sm:p-16">
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a4d2e]/30 via-transparent to-transparent pointer-events-none" />
            <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#2d6a4f]/10 blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-xl">
              <Tag>Launch Ready</Tag>
              <h2 className="font-tau-futura font-black text-4xl sm:text-5xl text-white mt-4 mb-5 tracking-tight leading-tight">
                TASTE THE
                <br />
                DIFFERENCE.
              </h2>
              <p className="text-[15px] text-white/55 mb-8 leading-relaxed">
                Join thousands of South African households already saving on their weekly 
                shop — from Soweto to Stellenbosch. Fresh, local, affordable.
              </p>
              <div className="flex flex-wrap gap-3">
                <a href="#" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#1a4d2e] text-[#74c69d] border border-[#2d6a4f] font-bold text-sm hover:bg-[#2d6a4f] transition-all">
                  Start Shopping <ArrowUpRight className="w-4 h-4" />
                </a>
                <a href="#" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white/5 text-white/70 border border-[#243d2c] font-semibold text-sm hover:bg-white/10 transition-all">
                  Partner with Tau Foods <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </Fade>

        {/* Impact metrics */}
        <Fade className="mb-14">
          <Tag>Results & Impact</Tag>
          <h2 className="font-tau-futura font-black text-4xl sm:text-5xl text-white tracking-tight mt-4 mb-10">
            MEASURABLE IMPACT
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: TrendingUp, val: 340, suffix: '%', label: 'Increase in conversion rate', sub: 'vs. competitor average' },
              { icon: Users, val: 2.5, decimals: 1, suffix: 'M', label: 'Monthly active shoppers', sub: 'across all provinces' },
              { icon: Star, val: 4.8, decimals: 1, suffix: '/5', label: 'App Store rating', sub: 'Google Play & Apple' },
              { icon: Wallet, val: 12.4, decimals: 1, prefix: 'R', suffix: 'M', label: 'Saved by customers', sub: 'Year one total' },
            ].map((s) => (
              <div key={s.label} className="p-6 rounded-2xl bg-[#0d1a10] border border-[#243d2c] hover:border-[#2d6a4f] transition-colors group">
                <div className="w-10 h-10 rounded-xl bg-[#1a4d2e] border border-[#2d6a4f] flex items-center justify-center mb-4 group-hover:bg-[#2d6a4f] transition-colors">
                  <s.icon className="w-4 h-4 text-[#74c69d]" />
                </div>
                <p className="font-tau-futura font-black text-3xl text-white mb-1">
                  <Counter to={s.val} prefix={s.prefix ?? ''} suffix={s.suffix} decimals={s.decimals ?? 0} />
                </p>
                <p className="text-[13px] text-white/70 font-semibold">{s.label}</p>
                <p className="text-[11px] text-white/30 mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>
        </Fade>

        {/* Before / After */}
        <Fade className="mb-14">
          <div className="rounded-3xl bg-[#0d1a10] border border-[#243d2c] overflow-hidden">
            <div className="grid md:grid-cols-2">
              <div className="p-8 md:p-10 border-b md:border-b-0 md:border-r border-[#243d2c]">
                <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-[#f87171] bg-[#2a1212] border border-[#3d1a1a] px-3 py-1.5 rounded-full mb-6">
                  Before Redesign
                </span>
                <ul className="space-y-3">
                  {[
                    'Cluttered product listings with no hierarchy',
                    'Complex 7-step checkout, card payments only',
                    'No SnapScan, Ozow or Capitec Pay support',
                    'Cart abandonment rate of 78%',
                    'App crashed during load-shedding',
                    'English only — 10 languages excluded',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <div className="w-4 h-4 rounded-full bg-[#2a1212] border border-[#3d1a1a] flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[#f87171] text-[9px]">x</span>
                      </div>
                      <span className="text-[13px] text-white/60">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-8 md:p-10">
                <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-[#74c69d] bg-[#1a3d2a] border border-[#2d6a4f] px-3 py-1.5 rounded-full mb-6">
                  After Redesign
                </span>
                <ul className="space-y-3">
                  {[
                    'Clean, scannable cards with clear price hierarchy',
                    '3-step checkout with SnapScan, Ozow & Capitec Pay',
                    'SA payment methods front and centre',
                    'Cart abandonment reduced to 23%',
                    'Offline cart & SMS fallback during load-shedding',
                    'All 11 official South African languages supported',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <div className="w-4 h-4 rounded-full bg-[#1a3d2a] border border-[#2d6a4f] flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[#74c69d] text-[9px]">ok</span>
                      </div>
                      <span className="text-[13px] text-white/60">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Fade>

        {/* Key learnings */}
        <Fade>
          <p className="text-[9px] uppercase tracking-[0.35em] text-white/25 mb-6 font-semibold">Key Learnings</p>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                n: '01',
                title: 'Simplicity drives conversion',
                desc: 'Reducing checkout steps from 7 to 3 directly correlated with a 340% increase in completed purchases across all tested users.',
              },
              {
                n: '02',
                title: 'Local payment trust matters',
                desc: 'Adding SnapScan and Capitec Pay was the single highest-impact change — 67% of users cited it as the reason they completed checkout.',
              },
              {
                n: '03',
                title: 'Design for the real SA context',
                desc: 'Offline mode and low-data UI were not "nice-to-haves" — they were essential for users in load-shedding-affected and rural areas.',
              },
            ].map((l) => (
              <div key={l.n} className="p-6 rounded-2xl bg-[#0d1a10] border border-[#243d2c] flex gap-5">
                <span className="font-tau-futura font-black text-4xl text-[#1a4d2e] shrink-0 leading-none">{l.n}</span>
                <div>
                  <p className="font-semibold text-white mb-2">{l.title}</p>
                  <p className="text-[13px] text-white/50 leading-relaxed">{l.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Fade>
      </div>
    </section>
  );
}
