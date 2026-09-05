import { useEffect, useState, type ReactElement } from "react";
import {
  TopHatIcon,
  ShoeIcon,
  RaceCarIcon,
  DiceIcon,
  VMark,
} from "./MonopolyIcons";
import { MonopolyBoard } from "./MonopolyBoard";

/* ------------------------------------------------------------------ */
/*  Small UI helpers                                                   */
/* ------------------------------------------------------------------ */

const Sparkle = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 inline-block" fill="currentColor" aria-hidden>
    <path d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z" />
  </svg>
);

const Pill = ({ children, tone = "ink" }: { children: React.ReactNode; tone?: "ink" | "red" | "cream" | "peach" }) => {
  const tones: Record<string, string> = {
    ink:   "bg-[#1B1210] text-[#F4EBDC]",
    red:   "bg-[#E60000] text-white",
    cream: "bg-[#F4EBDC] text-[#1B1210] border border-[#1B1210]/20",
    peach: "bg-[#F6C9A8] text-[#1B1210]",
  };
  return (
    <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs uppercase tracking-[.18em] ${tones[tone]}`}>
      {children}
    </span>
  );
};

/* ------------------------------------------------------------------ */
/*  Sections                                                           */
/* ------------------------------------------------------------------ */

const AnnouncementBar = () => (
  <div className="bg-[#1B1210] text-[#F4EBDC] text-[11px] md:text-xs tracking-[.25em] uppercase py-2.5 px-4 text-center">
    <span className="opacity-70">Case study 03 / 12</span>
    <span className="mx-3 opacity-40">•</span>
    <span>Vodacom Ready Business — Monopoly Campaign</span>
    <span className="mx-3 opacity-40">•</span>
    <span className="opacity-70">Art Direction, 2016</span>
  </div>
);

const Nav = () => {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-[64px] md:top-[76px] z-30 bg-[#F4EBDC]/85 backdrop-blur border-b border-[#1B1210]/10">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between px-5 md:px-10 py-4">
        <a href="#vodacom-top" className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-[#E60000] grid place-items-center">
            <span className="w-3 h-3 rounded-full bg-white" />
          </span>
          <span className="font-vodacom-display text-2xl font-black tracking-tight">Studio&nbsp;/&nbsp;AD</span>
        </a>

        <nav className="hidden md:flex items-center gap-8 text-sm">
          <a href="#vodacom-brief"    className="vodacom-link-underline">Brief</a>
          <a href="#vodacom-idea"     className="vodacom-link-underline">Big Idea</a>
          <a href="#vodacom-magazine" className="vodacom-link-underline">Print Ad</a>
          <a href="#vodacom-tokens"   className="vodacom-link-underline">Campaign</a>
          <a href="#vodacom-impact"   className="vodacom-link-underline">Impact</a>
        </nav>

        <div className="flex items-center gap-3">
          <button
            aria-label="Menu"
            onClick={() => setOpen(!open)}
            className="md:hidden w-10 h-10 rounded-full bg-[#1B1210] text-[#F4EBDC] grid place-items-center"
          >
            {open ? "✕" : "≡"}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-[#1B1210]/10 px-5 py-4 flex flex-col gap-3 text-sm">
          <a href="#vodacom-brief"    onClick={() => setOpen(false)}>Brief</a>
          <a href="#vodacom-idea"     onClick={() => setOpen(false)}>Big Idea</a>
          <a href="#vodacom-magazine" onClick={() => setOpen(false)}>Print Ad</a>
          <a href="#vodacom-tokens"   onClick={() => setOpen(false)}>Campaign</a>
          <a href="#vodacom-impact"   onClick={() => setOpen(false)}>Impact</a>
        </div>
      )}
    </header>
  );
};

const Hero = () => (
  <section id="vodacom-top" className="relative overflow-hidden">
    {/* Sun/coin ring */}
    <div className="pointer-events-none absolute -top-40 -right-40 w-[520px] h-[520px] rounded-full bg-[#F6C9A8] opacity-90" />
    <div className="pointer-events-none absolute top-40 -left-20 w-64 h-64 rounded-full bg-[#E8D6F2] opacity-80" />

    <div className="relative max-w-[1400px] mx-auto px-5 md:px-10 pt-14 pb-6">
      <div className="flex flex-wrap items-center gap-2 mb-8">
        <Pill tone="ink"><Sparkle /> Art Direction</Pill>
        <Pill tone="cream">Integrated Print</Pill>
        <Pill tone="cream">Copywriting</Pill>
        <Pill tone="peach">SME / SOHO</Pill>
      </div>

      <h1 className="font-vodacom-display font-black leading-[.85] tracking-tight text-[15vw] md:text-[11rem]">
        Get&nbsp;your
        <br />
        <span className="italic text-[#E60000]">business</span>&nbsp;ready.
      </h1>

      <div className="mt-8 grid md:grid-cols-12 gap-6 items-end">
        <p className="md:col-span-6 text-lg md:text-2xl font-vodacom-display leading-snug text-[#1B1210]/80">
          A print &amp; digital campaign for
          <span className="mx-2 inline-flex items-center gap-2 align-middle">
            <span className="w-6 h-6 rounded-full bg-[#E60000] inline-block align-middle" />
            <span className="font-black">Vodacom</span>
          </span>
          that turns South Africa into a Monopoly&nbsp;board —
          because every township, suburb and side-hustle is one connected&nbsp;economy.
        </p>

        <div className="md:col-span-6 flex flex-wrap gap-3 md:justify-end">
          <a href="#vodacom-magazine"
             className="inline-flex items-center gap-3 bg-[#E60000] text-white rounded-full pl-6 pr-2 py-2 text-sm uppercase tracking-widest hover:bg-[#1B1210] transition">
            View the print ad
            <span className="w-9 h-9 rounded-full bg-white text-[#E60000] grid place-items-center">→</span>
          </a>
          <a href="#vodacom-idea"
             className="inline-flex items-center gap-2 bg-transparent border border-[#1B1210] text-[#1B1210] rounded-full px-6 py-3 text-sm uppercase tracking-widest hover:bg-[#1B1210] hover:text-[#F4EBDC] transition">
            The Big Idea
          </a>
        </div>
      </div>
    </div>

    {/* Hero image strip */}
    <div className="relative max-w-[1400px] mx-auto px-5 md:px-10 pb-14">
      <div className="relative rounded-[28px] overflow-hidden border border-[#1B1210]/15 shadow-[0_30px_60px_-30px_rgba(0,0,0,.35)]">
        <img loading="lazy" decoding="async"
          src="/images/hero-collage.webp"
          alt="Vodacom Ready Business Monopoly campaign — flat lay of print ads"
          className="w-full h-[52vh] md:h-[70vh] object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <div className="absolute bottom-5 left-5 md:bottom-8 md:left-8 flex flex-wrap items-center gap-3">
          <Pill tone="red">Vodacom Ready Business</Pill>
          <Pill tone="cream">Monopoly Print Series</Pill>
        </div>
        <div className="absolute top-5 right-5 md:top-8 md:right-8 flex items-center gap-2">
          <DiceIcon pips={4} className="w-12 h-12 md:w-16 md:h-16 drop-shadow" />
          <DiceIcon pips={2} className="w-12 h-12 md:w-16 md:h-16 drop-shadow" />
        </div>
      </div>
    </div>
  </section>
);

const Marquee = () => {
  const items = [
    "Art Direction", "★", "Integrated Campaign", "★", "SOHO × SME",
    "★", "Township to Suburb", "★", "Print Design", "★", "Copywriting", "★",
    "Vodacom Ready Business", "★",
  ];
  const loop = [...items, ...items];
  return (
    <div className="bg-[#1B1210] text-[#F4EBDC] py-5 border-y border-[#1B1210] overflow-hidden">
      <div className="vodacom-marquee-track flex whitespace-nowrap gap-10 text-xl md:text-3xl font-vodacom-display italic">
        {loop.map((t, i) => (
          <span key={i} className={`shrink-0 ${t === "★" ? "text-[#E60000]" : ""}`}>{t}</span>
        ))}
      </div>
    </div>
  );
};

const Brief = () => (
  <section id="vodacom-brief" className="relative bg-[#F4EBDC] py-20 md:py-28">
    <div className="max-w-[1400px] mx-auto px-5 md:px-10 grid md:grid-cols-12 gap-8">
      <div className="md:col-span-4">
        <div className="sticky top-28">
          <p className="uppercase tracking-[.25em] text-xs mb-4 opacity-60">01 — The Brief</p>
          <h2 className="font-vodacom-display text-5xl md:text-7xl font-black leading-[.9]">
            Roll<br/>the <span className="italic text-[#E60000]">dice.</span>
          </h2>
          <p className="mt-6 text-lg opacity-80 max-w-sm">
            Vodacom needed a way into the fast-growing SOHO / SME market —
            and a story that connected small hustles with the big city.
          </p>
        </div>
      </div>

      <div className="md:col-span-8 grid sm:grid-cols-2 gap-4">
        {[
          { label: "Client",  value: "Vodacom",            bg: "bg-[#E60000]", fg: "text-white", accent: <VMark className="w-10 h-10" /> },
          { label: "Role",    value: "Art Director",       bg: "bg-[#1B1210]", fg: "text-[#F4EBDC]", accent: <DiceIcon pips={3} className="w-14 h-14" /> },
          { label: "Sector",  value: "Telco / Business",   bg: "bg-[#E8D6F2]", fg: "text-[#1B1210]", accent: <Sparkle /> },
          { label: "Format",  value: "Print · Mobile · OOH", bg: "bg-[#F6C9A8]", fg: "text-[#1B1210]", accent: <span className="font-vodacom-display italic text-3xl">◐</span> },
        ].map((c) => (
          <div key={c.label} className={`rounded-3xl ${c.bg} ${c.fg} p-6 md:p-8 flex flex-col justify-between min-h-[180px]`}>
            <div className="flex items-start justify-between">
              <p className="uppercase tracking-[.2em] text-xs opacity-80">{c.label}</p>
              <div className="opacity-90">{c.accent}</div>
            </div>
            <p className="font-vodacom-display text-3xl md:text-4xl font-black leading-tight mt-6">{c.value}</p>
          </div>
        ))}

        {/* Brief description spans both */}
        <div className="sm:col-span-2 rounded-3xl bg-white border border-[#1B1210]/15 p-7 md:p-10">
          <p className="uppercase tracking-[.2em] text-xs opacity-60 mb-4">The Ask</p>
          <p className="font-vodacom-display text-2xl md:text-3xl leading-snug">
            “Vodacom wanted to tap into the start-up market. Find a way to link
            <span className="text-[#E60000] font-black"> SOHOs </span>
            and
            <span className="text-[#E60000] font-black"> SMEs</span> — from the townships
            to the suburbs — and make the network feel like the thread that stitches
            the whole ecosystem together.”
          </p>
        </div>
      </div>
    </div>
  </section>
);

const BigIdea = () => (
  <section id="vodacom-idea" className="relative bg-[#EFE3CE] py-20 md:py-28 overflow-hidden">
    <div className="pointer-events-none absolute -top-16 right-10 opacity-30">
      <div className="vodacom-slow-spin">
        <svg viewBox="0 0 200 200" className="w-64 h-64">
          <defs>
            <path id="circ" d="M100,100 m-80,0 a80,80 0 1,1 160,0 a80,80 0 1,1 -160,0" />
          </defs>
          <text fontFamily="Space Grotesk" fontSize="14" letterSpacing="6" fill="#1B1210">
            <textPath href="#circ">
              READY · BUSINESS · READY · BUSINESS · READY · BUSINESS ·
            </textPath>
          </text>
        </svg>
      </div>
    </div>

    <div className="max-w-[1400px] mx-auto px-5 md:px-10">
      <div className="flex items-end justify-between gap-6 flex-wrap mb-10">
        <div>
          <p className="uppercase tracking-[.25em] text-xs mb-4 opacity-60">02 — The Big Idea</p>
          <h2 className="font-vodacom-display text-5xl md:text-8xl font-black leading-[.9] max-w-4xl">
            Everyone on the <span className="italic text-[#E60000]">board</span> is connected.
          </h2>
        </div>
        <p className="max-w-sm text-lg opacity-80">
          In Monopoly, every square — from the cheapest to the most expensive — is
          part of the same loop. That’s exactly what Ready Business does: it links
          your side-hustle in Soweto to your customer in Sandton, and everyone in
          between.
        </p>
      </div>

      {/* Board illustration card */}
      <div className="grid md:grid-cols-12 gap-6 items-start">
        <div className="md:col-span-8 rounded-[28px] bg-[#F4EBDC] border border-[#1B1210]/10 p-6 md:p-10 shadow-[0_30px_60px_-30px_rgba(0,0,0,.3)]">
          <MonopolyBoard />
          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
            <Pill tone="red">Township</Pill>
            <span className="opacity-40">→</span>
            <Pill tone="peach">High Street</Pill>
            <span className="opacity-40">→</span>
            <Pill tone="cream">Sandton</Pill>
            <span className="opacity-40">→</span>
            <Pill tone="ink">Park Lane</Pill>
          </div>
        </div>

        <div className="md:col-span-4 flex flex-col gap-4">
          <div className="rounded-[28px] bg-[#1B1210] text-[#F4EBDC] p-8">
            <p className="uppercase tracking-[.2em] text-xs opacity-60 mb-4">Insight</p>
            <p className="font-vodacom-display text-2xl leading-snug">
              Small businesses don’t just want data — they want to feel
              <span className="italic text-[#E60000]"> plugged in </span>
              to something bigger.
            </p>
          </div>
          <div className="rounded-[28px] bg-[#E60000] text-white p-8">
            <p className="uppercase tracking-[.2em] text-xs opacity-80 mb-4">Strategy</p>
            <p className="font-vodacom-display text-2xl leading-snug">
              Use the most famous business board game on earth as a metaphor
              for a nationwide business network.
            </p>
          </div>
          <div className="rounded-[28px] bg-[#F6C9A8] text-[#1B1210] p-8">
            <p className="uppercase tracking-[.2em] text-xs opacity-80 mb-4">Line</p>
            <p className="font-vodacom-display text-3xl font-black leading-tight">
              “Get your business ready. GO DREAM.”
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const MagazineFeature = () => (
  <section id="vodacom-magazine" className="relative bg-[#F4EBDC] py-20 md:py-28">
    <div className="max-w-[1400px] mx-auto px-5 md:px-10">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
        <div>
          <p className="uppercase tracking-[.25em] text-xs mb-4 opacity-60">03 — Hero Print Piece</p>
          <h2 className="font-vodacom-display text-5xl md:text-7xl font-black leading-[.9]">
            The Monopoly<br/>
            <span className="italic text-[#E60000]">Magazine</span> spread.
          </h2>
        </div>
        <div className="max-w-md">
          <p className="text-lg opacity-80">
            A double-page magazine ad showing the power of Ready Business when
            everyone is linked up. Wherever you are on the board — you’re
            connected through Vodacom Ready Business.
          </p>
        </div>
      </div>

      {/* Framed magazine */}
      <div className="relative rounded-[36px] bg-[#1B1210] p-3 md:p-5">
        <div className="rounded-[26px] overflow-hidden relative">
          <img loading="lazy" decoding="async"
            src="/images/monopoly-spread.webp"
            alt="Monopoly Magazine Print — Vodacom Ready Business double page spread"
            className="w-full h-auto object-cover"
          />
          {/* corner tags */}
          <div className="absolute top-4 left-4 md:top-6 md:left-6 flex gap-2">
            <Pill tone="red">Double Page Spread</Pill>
            <Pill tone="cream">Business Magazine</Pill>
          </div>
        </div>
      </div>

      {/* Caption strip */}
      <div className="mt-6 grid md:grid-cols-12 gap-6">
        <div className="md:col-span-4 rounded-2xl bg-white border border-[#1B1210]/10 p-6">
          <p className="uppercase tracking-[.2em] text-xs opacity-60">Publication</p>
          <p className="font-vodacom-display text-2xl font-black mt-2">Business Monthly, ZA</p>
        </div>
        <div className="md:col-span-4 rounded-2xl bg-white border border-[#1B1210]/10 p-6">
          <p className="uppercase tracking-[.2em] text-xs opacity-60">Format</p>
          <p className="font-vodacom-display text-2xl font-black mt-2">420 × 297 mm · DPS</p>
        </div>
        <div className="md:col-span-4 rounded-2xl bg-white border border-[#1B1210]/10 p-6">
          <p className="uppercase tracking-[.2em] text-xs opacity-60">Tagline</p>
          <p className="font-vodacom-display text-2xl font-black mt-2 italic">Be a part of your community empowerment.</p>
        </div>
      </div>
    </div>
  </section>
);

/* ------------------------------------------------------------------ */
/*  Campaign token cards — Hat / Shoe / Car                            */
/* ------------------------------------------------------------------ */

type TokenAd = {
  title: string;
  product: string;
  headline: string;
  body: string;
  bg: string;
  Icon: (p: { className?: string }) => ReactElement;
  swatch: string;
};

const Tokens = () => {
  const ads: TokenAd[] = [
    {
      title: "Monopoly Hat",
      product: "Debonair · Microsoft Office 365",
      headline: "Suit up for Success",
      body:
        "Dress up your dreams and take them out into the world. Get business ready with Vodacom — and with the Debonair Microsoft Office 365 you can achieve the success that suits you.",
      bg: "bg-[#F6C9A8]",
      Icon: TopHatIcon,
      swatch: "#E60000",
    },
    {
      title: "Monopoly Shoe",
      product: "One Net Express",
      headline: "Fill the shoes of greatness",
      body:
        "Finally take those steps to your goals. Leave your footprint on the path to business greatness. Get business ready with Vodacom and with One Net Express you won’t just talk the talk — you’ll walk it too.",
      bg: "bg-[#E8D6F2]",
      Icon: ShoeIcon,
      swatch: "#4A1E1A",
    },
    {
      title: "Monopoly Car",
      product: "Fast Broadband LTE",
      headline: "Fuel your Drive",
      body:
        "Know where you want to go? Anxious to get on the road to business success? Start your dream. Rev your ambition. Get business ready with Vodacom — with Fast Broadband LTE you can drive towards your dream.",
      bg: "bg-[#C9E5CE]",
      Icon: RaceCarIcon,
      swatch: "#1B1210",
    },
  ];

  return (
    <section id="vodacom-tokens" className="relative bg-[#EFE3CE] py-20 md:py-28 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-5 md:px-10">
        <div className="flex items-end justify-between gap-6 flex-wrap mb-12">
          <div>
            <p className="uppercase tracking-[.25em] text-xs mb-4 opacity-60">04 — Campaign Extensions</p>
            <h2 className="font-vodacom-display text-5xl md:text-7xl font-black leading-[.9]">
              Three tokens.<br/>
              <span className="italic text-[#E60000]">One board.</span>
            </h2>
          </div>
          <p className="max-w-md text-lg opacity-80">
            Each Vodacom business product became a classic Monopoly token — the
            top hat, the boot, the race car — with a headline written to match
            the personality of the piece.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {ads.map((ad, i) => (
            <article
              key={ad.title}
              className={`tile relative rounded-[28px] ${ad.bg} border border-[#1B1210]/15 p-6 md:p-8 flex flex-col overflow-hidden`}
            >
              <div className="flex items-center justify-between mb-4">
                <Pill tone="ink">0{i + 1} / {ads.length}</Pill>
                <span className="text-xs uppercase tracking-[.2em] opacity-60">{ad.product}</span>
              </div>

              {/* Faux print ad panel */}
              <div className="bg-white rounded-2xl border border-[#1B1210]/10 p-6 flex flex-col items-center text-center">
                <h3 className="text-[#E60000] font-vodacom-display font-black text-2xl md:text-3xl leading-tight">
                  {ad.headline}
                </h3>
                <div className="my-5 w-40 h-40 grid place-items-center">
                  <ad.Icon className="w-full h-full" />
                </div>
                <div className="w-16 h-[2px] bg-[#E60000] mb-4" />
                <p className="text-[#9E0000] text-[13px] leading-relaxed max-w-[26ch]">
                  {ad.body}
                </p>
                <div className="mt-6 w-8 h-8 rounded-full bg-[#E60000] grid place-items-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-white" />
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between">
                <p className="font-vodacom-display italic text-lg">{ad.title}</p>
                <span
                  className="w-8 h-8 rounded-full border border-[#1B1210]/40"
                  style={{ background: ad.swatch }}
                />
              </div>
            </article>
          ))}
        </div>

        {/* Copy craft block */}
        <div className="mt-10 grid md:grid-cols-12 gap-5">
          <div className="md:col-span-7 rounded-[28px] bg-[#1B1210] text-[#F4EBDC] p-8 md:p-12">
            <p className="uppercase tracking-[.25em] text-xs opacity-60 mb-4">Copy craft</p>
            <p className="font-vodacom-display text-3xl md:text-4xl italic leading-tight">
              “Wherever you are on the board — you’re linked through
              <span className="text-[#E60000] not-italic font-black"> Vodacom Ready Business</span>.”
            </p>
            <p className="mt-6 opacity-70 max-w-xl">
              A shared closing line unified every execution, so hat, shoe and
              car all rolled back to the same promise: connection.
            </p>
          </div>
          <div className="md:col-span-5 rounded-[28px] bg-white border border-[#1B1210]/10 p-8 md:p-10">
            <p className="uppercase tracking-[.25em] text-xs opacity-60 mb-4">Type system</p>
            <div className="space-y-4">
              <div className="flex items-baseline justify-between border-b border-dashed border-[#1B1210]/20 pb-3">
                <span className="font-vodacom-display text-3xl font-black">Fraunces</span>
                <span className="text-xs uppercase tracking-widest opacity-60">Headlines</span>
              </div>
              <div className="flex items-baseline justify-between border-b border-dashed border-[#1B1210]/20 pb-3">
                <span className="text-2xl">Space Grotesk</span>
                <span className="text-xs uppercase tracking-widest opacity-60">Body copy</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="font-[Rubik_Mono_One] text-xl">MONOPOLY MONO</span>
                <span className="text-xs uppercase tracking-widest opacity-60">Board tiles</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/*  Impact / process / footer                                          */
