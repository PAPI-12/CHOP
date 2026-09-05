import { motion } from 'framer-motion';
import { Fade, Tag } from './shared';
import { TerminalSquare } from 'lucide-react';

function PythonBlock() {
  return (
    <div className="rounded-2xl overflow-hidden bg-[#06100a] border border-[#243d2c] tau-card-glow">
      <div className="flex items-center gap-2 px-5 py-3 bg-[#0d1a10] border-b border-[#243d2c]">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#de3831]/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#f4c430]/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#40916c]/80" />
        </div>
        <span className="tau-code-wrap text-[11px] text-white/30 ml-2">analysis/tau_price_audit.py</span>
        <span className="ml-auto text-[10px] px-2 py-0.5 rounded bg-[#1a4d2e] text-[#74c69d]">Python 3.11</span>
      </div>
      <pre className="tau-code-wrap p-5 text-[12px] leading-[1.8] overflow-x-auto">
<span className="cc"># ── TAU FOODS: South African grocery price audit ──────────────────────</span>{'\n'}
<span className="ck">import</span> <span className="cv">pandas</span> <span className="ck">as</span> <span className="cv">pd</span>{'\n'}
<span className="ck">import</span> <span className="cv">matplotlib.pyplot</span> <span className="ck">as</span> <span className="cv">plt</span>{'\n\n'}
<span className="cc"># Load scraped price data from 14 SA retailers (Checkers, Pick n Pay, SPAR…)</span>{'\n'}
<span className="cv">df</span> = <span className="cv">pd</span>.<span className="cf">read_csv</span>(<span className="cs">"data/sa_grocery_prices.csv"</span>){'\n'}
<span className="cv">df</span> = <span className="cv">df</span>[<span className="cv">df</span>[<span className="cs">"province"</span>].<span className="cf">isin</span>([<span className="cs">"GP"</span>, <span className="cs">"WC"</span>, <span className="cs">"KZN"</span>])]  <span className="cc"># 3 provinces</span>{'\n\n'}
<span className="cc"># Basket comparison: Tau Foods vs national retail average</span>{'\n'}
<span className="cv">baskets</span> = <span className="cv">df</span>.<span className="cf">groupby</span>(<span className="cs">"retailer"</span>)[<span className="cs">"basket_zar"</span>].<span className="cf">mean</span>(){'\n'}
<span className="cv">tau_avg</span>   = <span className="cv">baskets</span>[<span className="cs">"tau_foods"</span>]{'\n'}
<span className="cv">market_avg</span> = <span className="cv">baskets</span>.<span className="cf">drop</span>(<span className="cs">"tau_foods"</span>).<span className="cf">mean</span>(){'\n\n'}
<span className="cv">saving_pct</span> = (<span className="cv">market_avg</span> - <span className="cv">tau_avg</span>) / <span className="cv">market_avg</span>{'\n'}
<span className="cf">print</span>(<span className="cs">f"Avg. basket — Market: R</span><span className="cn">{'{'}</span><span className="cv">market_avg</span><span className="cn">:.2f{'}'}</span><span className="cs">  Tau Foods: R</span><span className="cn">{'{'}</span><span className="cv">tau_avg</span><span className="cn">:.2f{'}'}</span><span className="cs">"</span>){'\n'}
<span className="cf">print</span>(<span className="cs">f"Tau Foods is </span><span className="cn">{'{'}</span><span className="cv">saving_pct</span><span className="cn">:.0%{'}'}</span><span className="cs"> cheaper than the national average"</span>){'\n'}
<span className="cc"># → Avg. basket — Market: R1,432.60   Tau Foods: R945.20</span>{'\n'}
<span className="cc"># → Tau Foods is 34% cheaper than the national average</span>{'\n\n'}
<span className="cc"># Competitor price gap per category</span>{'\n'}
<span className="cv">gap_by_cat</span> = <span className="cv">df</span>.<span className="cf">pivot_table</span>(<span className="cs">"price_zar"</span>, <span className="cs">"category"</span>, <span className="cs">"retailer"</span>).<span className="cf">assign</span>({'\n'}
    <span className="cv">tau_saving</span>=<span className="ck">lambda</span> <span className="cv">x</span>: (<span className="cv">x</span>.<span className="cf">mean</span>(<span className="cv">axis</span>=<span className="cn">1</span>) - <span className="cv">x</span>[<span className="cs">"tau_foods"</span>]) / <span className="cv">x</span>.<span className="cf">mean</span>(<span className="cv">axis</span>=<span className="cn">1</span>)){'\n'}
).<span className="cf">sort_values</span>(<span className="cs">"tau_saving"</span>, <span className="cv">ascending</span>=<span className="ck">False</span>){'\n\n'}
<span className="cf">print</span>(<span className="cv">gap_by_cat</span>[[<span className="cs">"tau_saving"</span>]].<span className="cf">to_string</span>())
      </pre>
    </div>
  );
}

