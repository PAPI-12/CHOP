import { useState } from "react";

export default function Hero() {
  const [loaded, setLoaded] = useState(false);
  return (
    <section
      id="cornetto-top"
      className="relative min-h-screen overflow-hidden bg-[#563092] pt-28"
      style={{ contain: "paint" }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#6740a8] via-[#563092] to-[#27143f]" aria-hidden />

      <img
        src="/images/cornetto-truck.webp"
        alt="Cornetto Culture ice cream truck illustration"
        loading="eager"
        decoding="async"
        // @ts-ignore React 19 fetchPriority
        fetchPriority="high"
        width={1920}
        height={1080}
        onLoad={() => setLoaded(true)}
        className={`absolute inset-0 h-full w-full object-cover object-[55%_50%] transition-opacity duration-700 ${loaded ? "opacity-[0.92]" : "opacity-0"}`}
      />

      <div className="absolute inset-0 bg-gradient-to-r from-[#27143f]/95 via-[#563092]/72 to-[#563092]/28" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#211434]/75 via-transparent to-[#211434]/20" />
      <div className="pointer-events-none absolute -left-20 top-72 hidden h-72 w-72 rounded-full border-[26px] border-[#ffb51b]/20 md:block" />

      <div className="relative z-10 mx-auto max-w-[1440px] px-5 pb-12 md:px-8 md:pb-16">
        <div className="mb-10 flex flex-wrap items-center gap-3">
          <div className="corn-pill-yellow inline-flex rounded-full px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.18em]">UI/UX Case Study · Portfolio Piece</div>
          <div className="corn-pill-cream rounded-full px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.18em]">MEMBERSHIP TO THE CULTURE</div>
        </div>

        <div className="flex min-h-[62vh] items-center">
          <div className="max-w-5xl">
            <h1 className="font-corn-round text-[clamp(4.5rem,14vw,13rem)] font-extrabold leading-[0.72] tracking-[-0.07em] text-[#fff1da] [text-shadow:6px_6px_0_#211434]">
              Cornetto<br /><span className="-ml-[0.05em] text-[#fff1da]">Culture</span>
            </h1>
            <p className="mt-8 max-w-xl text-[15px] font-bold leading-relaxed text-white/90 md:text-lg">
              Celebrate how you think, what you say, who you vibe with — and where the van shows up next.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#cornetto-insight" className="corn-pill-yellow rounded-full px-7 py-3 text-xs font-black uppercase tracking-[0.18em] transition hover:-translate-y-0.5">Explore the idea</a>
              <a href="#cornetto-design" className="corn-pill-cream rounded-full px-7 py-3 text-xs font-black uppercase tracking-[0.18em] transition hover:-translate-y-0.5">See the app</a>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 border-y-[3px] border-[#211434] bg-[#ffb51b] py-3">
        <div className="flex overflow-hidden">
          <div className="animate-corn-marquee flex whitespace-nowrap font-corn-display text-xl tracking-wide text-[#211434] md:text-2xl">
            {Array.from({ length: 2 }).map((_, i) => (
              <span key={`marquee-${i}`} className="flex shrink-0 items-center">
                <span className="mx-4">SKATERS</span><span className="mx-2">◆</span>
                <span className="mx-4">DOG WALKERS</span><span className="mx-2">◆</span>
                <span className="mx-4">VEGANS</span><span className="mx-2">◆</span>
                <span className="mx-4">ARTISTS</span><span className="mx-2">◆</span>
                <span className="mx-4">GEN Z CULTURE</span><span className="mx-2">◆</span>
                <span className="mx-4">CORNETTO VAN</span><span className="mx-2">◆</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