/* ------------------------------------------------------------------ */

const Impact = () => (
  <section id="vodacom-impact" className="bg-[#E60000] text-white py-20 md:py-28 relative overflow-hidden">
    <div className="pointer-events-none absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-[#9E0000]" />
    <div className="max-w-[1400px] mx-auto px-5 md:px-10 relative">
      <p className="uppercase tracking-[.25em] text-xs opacity-80 mb-4">05 — Impact</p>
      <h2 className="font-vodacom-display text-5xl md:text-7xl font-black leading-[.9] max-w-4xl">
        The board <span className="italic">landed.</span>
      </h2>

      <div className="mt-14 grid sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { k: "3", l: "Executions in the print series" },
          { k: "1×", l: "DPS hero magazine spread" },
          { k: "SME", l: "First Vodacom campaign built entirely for small business" },
          { k: "★", l: "Shortlisted, Loerie Awards — Print Craft" },
        ].map((m) => (
          <div key={m.l} className="rounded-3xl bg-white/10 backdrop-blur border border-white/15 p-6">
            <p className="font-vodacom-display text-6xl font-black leading-none">{m.k}</p>
            <p className="mt-4 text-sm opacity-90">{m.l}</p>
          </div>
        ))}
      </div>

      {/* Process timeline */}
      <div className="mt-16 border-t border-white/20 pt-10">
        <p className="uppercase tracking-[.25em] text-xs opacity-80 mb-8">Process</p>
        <ol className="grid md:grid-cols-4 gap-6">
          {[
            { n: "01", t: "Insight",     d: "The SME market is fragmented — but everyone plays the same game." },
            { n: "02", t: "Metaphor",    d: "Monopoly: the world’s most-loved business board." },
            { n: "03", t: "Art Direction", d: "Isometric board illustration + red Vodacom tokens on white space." },
            { n: "04", t: "Roll-out",    d: "Hero DPS, three token print ads, mobile & OOH extensions." },
          ].map((s) => (
            <li key={s.n} className="border border-white/20 rounded-2xl p-5">
              <p className="font-[Rubik_Mono_One] text-3xl">{s.n}</p>
              <p className="font-vodacom-display text-2xl font-black mt-3">{s.t}</p>
              <p className="opacity-85 text-sm mt-2">{s.d}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  </section>
);

const NextUp = () => (
  <section id="vodacom-contact" className="bg-[#F4EBDC] py-20 md:py-28">
    <div className="max-w-[1400px] mx-auto px-5 md:px-10 grid md:grid-cols-12 gap-8 items-center">
      <div className="md:col-span-7">
        <p className="uppercase tracking-[.25em] text-xs opacity-60 mb-4">Case 04 / 12</p>
        <h2 className="font-vodacom-display text-5xl md:text-8xl font-black leading-[.85]">
          Ready<br/>to <span className="italic text-[#E60000]">play</span> the next round?
        </h2>
        <p className="mt-6 text-lg opacity-80 max-w-xl">
          Full portfolio, hi-res scans of the Monopoly campaign and behind-the-scenes
          sketches are available on request.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="#vodacom-top" className="inline-flex items-center gap-2 border border-[#1B1210]/40 rounded-full px-5 py-3 text-sm uppercase tracking-widest hover:bg-[#1B1210] hover:text-[#F4EBDC] transition">
            Back to Top ↑
          </a>
        </div>
      </div>
    </div>
  </section>
);

const Footer = () => (
  <div className="bg-[#1B1210] text-[#F4EBDC] py-14">
    <div className="max-w-[1400px] mx-auto px-5 md:px-10">
      <p className="font-vodacom-display text-4xl font-black leading-tight">
        Vodacom Ready Business
      </p>
      <p className="opacity-70 mt-3 max-w-sm">
        Art direction &amp; campaign design case study. Made in Johannesburg.
      </p>
    </div>

    <div className="max-w-[1400px] mx-auto px-5 md:px-10 mt-10 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between text-xs opacity-60">
      <p>© {new Date().getFullYear()} Papi Raborife — Portfolio piece. Vodacom, Monopoly &amp; related marks belong to their respective owners.</p>
      <p>Case study 03 · Vodacom Ready Business</p>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Root                                                               */
/* ------------------------------------------------------------------ */

export default function App() {
  // Small nicety — scroll behaviour + set doc bg
  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
  }, []);

  return (
    <div className="min-h-screen bg-[#F4EBDC] text-[#1B1210] font-sans">
      <AnnouncementBar />
      <Nav />
      <Hero />
      <Marquee />
      <Brief />
      <BigIdea />
      <MagazineFeature />
      <Tokens />
      <Impact />
      <NextUp />
      <Footer />
    </div>
  );
}