const COMPETITORS = [
  { name: 'Woolworths Food', strength: 'Premium quality', weakness: 'Very expensive', rating: 2 },
  { name: 'Checkers', strength: 'Wide range', weakness: 'Inconsistent pricing', rating: 3 },
  { name: 'Pick n Pay', strength: 'Smart Shopper loyalty', weakness: 'Limited local sourcing', rating: 3 },
  { name: 'SPAR', strength: 'Community presence', weakness: 'Franchise quality variance', rating: 3 },
  { name: 'Takealot Food', strength: 'Fast delivery', weakness: 'Very limited range', rating: 2 },
];

const PERSONAS = [
  {
    initials: 'TM',
    name: 'Thandi Mkhize',
    age: 32,
    role: 'Nurse & mother of two',
    place: 'Soweto, Gauteng',
    accent: '#74c69d',
    needs: 'Affordable, nutritious weekly staples without losing half a Saturday to taxi rides',
    pain: 'Loses R120+ in taxi fares comparing prices between stores in town',
    quote: '"I spend more time finding deals than enjoying my day off."',
  },
  {
    initials: 'AK',
    name: 'Ayesha Karriem',
    age: 41,
    role: 'Small business owner',
    place: 'Bo-Kaap, Cape Town',
    accent: '#f4c430',
    needs: 'Trusted halaal-certified produce delivered directly to her restaurant',
    pain: 'Most retailers do not clearly label halaal sourcing and certification',
    quote: '"I need to trust where my food comes from — full stop."',
  },
  {
    initials: 'PM',
    name: 'Pieter van der Merwe',
    age: 23,
    role: 'University student',
    place: 'Stellenbosch, Western Cape',
    needs: 'Fresh, healthy food on a strict NSFAS-sized monthly budget',
    pain: 'Eats instant noodles because fresh vegetables feel financially out of reach',
    accent: '#f87171',
    quote: '"Healthy eating feels like a luxury I can\'t afford right now."',
  },
];

