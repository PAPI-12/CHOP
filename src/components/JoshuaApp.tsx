import { useState, useRef } from "react";

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const heroRef = useRef<HTMLDivElement>(null);

  const handleHeroMove = (e: React.MouseEvent) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#F6F1EB] selection:bg-[#CDA99E] selection:text-black antialiased overflow-x-clip">
      {/* noise texture */}
      <div
        className="pointer-events-none fixed inset-0 z-[100] opacity-[0.04] mix-blend-soft-light"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* HERO — Replicating the screenshot style */}
      <section
        ref={heroRef}
        onMouseMove={handleHeroMove}
        className="relative w-full bg-[#050505] px-[3vw] md:px-[1.2vw] pt-6 md:pt-8 pb-6 md:pb-8 select-none"
      >
        {/* TOP ROW: CINEMA + small caption */}
        <div className="flex flex-col md:flex-row md:items-start">
          <h1
            style={{ fontFamily: "'Anton', sans-serif" }}
            className="text-[22vw] md:text-[14.8vw] leading-[0.85] tracking-[-0.03em] uppercase text-[#F6F1EB]"
          >
            CINEMA
          </h1>
          <div className="md:ml-[2.2vw] mt-1 md:mt-[1.8vw] max-w-[220px] md:max-w-[200px] shrink-0">
            <p className="font-mono text-[10.5px] md:text-[10px] leading-[1.5] tracking-[0.04em] text-white/70">
              Experienced high-end cinematographer based in Johannesburg. Collaborative eye for music and culture.
              <br />
              <span className="mt-2 inline-flex gap-1.5 items-center text-white/40">
                <span className="h-px w-6 bg-white/20" /> SA / GLOBAL
              </span>
            </p>
          </div>
        </div>

        {/* SECOND ROW: TOGRAPHER */}
        <h1
          style={{ fontFamily: "'Anton', sans-serif" }}
          className="text-[22vw] md:text-[14.8vw] leading-[0.84] tracking-[-0.03em] uppercase text-[#F6F1EB] -mt-[1.2vw] md:-mt-[0.8vw]"
        >
          TOGRAPHER
        </h1>

        {/* THIRD ROW: from + JOHANNESBURG with masked video */}
        <div className="mt-[1.5vw] md:mt-[0.5vw] flex items-baseline gap-[2.5vw] md:gap-[1.2vw] leading-none">
          <span
            style={{ fontFamily: "'Instrument Serif', serif" }}
            className="italic text-[16vw] md:text-[7.2vw] tracking-[-0.03em] text-[#CDA99E] -translate-y-[1.5vw] md:-translate-y-[0.5vw] font-light"
          >
            from
          </span>
          <span
            style={{
              fontFamily: "'Anton', sans-serif",
              backgroundImage: `url('https://img.youtube.com/vi/VUCKP8Z2frQ/maxresdefault.jpg')`,
              backgroundPosition: `${mousePos.x}% ${mousePos.y}%`,
              backgroundSize: "125%",
            }}
            className="bg-clip-text text-transparent uppercase text-[19vw] md:text-[11.5vw] tracking-[-0.02em] leading-[0.86] transition-[background-position] duration-700 ease-out"
          >
            JOHANNESBURG
          </span>
        </div>

        {/* Sub label under hero like in screenshot floating */}
        <div className="mt-4 md:mt-2 flex justify-between items-end px-1">
          <div className="flex items-center gap-2 text-[10px] font-mono tracking-widest uppercase text-white/40">
            <span className="inline-block h-[6px] w-[6px] rounded-full bg-[#2EF1A0] animate-pulse" />
            Selected Music Film — 006
          </div>
          <div className="hidden md:block font-mono text-[10px] tracking-widest uppercase text-white/25">
            ( SCROLL FOR CASE STUDY )
          </div>
        </div>
      </section>

      {/* VIDEO SHOWCASE — Rounded card like screenshot */}
      <section className="px-[2.2vw] md:px-[0.8vw] pb-[2vw]">
        <div className="relative w-full overflow-hidden rounded-[16px] md:rounded-[22px] bg-[#111] aspect-[16/12] md:aspect-[16/8.2] group border border-white/5">
          {/* Thumbnail / Video */}
          {!isPlaying ? (
            <>
              <img loading="lazy" decoding="async"
                src="https://img.youtube.com/vi/VUCKP8Z2frQ/maxresdefault.jpg"
                alt="Joshua The I AM - OTR thumbnail"
                className="absolute inset-0 h-full w-full object-cover scale-[1.02] group-hover:scale-100 transition-transform duration-[1.8s] ease-[cubic-bezier(0.16,1,0.3,1)]"
              />
              {/* warm overlay to match reference */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/20" />
              <div className="absolute inset-0 bg-[#FF5A1F]/10 mix-blend-color" />
              {/* vignette */}
              <div className="absolute inset-0 opacity-60" style={{ background: `radial-gradient(80% 80% at 50% 10%, transparent, black)` }} />

              {/* Center Play */}
              <button
                onClick={() => setIsPlaying(true)}
                className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 group/play"
              >
                <div className="relative flex h-[72px] w-[72px] md:h-[92px] md:w-[92px] items-center justify-center rounded-full bg-white text-black shadow-[0_0_0_1px_rgba(255,255,255,0.2),0_20px_40px_rgba(0,0,0,0.6)] transition-all duration-500 group-hover/play:scale-[1.05] group-hover/play:shadow-[0_0_0_12px_rgba(255,255,255,0.1),0_20px_60px_rgba(0,0,0,0.8)]">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="translate-x-[2px]">
                    <path d="M8 5.14v14l11-7-11-7z" />
                  </svg>
                </div>
                <div className="mt-4 text-center font-mono text-[10px] tracking-[0.2em] uppercase text-white/80 opacity-0 translate-y-2 group-hover/play:opacity-100 group-hover/play:translate-y-0 transition-all duration-500">
                  Play Film — 3:42
                </div>
              </button>

              {/* Frame number aesthetic */}
              <div className="absolute right-5 top-5 font-mono text-[10px] tracking-widest text-white/40 border border-white/10 rounded-full px-3 py-1 bg-black/30 backdrop-blur">
                ● REC • RED KOMODO 6K • 24mm
              </div>
            </>
          ) : (
            <iframe
              className="absolute inset-0 h-full w-full"
              src="https://www.youtube.com/embed/VUCKP8Z2frQ?autoplay=1&rel=0&modestbranding=1"
              title="Joshua The I AM - OTR"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}

          {/* Bottom metadata bar — like CRISP Commercial Ad in screenshot */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex items-end justify-between p-4 md:p-7 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
            <div className="flex items-end gap-4 md:gap-8">
              <div>
                <div className="font-mono text-[11px] md:text-[12px] font-bold tracking-[0.15em] uppercase text-white">Joshua The I AM</div>
                <div style={{ fontFamily: "'Instrument Serif', serif" }} className="italic text-[18px] md:text-[22px] leading-none text-white/70 -mt-0.5">OTR — Official Music Video</div>
              </div>
              <div className="hidden md:block h-8 w-px bg-white/15" />
              <div className="hidden md:block">
                <div className="font-mono text-[9px] tracking-widest uppercase text-white/40">Music Film</div>
                <div className="font-mono text-[11px] tracking-widest uppercase text-white/80">2023 / JHB</div>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-white/10 backdrop-blur grid place-items-center border border-white/10">
                <span className="font-mono text-[10px] text-white">HD</span>
              </div>
              <div className="font-mono text-[10px] tracking-widest text-white/50 max-w-[120px] leading-[1.3] text-right">
                Original link<br />
                <a href="https://youtu.be/VUCKP8Z2frQ" target="_blank" className="pointer-events-auto text-white underline decoration-white/30 underline-offset-4 hover:decoration-white">youtu.be/VUCKP8Z2frQ</a>
              </div>
            </div>
          </div>
        </div>

        {/* Thin progress line */}
        <div className="mt-3 flex items-center gap-3 px-1">
          <div className="h-px flex-1 bg-white/10">
            <div className="h-px w-[38%] bg-white" />
          </div>
          <span className="font-mono text-[9px] tracking-widest text-white/30">006 / 010 — SELECTED WORKS</span>
        </div>
      </section>

      {/* PROJECT STORY */}
      <section className="grid grid-cols-12 gap-y-10 px-[5vw] md:px-[1.2vw] py-10 md:py-20 border-t border-white/5">
        {/* Left large narrative */}
        <div className="col-span-12 md:col-span-7 pr-0 md:pr-[6vw]">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-12 bg-white/20" />
            <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/40">Case Study</span>
          </div>

          <h2
            style={{ fontFamily: "'Anton', sans-serif" }}
            className="text-[11vw] md:text-[5.2vw] leading-[0.9] tracking-[-0.03em] uppercase text-[#F6F1EB]"
          >
            On The Run <br />
            <span style={{ fontFamily: "'Instrument Serif', serif" }} className="normal-case italic text-[#CDA99E] font-light tracking-[-0.02em] text-[12vw] md:text-[5.8vw]">with no apologies</span>
          </h2>

          <div className="mt-8 md:mt-10 space-y-5 text-[15px] md:text-[17px] leading-[1.6] text-white/70 max-w-[56ch] font-light">
            <p>
              This is a video I shot for an artist known as <span className="text-white">Joshua The I AM</span>. He was a finalist on a South African Hip-Hop show known as <span className="text-white">The Hustle</span> — raw, hungry, and completely unfiltered.
            </p>
            <p>
              For this job I teamed up with a very talented Director, <span className="text-white font-medium">Jono Kyriakou</span>, and we built a world that feels like memory and midnight at the same time. Low-key neon, handheld intimacy, and hard-punching anamorphic flares to match the track's energy.
            </p>
            <p className="text-white/90 font-medium">
              We shot OTR mostly at night in inner-city Joburg. One RED, two practicals, and a lot of movement. It was about keeping it real — no big set, just rhythm and light.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-4 md:gap-6 border-t border-white/10 pt-6">
            {[
              { k: "Look", v: "Anamorphic bokeh + sodium vapor + cold fill" },
              { k: "Movement", v: "Handheld, Easyrig, subtle push-ins on verses" },
              { k: "Lens", v: "24mm / 50mm Cooke Panchro wide open" },
            ].map((item) => (
              <div key={item.k}>
                <div className="font-mono text-[9px] tracking-[0.2em] uppercase text-white/30 mb-2">{item.k}</div>
                <div className="text-[12px] md:text-[13px] leading-[1.4] text-white/70">{item.v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right meta */}
        <div className="col-span-12 md:col-span-5 md:border-l md:border-white/10 md:pl-[3vw]">
          <div className="sticky top-[60px]">
            <div className="rounded-[16px] bg-[#0F0F0F] border border-white/10 p-6 md:p-7">
              <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-white/30 mb-6">Project Details</div>

              <div className="space-y-5">
                {[
                  { label: "Artist", value: "Joshua The I AM" },
                  { label: "Track", value: "OTR (On The Run)" },
                  { label: "Director", value: "Jono Kyriakou" },
                  { label: "Cinematographer", value: "Papi Raborife" },
                  { label: "Year / Location", value: "2023 — Johannesburg, ZA" },
                  { label: "Format", value: "RED Komodo 6K / 2:1 / 24fps" },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between gap-4 border-b border-white/[0.06] pb-4 last:border-0 last:pb-0">
                    <span className="font-mono text-[10px] tracking-widest uppercase text-white/35 shrink-0 pt-0.5">{row.label}</span>
                    <span className="text-right text-[13px] md:text-[14px] leading-[1.3] text-white/85">{row.value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex gap-2">
                <a
                  href="https://youtu.be/VUCKP8Z2frQ"
                  target="_blank"
                  className="flex-1 rounded-full bg-white text-black text-center py-3 font-mono text-[11px] tracking-widest font-bold uppercase hover:bg-[#EDE6DF] transition"
                >
                  Watch on YouTube
                </a>
                <button className="h-[40px] w-[40px] rounded-full border border-white/15 grid place-items-center text-white/60 hover:text-white hover:bg-white/10 transition">
                  <span className="text-[16px]">↗</span>
                </button>
              </div>

              <div className="mt-6 font-mono text-[10px] leading-[1.5] text-white/25">
                Shot in collaboration with local crew. Grateful for the Joburg nights that let us steal frames between load-shedding.
              </div>
            </div>

            {/* Quote card */}
            <div className="mt-4 rounded-[16px] bg-[#CDA99E] p-6 md:p-7 text-black">
              <div className="font-mono text-[10px] tracking-widest uppercase opacity-60 mb-4">Director's Note</div>
              <p style={{ fontFamily: "'Instrument Serif', serif" }} className="text-[20px] md:text-[22px] leading-[1.15] italic">
                “Papi brought a patience to the night. He let the city breathe, then punched in when the performance hit.”
              </p>
              <div className="mt-4 font-mono text-[11px] tracking-widest uppercase font-bold">— Jono Kyriakou, Director</div>
            </div>
          </div>
        </div>
      </section>

      {/* VISUAL LANGUAGE STRIP — mimics film strip */}
      <section className="border-y border-white/10 bg-[#0A0A0A]">
        <div className="flex items-center justify-between px-[1.2vw] py-3 font-mono text-[10px] tracking-widest uppercase text-white/30">
          <span>Process / Lighting Breakdown</span>
          <span className="hidden md:inline">— 24mm @ T2.0 — ISO 800 — 5600K + 1/2 CTS —</span>
          <span>003 Frames</span>
        </div>
        <div className="grid grid-cols-12 gap-px bg-white/10">
          {[
            {
              title: "Practical Key",
              desc: "Single overhead practical + 2x Nanlite bounced for skin",
              meta: "Frame 041",
            },
            {
              title: "Car Rig Night",
              desc: "Black interior, dashboard LED + passing streetlights as chase",
              meta: "Frame 089",
            },
            {
              title: "Versus Close-Up",
              desc: "50mm anamorphic, eye light from Aputure 300x through 4x4 diffusion",
              meta: "Frame 112",
            },
          ].map((card, i) => (
            <div key={i} className="col-span-12 md:col-span-4 bg-[#050505] p-6 md:p-8 group hover:bg-[#101010] transition">
              <div className="flex justify-between">
                <span className="font-mono text-[10px] tracking-widest text-white/20">{card.meta}</span>
                <span className="h-1 w-1 rounded-full bg-white/20 group-hover:bg-[#CDA99E] transition" />
              </div>
              <h4 style={{ fontFamily: "'Anton', sans-serif" }} className="mt-10 text-[28px] md:text-[32px] leading-[0.9] uppercase tracking-[-0.02em]">
                {card.title}
              </h4>
              <p className="mt-3 text-[13px] leading-[1.5] text-white/50 max-w-[30ch]">{card.desc}</p>
              <div className="mt-10 h-px w-full bg-white/10">
                <div className="h-px w-[22%] bg-white/40 group-hover:w-[100%] transition-all duration-700" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER CREDITS — like end slate */}
      <footer className="px-[2vw] md:px-[1.2vw] py-10 md:py-16">
        <div className="flex flex-col md:flex-row justify-between gap-10">
          <div>
            <div style={{ fontFamily: "'Anton', sans-serif" }} className="text-[18vw] md:text-[8vw] leading-[0.85] tracking-[-0.03em] uppercase opacity-10">
              PAPI RABORIFE
            </div>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[10px] tracking-widest uppercase text-white/30">
              <span>© 2024 — All Rights Reserved</span>
              <span className="hidden md:inline h-3 w-px bg-white/10" />
              <span>Johannesburg — Available for global projects</span>
              <a href="#" className="text-white/60 hover:text-white underline underline-offset-4">papir@film</a>
            </div>
          </div>
        </div>

        {/* bottom line marque */}
        <div className="mt-12 overflow-hidden border-y border-white/5 py-3">
          <div className="flex animate-[marquee_30s_linear_infinite] whitespace-nowrap gap-10 font-mono text-[10px] tracking-[0.25em] uppercase text-white/20">
            {Array.from({ length: 8 }).map((_, i) => (
              <span key={i} className="flex items-center gap-10">
                <span>Cinematography • Music Film • Commercial • Narrative</span>
                <span className="h-1 w-1 rounded-full bg-white/20" />
              </span>
            ))}
          </div>
        </div>

        <style>{`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
      </footer>
    </div>
  );
}
