import { Fade, Tag, TauLogo } from './shared';
import { MapPin } from 'lucide-react';

export default function Overview() {
  return (
    <section id="tau-overview" className="py-20 lg:py-28 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-5 lg:px-8">

        {/* ── TAUFOODS mobile app ── */}
        <Fade className="mb-20">
          <div className="relative rounded-3xl overflow-hidden bg-[#0d1a10] border border-[#243d2c] tau-card-glow">
            {/* Greenhouse image strip */}
            <div className="relative h-56 sm:h-72 overflow-hidden">
              <img loading="lazy" decoding="async"
                src="/images/tau-greenhouse.webp"
                alt="South African greenhouse — local farming"
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0d1a10] via-[#0d1a10]/60 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d1a10] via-transparent to-transparent" />

              {/* Logo overlay */}
              <div className="absolute top-6 left-6 flex items-center gap-3">
                <TauLogo size={44} />
                <div>
                  <p className="font-tau-futura font-black text-xl text-white tracking-tight">TAU FOODS</p>
                  <p className="text-[11px] text-[#74c69d]">MOBILE APP</p>
                </div>
              </div>

              {/* Phone mockup strip */}
              <div className="absolute right-0 top-0 bottom-0 w-64 sm:w-80">
                <img loading="lazy" decoding="async"
                  src="/images/tau-hero-phones.webp"
                  alt="TAU FOODS app screens"
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#0d1a10]/80" />
              </div>
            </div>

            {/* Mission text */}
            <div className="p-8 grid md:grid-cols-2 gap-8">
              <div>
                <Tag>Mission Statement</Tag>
                <p className="mt-4 text-[15px] text-white/65 leading-relaxed">
                  TAU FOODS is an e-commerce brand that believes in the fact that 
                  everybody should have access to high quality, fresh and affordable foods.
                </p>
                <p className="mt-3 text-[15px] text-white/65 leading-relaxed">
                  Tau Foods carries out this mission by bringing locally sourced products to 
                  consumers through working directly with local farmers and suppliers, ensuring 
                  products are of the best quality while prioritising ethical and sustainable 
                  practices in everything they do.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <div className="p-4 rounded-2xl bg-[#162b1e] border border-[#243d2c]">
                  <p className="text-[10px] uppercase tracking-widest text-[#74c69d] mb-1">Pay your way</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {['SnapScan', 'Ozow', 'Capitec Pay', 'Zapper', 'EFT', 'Lay-bye'].map((p) => (
                      <span key={p} className="px-2.5 py-1 rounded-lg bg-[#1a4d2e] border border-[#2d6a4f] text-[11px] text-[#74c69d]">{p}</span>
                    ))}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-[#162b1e] border border-[#243d2c]">
                  <p className="text-[10px] uppercase tracking-widest text-[#74c69d] mb-2">Delivery areas</p>
                  <div className="flex flex-wrap gap-2">
                    {['Johannesburg', 'Soweto', 'Cape Town', 'Khayelitsha', 'Durban', 'Pretoria', 'Gqeberha'].map((c) => (
                      <span key={c} className="flex items-center gap-1 text-[11px] text-white/55">
                        <MapPin className="w-2.5 h-2.5 text-[#40916c]" />{c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Fade>

        {/* ── Typography & Tones ── */}
        <Fade className="mb-20">
          <p className="text-[9px] uppercase tracking-[0.35em] text-white/25 mb-6 font-semibold">Typography / Tones</p>
          <div className="grid md:grid-cols-2 gap-5">
            {/* Colour palette */}
            <div className="p-6 rounded-2xl bg-[#0d1a10] border border-[#243d2c]">
              <p className="text-xs text-white/40 mb-4">Colour palette</p>
              <div className="flex gap-3">
                {[
                  { hex: '#1a4d2e', name: 'Forest' },
                  { hex: '#2d6a4f', name: 'Green' },
                  { hex: '#40916c', name: 'Emerald' },
                  { hex: '#74c69d', name: 'Sage' },
                  { hex: '#d8f3dc', name: 'Mist' },
                  { hex: '#ffffff', name: 'White', border: true },
                ].map((c) => (
                  <div key={c.name} className="flex-1 text-center">
                    <div
                      className={`w-full h-10 rounded-xl mb-1.5 ${c.border ? 'border border-white/20' : ''}`}
                      style={{ background: c.hex }}
                    />
                    <p className="text-[9px] text-white/40">{c.name}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Futura type specimen */}
            <div className="p-6 rounded-2xl bg-[#0d1a10] border border-[#243d2c]">
              <p className="text-xs text-white/40 mb-3">Primary typeface</p>
              <p className="font-tau-futura text-5xl font-black text-white leading-none mb-2">Futura</p>
              <div className="flex gap-4 text-white/50 text-sm mb-3">
                {['Aa', 'Aa', 'Aa'].map((a, i) => (
                  <span key={i} className={`font-tau-futura ${i === 0 ? 'font-light' : i === 1 ? 'font-normal' : 'font-bold'}`}>{a}</span>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 text-[11px] text-white/40">
                {['Light', 'Book', 'Medium', 'Bold', '14px', '18px', '24px', '36px', '48px', '72px'].map((s) => (
                  <span key={s} className="px-2 py-0.5 rounded bg-[#162b1e]">{s}</span>
                ))}
              </div>
            </div>
          </div>
        </Fade>

        {/* ── Our Problem ── */}
        <Fade>
          <div className="relative rounded-3xl bg-[#0d1a10] border border-[#243d2c] overflow-hidden p-8 md:p-12">
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a4d2e]/20 to-transparent pointer-events-none" />

            {/* Isometric illustration placeholder */}
            <div className="absolute right-0 bottom-0 w-64 h-64 opacity-20 pointer-events-none">
              <svg viewBox="0 0 200 200" fill="none" className="w-full h-full">
                {/* Simple isometric field / farmer silhouette */}
                <ellipse cx="100" cy="160" rx="80" ry="20" fill="#2d6a4f" opacity="0.5"/>
                <rect x="80" y="80" width="40" height="80" rx="4" fill="#1a4d2e"/>
                <circle cx="100" cy="70" r="20" fill="#2d6a4f"/>
                <rect x="60" y="110" width="15" height="30" rx="3" fill="#40916c" opacity="0.7"/>
                <rect x="125" y="110" width="15" height="30" rx="3" fill="#40916c" opacity="0.7"/>
              </svg>
            </div>

            <div className="relative max-w-xl">
              <Tag>Our Problem</Tag>
              <h2 className="font-tau-futura font-black text-3xl sm:text-4xl text-white mt-4 mb-5 leading-tight tracking-tight">
                SUFFICIENT FOOD IS A BASIC RIGHT FOR ALL.
              </h2>
              <p className="text-[15px] text-white/60 leading-relaxed mb-6">
                Yet accessibility and affordability often hinder this basic right. 
                Millions of South Africans cannot access quality, fresh produce — 
                not because it doesn&apos;t exist, but because supply chains, distance, 
                and price mark-ups keep it out of reach.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { stat: '1 in 5', desc: 'South Africans face food insecurity' },
                  { stat: '78%', desc: 'live more than 5km from a fresh market' },
                  { stat: 'R486', desc: 'avg. monthly overspend on groceries' },
                  { stat: '34%', desc: 'cheaper than major retail chains' },
                ].map((s) => (
                  <div key={s.stat} className="p-4 rounded-xl bg-[#162b1e] border border-[#243d2c]">
                    <p className="font-tau-futura font-black text-2xl text-[#74c69d]">{s.stat}</p>
                    <p className="text-[11px] text-white/50 mt-1">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Fade>
      </div>
    </section>
  );
}