export default function Research() {
  return (
    <section id="tau-research" className="py-20 lg:py-28 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-5 lg:px-8">

        {/* Header */}
        <Fade className="mb-14">
          <Tag>Research & Discovery</Tag>
          <h2 className="font-tau-futura font-black text-4xl sm:text-5xl text-white tracking-tight mt-4">
            DEEP UNDERSTANDING
            <br />
            OF THE SA SHOPPER.
          </h2>
        </Fade>

        {/* Competitor analysis */}
        <Fade className="mb-14">
          <p className="text-[9px] uppercase tracking-[0.35em] text-white/25 mb-5 font-semibold">Competitor Analysis</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {COMPETITORS.map((c) => (
              <div key={c.name} className="p-5 rounded-2xl bg-[#0d1a10] border border-[#243d2c]">
                <p className="text-[12px] font-bold text-white/85 mb-3">{c.name}</p>
                <div className="space-y-2 mb-3">
                  <div className="flex items-start gap-1.5">
                    <span className="text-[#74c69d] text-[10px] mt-0.5">✓</span>
                    <span className="text-[11px] text-white/50">{c.strength}</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-[#f87171] text-[10px] mt-0.5">✕</span>
                    <span className="text-[11px] text-white/50">{c.weakness}</span>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full ${i < c.rating ? 'bg-[#40916c]' : 'bg-[#243d2c]'}`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Fade>

        {/* Python analysis */}
        <Fade className="mb-14">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-9 h-9 rounded-xl bg-[#1a4d2e] border border-[#2d6a4f] flex items-center justify-center shrink-0">
              <TerminalSquare className="w-4 h-4 text-[#74c69d]" />
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-[0.35em] text-white/25 font-semibold">Quantitative Analysis</p>
              <p className="text-sm text-white/60 mt-0.5">14 retailers · 3 provinces · analysed with Python / pandas</p>
            </div>
          </div>
          <PythonBlock />
        </Fade>

        {/* In-depth interviews */}
        <Fade className="mb-14">
          <p className="text-[9px] uppercase tracking-[0.35em] text-white/25 mb-5 font-semibold">In-Depth Interviews · 18 participants</p>
          <div className="grid md:grid-cols-3 gap-4">
            {PERSONAS.map((p) => (
              <div key={p.name} className="p-6 rounded-2xl bg-[#0d1a10] border border-[#243d2c] hover:border-[#2d6a4f] transition-colors">
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black text-[#0a0a0a]"
                    style={{ background: p.accent }}
                  >
                    {p.initials}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{p.name}</p>
                    <p className="text-[11px] text-white/40">{p.age} · {p.role}</p>
                    <p className="text-[10px] text-white/25 mt-0.5">{p.place}</p>
                  </div>
                </div>
                <blockquote className="text-[12px] text-white/50 italic border-l-2 pl-3 mb-4" style={{ borderColor: p.accent }}>
                  {p.quote}
                </blockquote>
                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl bg-[#162b1e] border border-[#243d2c]">
                    <p className="text-[9px] text-[#74c69d] uppercase tracking-widest mb-1">Needs</p>
                    <p className="text-[12px] text-white/65">{p.needs}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#2a1212] border border-[#3d1a1a]">
                    <p className="text-[9px] text-[#f87171] uppercase tracking-widest mb-1">Pain Point</p>
                    <p className="text-[12px] text-white/65">{p.pain}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Fade>

        {/* Job Stories */}
        <Fade>
          <p className="text-[9px] uppercase tracking-[0.35em] text-white/25 mb-5 font-semibold">Job Stories · Customer Journey Map</p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-6 rounded-2xl bg-[#0d1a10] border border-[#243d2c]">
              <p className="text-[11px] text-[#74c69d] uppercase tracking-widest mb-3">Job Stories</p>
              <div className="space-y-4">
                {[
                  {
                    when: 'When I run out of maize meal on a Sunday night',
                    i: 'I want to order it from my phone immediately',
                    so: 'So I can avoid a Monday morning panic and extra taxi fare',
                  },
                  {
                    when: 'When I need to feed my family on a tight month-end budget',
                    i: 'I want to see exactly what the best value meal combos are',
                    so: 'So I can stretch every rand without sacrificing nutrition',
                  },
                ].map((j, i) => (
                  <div key={i} className="text-[12px] space-y-1 pb-4 border-b border-[#243d2c] last:border-0 last:pb-0">
                    <p><span className="text-white/30">WHEN</span> <span className="text-white/70">{j.when}</span></p>
                    <p><span className="text-white/30">I WANT TO</span> <span className="text-white/70">{j.i}</span></p>
                    <p><span className="text-white/30">SO THAT</span> <span className="text-[#74c69d]">{j.so}</span></p>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 rounded-2xl bg-[#0d1a10] border border-[#243d2c]">
              <p className="text-[11px] text-[#74c69d] uppercase tracking-widest mb-3">Customer Journey · Key Touchpoints</p>
              <div className="relative">
                {/* Journey stages */}
                <div className="flex justify-between mb-3">
                  {['Aware', 'Consider', 'Order', 'Receive', 'Return'].map((s) => (
                    <div key={s} className="text-center flex-1">
                      <div className="w-6 h-6 rounded-full bg-[#1a4d2e] border border-[#2d6a4f] flex items-center justify-center mx-auto mb-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#74c69d]" />
                      </div>
                      <p className="text-[9px] text-white/40">{s}</p>
                    </div>
                  ))}
                </div>
                {/* Connecting line */}
                <div className="absolute top-3 left-3 right-3 h-px bg-[#243d2c]" />
                {/* Emotion curve */}
                <div className="mt-4 space-y-2">
                  {[
                    { stage: 'Aware', feeling: 'Curious about affordable options', mood: '😐', score: 50 },
                    { stage: 'Consider', feeling: 'Comparing prices — feels daunting', mood: '😟', score: 30 },
                    { stage: 'Order', feeling: 'Easy app, fast checkout = relief', mood: '😊', score: 75 },
                    { stage: 'Receive', feeling: 'Fresh produce delivered — delighted', mood: '😄', score: 90 },
                  ].map((e) => (
                    <div key={e.stage} className="flex items-center gap-3">
                      <span className="text-sm w-5">{e.mood}</span>
                      <div className="flex-1 h-1.5 bg-[#162b1e] rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-[#2d6a4f] to-[#74c69d] rounded-full"
                          initial={{ width: 0 }}
                          whileInView={{ width: `${e.score}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                        />
                      </div>
                      <p className="text-[10px] text-white/40 w-28 text-right">{e.feeling}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Fade>
      </div>
    </section>
  );
}
