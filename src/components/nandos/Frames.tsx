type Frame = {
  n: string;
  tag: string;
  title: string;
  desc: string;
  color: string;
  emoji: string;
};

const FRAMES: Frame[] = [
  {
    n: "01",
    tag: "The Star",
    title: "Sneakfreak99",
    desc: "Going Live to make the ultimate entrance — the flex, the fit, the feed.",
    color: "bg-[#f04e23]",
    emoji: "👟",
  },
  {
    n: "02",
    tag: "The Pour",
    title: "Bowl into the Box",
    desc: "Peri-peri poured straight into a fresh pair of PUMAs. Audacity, served.",
    color: "bg-[#e63525]",
    emoji: "🍗",
  },
  {
    n: "03",
    tag: "The Sound",
    title: "ASMR, Amplified",
    desc: "Spine-tingling texture on every bite. Sound design as a flex.",
    color: "bg-[#6a13a1]",
    emoji: "🎧",
  },
  {
    n: "04",
    tag: "The Scene",
    title: "Forex Flex",
    desc: "Over-the-top dine-out vibes from a gloriously gaudy trader.",
    color: "bg-[#f6c945]",
    emoji: "💰",
  },
  {
    n: "05",
    tag: "The Snapper",
    title: "Foodie POV",
    desc: "Clocking blocks to land that one perfect Boomerang moment.",
    color: "bg-[#ff5a2c]",
    emoji: "📸",
  },
];

export default function Frames() {
  return (
    <section id="nandos-frames" className="bg-[#fbf6ec] py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="reveal mb-12 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.25em] text-[#e63525]">
              / Direction
            </p>
            <h2 className="font-nandos-display text-4xl uppercase leading-[0.9] md:text-6xl">
              Five Frames of
              <br />
              <span className="text-[#ff5a2c]">Boujee Energy</span>
            </h2>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-[#171412]/60">
            A scene-by-scene snapshot of the art direction — loud colour,
            brazen moments, zero filter.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FRAMES.map((f, i) => (
            <article
              key={f.n}
              className={
                "reveal group relative flex flex-col overflow-hidden rounded-3xl border-2 border-[#171412] p-6 transition-transform hover:-translate-y-1 " +
                (f.color === "bg-[#f6c945]" ? "text-[#171412]" : "text-[#f5efe4]") +
                " " +
                f.color +
                (i === 0 ? " lg:col-span-2" : "")
              }
              style={{ transitionDelay: `${(i % 3) * 80}ms` }}
            >
              <div className="flex items-start justify-between">
                <span className="font-nandos-display text-2xl text-white/30">{f.n}</span>
                <span
                  aria-hidden
                  className="text-4xl transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110"
                >
                  {f.emoji}
                </span>
              </div>
              <div className="mt-auto">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] opacity-70">
                  {f.tag}
                </p>
                <h3 className="mt-1 font-nandos-display text-3xl uppercase leading-none">
                  {f.title}
                </h3>
                <p className="mt-3 max-w-md text-sm leading-relaxed opacity-85">
                  {f.desc}
                </p>
              </div>
            </article>
          ))}

          {/* CTA tile */}
          <div className="reveal flex flex-col justify-between gap-8 rounded-3xl border-2 border-[#171412] bg-[#171412] p-7 text-[#f5efe4] sm:flex-row sm:items-center lg:col-span-3">
            <p className="font-nandos-display text-4xl uppercase leading-none sm:text-5xl">
              +2K · and counting
            </p>
            <p className="max-w-md text-sm leading-relaxed text-[#f5efe4]/70">
              Sneaker drops, hot takes and laughs shared across social after
              launch. The culture did the talking.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
