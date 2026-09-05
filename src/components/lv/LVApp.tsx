import { useEffect, useState } from "react";
import { gallery } from "./data/gallery";

const LV = ({ className = "" }: { className?: string }) => (
  <span
    className={`font-lv-bebas inline-flex items-baseline leading-none tracking-[0.02em] ${className}`}
    aria-label="LV"
  >
    L<span className="ml-[0.02em]">V</span>
  </span>
);

const ScrollProgress = () => {
  const [p, setP] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      setP((h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100);
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-[2px] bg-transparent">
      <div
        className="h-full bg-[#c9a86a] transition-[width] duration-100"
        style={{ width: `${p}%` }}
      />
    </div>
  );
};

const Hero = () => {
  return (
    <section className="relative h-screen min-h-[640px] w-full overflow-hidden bg-[#0e0c0a] text-[#f3ead7]">
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-5 py-4 md:px-8 md:py-5">
        <div className="flex items-center gap-3">
          <div className="text-[#f3ead7]">
            <LV className="text-xl" />
          </div>
          <span className="font-lv-bebas text-sm tracking-[0.35em] text-[#f3ead7]">OUTLANDISH</span>
        </div>
        <div className="hidden items-center gap-7 font-lv-bebas text-xs tracking-[0.35em] text-[#f3ead7] md:flex">
          <a href="#lv-lookbook" className="hover:text-[#c9a86a]">LOOKBOOK</a>
          <a href="#lv-story" className="hover:text-[#c9a86a]">STORY</a>
        </div>
        <div className="font-lv-bebas text-xs tracking-[0.35em] text-[#f3ead7]/70">SS · 2026</div>
      </div>

      <img loading="lazy" decoding="async"
        src="/images/01-the-outlaw.webp"
        alt="Outlandish — Black rider in LV monogram cape on black horse, Drakensberg"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/40" />

      <div className="relative z-20 mx-auto flex h-full max-w-7xl flex-col justify-end px-5 pb-20 md:px-8 md:pb-24">
        <div className="font-lv-bebas text-[10px] tracking-[0.5em] text-[#c9a86a]">
          A LOUIS VUITTON CONCEPT · SS 2026
        </div>
        <h1 className="mt-4 font-lv-bebas text-7xl leading-[0.85] text-[#f3ead7] md:text-[10rem] lg:text-[12rem]">
          Out­landish
        </h1>
        <p className="mt-3 font-lv-serif text-2xl italic text-[#e8d4a8] md:text-4xl">
          from outlaws to high fashion
        </p>
      </div>
    </section>
  );
};

