import { Fade, Tag } from './shared';

const WEEKS = [
  {
    num: '01',
    label: 'Week 1',
    color: 'tau-week-1',
    accent: '#74c69d',
    tasks: [
      'Competitor Analysis',
      'User Surveys',
      'Interview Preparation',
    ],
  },
  {
    num: '02',
    label: 'Week 2',
    color: 'tau-week-2',
    accent: '#60a5fa',
    tasks: [
      'User Interviews',
      'Job Stories',
      'Customer Journey Map',
      'Information Architecture',
    ],
  },
  {
    num: '03',
    label: 'Week 3',
    color: 'tau-week-3',
    accent: '#fbbf24',
    tasks: [
      'User Flow',
      'Kano Model',
      'Lo-Fi Prototyping',
      'User Testing',
    ],
  },
  {
    num: '04',
    label: 'Week 4',
    color: 'tau-week-4',
    accent: '#f87171',
    tasks: [
      'Design UI Kit',
      'Structuring',
      'Hi-Fi Prototyping',
      'Final Handoff',
    ],
  },
];

const RESEARCH_STATS = [
  { pct: '93%', label: 'of all respondents', sub: 'feel that food is unaffordable', icon: '01' },
  { pct: '88%', label: 'of all respondents', sub: 'worry about nutritional quality', icon: '02' },
  { pct: '81%', label: 'of all respondents', sub: 'spend over R1,500/mo on groceries', icon: '03' },
  { pct: '76%', label: 'of all respondents', sub: 'would prefer buying from local farmers', icon: '04' },
  { pct: '71%', label: 'of all respondents', sub: 'shop groceries using their phone', icon: '05' },
  { pct: '64%', label: 'of all respondents', sub: 'are frustrated by hidden delivery costs', icon: '06' },
];

export default function Scope() {
  return (
    <section id="tau-scope" className="py-20 lg:py-28 bg-[#0d1a10]">
      <div className="max-w-7xl mx-auto px-5 lg:px-8">

        {/* Header */}
        <Fade className="mb-14">
          <Tag>Scope</Tag>
          <div className="mt-4 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <h2 className="font-tau-futura font-black text-4xl sm:text-5xl text-white tracking-tight">
              THE PROCESS
            </h2>
            <p className="text-[14px] text-white/50 max-w-md leading-relaxed">
              The application design process consisted of qualitative research, 
              quantitative research, prototyping, and interface design. Different UX 
              techniques were used to offer users the best solutions to their problems.
            </p>
          </div>
        </Fade>

        {/* Week cards */}
        <Fade className="mb-20">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {WEEKS.map((w, i) => (
              <div
                key={w.num}
                className={`p-6 rounded-2xl border ${w.color} relative overflow-hidden`}
              >
                {/* Week number watermark */}
                <span
                  className="absolute -right-3 -top-4 font-tau-futura font-black text-8xl opacity-[0.06] leading-none select-none"
                  style={{ color: w.accent }}
                >
                  {w.num}
                </span>

                <p className="text-[9px] uppercase tracking-[0.25em] mb-1" style={{ color: w.accent }}>
                  {w.label}
                </p>
                <ul className="space-y-2 mt-3">
                  {w.tasks.map((t) => (
                    <li key={t} className="flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: w.accent }} />
                      <span className="text-[13px] text-white/75">{t}</span>
                    </li>
                  ))}
                </ul>

                {/* connector arrow for all except last */}
                {i < WEEKS.length - 1 && (
                  <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M6 3l5 5-5 5" stroke="#243d2c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Fade>

        {/* ── User Survey ── */}
        <Fade className="mb-6">
          <p className="text-[9px] uppercase tracking-[0.35em] text-white/25 mb-6 font-semibold">User Survey · 540 Respondents — Gauteng · Western Cape · KwaZulu-Natal</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {RESEARCH_STATS.map((s) => (
              <div key={s.pct} className="p-5 rounded-2xl bg-[#0a0a0a] border border-[#243d2c] flex items-start gap-4">
                <span className="text-2xl">{s.icon}</span>
                <div>
                  <p className="font-tau-futura font-black text-2xl text-[#74c69d]">{s.pct}</p>
                  <p className="text-[11px] text-white/40 mt-0.5">{s.label}</p>
                  <p className="text-[12px] text-white/70 mt-1">{s.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </Fade>
      </div>
    </section>
  );
}