const Lookbook = () => {
  const [active, setActive] = useState<number | null>(null);

  return (
    <section id="lv-lookbook" className="bg-[#0e0c0a] py-10 md:py-14">
      <div className="px-5 pb-8 md:px-8">
        <div className="flex items-end justify-between">
          <div>
            <div className="font-lv-bebas text-[10px] tracking-[0.5em] text-[#c9a86a]">
              THE LOOKBOOK
            </div>
            <h2 className="mt-2 font-lv-bebas text-5xl text-[#f3ead7] md:text-7xl">
              THE LOOKBOOK
            </h2>
          </div>
          <div className="hidden font-lv-serif text-base italic text-[#f3ead7]/60 md:block">
            click any frame to expand
          </div>
        </div>
      </div>

      <div className="space-y-1.5 px-1.5 md:space-y-2 md:px-2">
        {Array.from({ length: 4 }).map((_, rowIndex) => {
          const start = rowIndex * 3;
          const portraitA = gallery[start];
          const portraitB = gallery[start + 1];
          const horizontal = gallery[start + 2];

          return (
            <div key={`row-${rowIndex}`} className="grid grid-cols-2 gap-1.5 md:gap-2">
              <button
                onClick={() => setActive(start)}
                className="group relative aspect-[3/4] overflow-hidden bg-[#1a1410]"
              >
                <img
                  src={portraitA.src}
                  alt={`${portraitA.title} — ${portraitA.subtitle}`}
                  className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                <div className="absolute top-3 left-3 font-lv-bebas text-sm tracking-[0.3em] text-[#f3ead7] mix-blend-difference md:top-4 md:left-4">
                  {portraitA.number}
                </div>
                <div className="absolute top-3 right-3 font-lv-bebas text-[10px] tracking-[0.3em] text-[#f3ead7]/80 mix-blend-difference md:top-4 md:right-4">
                  {portraitA.region}
                </div>
                <div className="absolute bottom-0 left-0 right-0 translate-y-2 p-3 text-left opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100 md:p-5">
                  <div className="font-lv-bebas text-2xl text-[#f3ead7] md:text-3xl">{portraitA.title}</div>
                  <div className="font-lv-serif text-xs italic text-[#c9a86a] md:text-base">
                    {portraitA.subtitle}
                  </div>
                </div>
              </button>

              <button
                onClick={() => setActive(start + 1)}
                className="group relative aspect-[3/4] overflow-hidden bg-[#1a1410]"
              >
                <img
                  src={portraitB.src}
                  alt={`${portraitB.title} — ${portraitB.subtitle}`}
                  className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                <div className="absolute top-3 left-3 font-lv-bebas text-sm tracking-[0.3em] text-[#f3ead7] mix-blend-difference md:top-4 md:left-4">
                  {portraitB.number}
                </div>
                <div className="absolute top-3 right-3 font-lv-bebas text-[10px] tracking-[0.3em] text-[#f3ead7]/80 mix-blend-difference md:top-4 md:right-4">
                  {portraitB.region}
                </div>
                <div className="absolute bottom-0 left-0 right-0 translate-y-2 p-3 text-left opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100 md:p-5">
                  <div className="font-lv-bebas text-2xl text-[#f3ead7] md:text-3xl">{portraitB.title}</div>
                  <div className="font-lv-serif text-xs italic text-[#c9a86a] md:text-base">
                    {portraitB.subtitle}
                  </div>
                </div>
              </button>

              <button
                onClick={() => setActive(start + 2)}
                className="group relative col-span-2 aspect-[16/9] overflow-hidden bg-[#1a1410]"
              >
                <img
                  src={horizontal.src}
                  alt={`${horizontal.title} — ${horizontal.subtitle}`}
                  className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                <div className="absolute top-3 left-3 font-lv-bebas text-sm tracking-[0.3em] text-[#f3ead7] mix-blend-difference md:top-4 md:left-4">
                  {horizontal.number}
                </div>
                <div className="absolute top-3 right-3 font-lv-bebas text-[10px] tracking-[0.3em] text-[#f3ead7]/80 mix-blend-difference md:top-4 md:right-4">
                  {horizontal.region}
                </div>
                <div className="absolute bottom-0 left-0 right-0 translate-y-2 p-3 text-left opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100 md:p-5">
                  <div className="font-lv-bebas text-2xl text-[#f3ead7] md:text-3xl">{horizontal.title}</div>
                  <div className="font-lv-serif text-xs italic text-[#c9a86a] md:text-base">
                    {horizontal.subtitle}
                  </div>
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {active !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 md:p-12"
          onClick={() => setActive(null)}
        >
          <button
            className="absolute top-6 right-6 font-lv-bebas text-sm tracking-[0.3em] text-[#f3ead7] hover:text-[#c9a86a]"
            onClick={() => setActive(null)}
          >
            CLOSE ✕
          </button>
          <button
            className="absolute left-3 top-1/2 -translate-y-1/2 font-lv-bebas text-4xl text-[#f3ead7] hover:text-[#c9a86a] md:left-8"
            onClick={(e) => {
              e.stopPropagation();
              setActive((active - 1 + gallery.length) % gallery.length);
            }}
          >
            ←
          </button>
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 font-lv-bebas text-4xl text-[#f3ead7] hover:text-[#c9a86a] md:right-8"
            onClick={(e) => {
              e.stopPropagation();
              setActive((active + 1) % gallery.length);
            }}
          >
            →
          </button>
          <div
            className="grid max-h-[90vh] w-full max-w-6xl grid-cols-1 gap-6 overflow-auto md:grid-cols-5 md:gap-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="md:col-span-3">
              <img loading="lazy" decoding="async"
                src={gallery[active].src}
                alt={gallery[active].title}
                className="max-h-[80vh] w-full object-contain"
              />
            </div>
            <div className="flex flex-col justify-center text-[#f3ead7] md:col-span-2">
              <div className="font-lv-bebas text-[10px] tracking-[0.5em] text-[#c9a86a]">
                {gallery[active].number} · {gallery[active].region}
              </div>
              <h3 className="mt-3 font-lv-bebas text-5xl text-[#f3ead7] md:text-6xl">
                {gallery[active].title}
              </h3>
              <p className="mt-2 font-lv-serif text-xl italic text-[#c9a86a]">
                {gallery[active].subtitle}
              </p>
              <div className="my-5 h-px w-12 bg-[#c9a86a]" />
              <p className="font-lv-serif text-lg leading-relaxed text-[#f3ead7]/80">
                {gallery[active].description}
              </p>
              <div className="mt-6 font-lv-bebas text-[10px] tracking-[0.4em] text-[#c9a86a]">
                {String(active + 1).padStart(2, "0")} / {String(gallery.length).padStart(2, "0")}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

const Story = () => {
  return (
    <section id="lv-story" className="relative h-[80vh] min-h-[500px] w-full overflow-hidden">
      <img loading="lazy" decoding="async"
        src="/images/09-the-dusk-ride.webp"
        alt="Two riders at dusk in the Bushveld"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center text-[#f3ead7]">
        <div className="font-lv-bebas text-[10px] tracking-[0.5em] text-[#c9a86a]">THE STORY</div>
        <h2 className="mt-4 font-lv-bebas text-6xl leading-[0.9] md:text-9xl">
          The Outlaw<br />
          <span className="text-[#c9a86a]">Became Outlandish.</span>
        </h2>
        <p className="mt-6 max-w-2xl font-lv-serif text-lg italic text-[#f3ead7]/90 md:text-2xl">
          Zulu and Basotho, divided by the Drakensberg. They crossed the mountain to take what
          was not theirs. <span className="text-[#c9a86a]">Outlandish</span> reimagines that crossing
          in Louis Vuitton.
        </p>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <div className="border-t border-[#f3ead7]/10 bg-[#0e0c0a] py-6">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 md:flex-row md:px-8">
        <div className="flex items-center gap-3">
          <div className="text-[#f3ead7]">
            <LV className="text-base" />
          </div>
          <span className="font-lv-bebas text-xs tracking-[0.35em] text-[#f3ead7]">OUTLANDISH</span>
        </div>
        <div className="font-lv-bebas text-[10px] tracking-[0.35em] text-[#f3ead7]/60">
          © 2026 · A LOUIS VUITTON CONCEPT · MADE IN SOUTH AFRICA
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <div className="min-h-screen bg-[#0e0c0a] text-[#f3ead7]">
      <ScrollProgress />
      <Hero />
      <Lookbook />
      <Story />
      <Footer />
    </div>
  );
}
