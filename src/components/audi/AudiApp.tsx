import { useState } from "react";
import PieceModal from './PieceModal';
import RoleModal from './RoleModal';
import { thumbLadder } from '../VideoEmbed';

/**
 * Not every upload publishes a maxres still — the campaign film's tile used
 * to render as a broken rectangle because of it. Walk YouTube's ladder down
 * until something actually resolves.
 */
const ytPosterFallback = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const el = e.currentTarget;
  const match = el.src.match(/\/vi\/([^/]+)\//);
  if (!match) return;
  const ladder = thumbLadder(match[1]);
  const next = ladder[ladder.indexOf(el.src) + 1];
  if (next) el.src = next;
};

const YT_ID = "Bb47k78sqvw";

type Item = {
  id: string;
  kind: "video" | "image";
  src: string;
  label: string;
  caption: string;
  prompt?: string;
  technique?: string;
};

const items: Item[] = [
  {
    id: "film",   kind: "video",
    src: `https://i.ytimg.com/vi/${YT_ID}/maxresdefault.jpg`,
    label: "Campaign Film",
    caption:
      "The whole collection in motion — grille geometry migrating from the car into fashion, furniture, architecture and planting, then back again.",
    prompt:
      "Cinematic sequence. Singleframe honeycomb geometry morphing between a car grille, a woven gown, a garden screen and a lit pavilion. Low key, patient camera.",
    technique: "AI Video Synthesis & Iterative Multimodal Prompting",
  },
  {
    id: "p01",   kind: "image",
    src: "/images/audi-01.webp",
    label: "The Bench",
    caption:
      "The Singleframe, drawn once in polished steel and left to stand on its own. No car, no badge \u2014 just the outline everyone already recognises, holding up a bench against a wall of black glass.",
    prompt:
      "Minimal chrome bench whose backrest is the outline of an Audi Singleframe grille, black glass curtain wall behind, hard afternoon sun across pale stone.",
    technique: "Form Reduction & Product Concepting",
  },
  {
    id: "p02",   kind: "image",
    src: "/images/audi-02.webp",
    label: "The Source",
    caption:
      "Where every other piece in this collection comes from: gloss black honeycomb, a chrome-edged quattro badge, and the cold segmented glass of the Matrix LED cluster.",
    prompt:
      "Macro three-quarter of a black Audi nose. Honeycomb Singleframe, quattro badge, Matrix LED optics, cool specular highlights, dark studio haze.",
    technique: "Macro Generative Texture Synthesis",
  },
  {
    id: "p03",   kind: "image",
    src: "/images/audi-03.webp",
    label: "Woven",
    caption:
      "The grille rewoven as cloth. A hand-linked honeycomb gown on a runway flanked by chrome fins \u2014 the same lattice, this time cut for a body.",
    prompt:
      "Editorial runway. Model in a black honeycomb mesh gown, oversized chrome grille-fin sculptures lining the walk, warm rim light, shallow depth of field.",
    technique: "Parametric AI Fashion Generation",
  },
  {
    id: "p04",   kind: "image",
    src: "/images/audi-04.webp",
    label: "The Plinth",
    caption:
      "A parametric hall built from one repeating cell, daylight falling through a woven oculus onto an empty stone plinth. The room is the exhibit; the car never arrives.",
    prompt:
      "Vast pale parametric interior, ribbed vault, woven skylight oculus, empty circular stone plinth, soft daylight, polished concrete floor.",
    technique: "AI Architectural Concepting",
  },
  {
    id: "p05",   kind: "image",
    src: "/images/audi-05.webp",
    label: "Planted",
    caption:
      "Honeycomb as a garden wall. Gloss black cells turned into planters, filled with indigenous growth and caught in low golden light \u2014 engineering handing itself over to something living.",
    prompt:
      "Gloss black honeycomb garden screen with plants growing through the cells, concrete edging, late golden hour, warm backlight through foliage.",
    technique: "Natural Organic AI Texture Synthesis",
  },
  {
    id: "p06",   kind: "image",
    src: "/images/audi-06.webp",
    label: "Light Signature",
    caption:
      "A pavilion drawn as one continuous daytime running light. The house wears the car\u2019s signature at dusk, doubled in still water and warm from the inside out.",
    prompt:
      "Forest pavilion wrapped in a single continuous glowing LED frame, floor-to-ceiling glass, warm interior, dusk sky, reflecting pool.",
    technique: "Generative Atmosphere & Light Architecture",
  },
  {
    id: "p07",   kind: "image",
    src: "/images/audi-07.webp",
    label: "Carried",
    caption:
      "Quilted in the grille\u2019s own pattern. High-gloss hexagon padding on structured black leather, photographed against the panelling it borrows from.",
    prompt:
      "Black patent leather tote quilted in glossy hexagonal cells, hexagon wall panelling behind, single hard key light, luxury product still life.",
    technique: "Material & Product Prompt Engineering",
  },
  {
    id: "p08",   kind: "image",
    src: "/images/audi-08.webp",
    label: "Innovation",
    caption:
      "Half resolved, half still computing. The body assembles itself out of a point cloud under a single overhead light \u2014 the campaign showing its own working.",
    prompt:
      "Dark hall. Executive coupe half solid gloss black, half dissolving into a glowing white wireframe point cloud, volumetric spotlight, wet reflective floor.",
    technique: "Generative Mesh & Point-Cloud Synthesis",
  },
  {
    id: "p09",   kind: "image",
    src: "/images/audi-09.webp",
    label: "Black Edition",
    caption:
      "Shot from below against concrete punched with the same hexagon. Scaled black bodysuit, white frames, full daylight \u2014 the Black Edition wearing itself in public.",
    prompt:
      "Low-angle fashion portrait, model in a scaled black honeycomb bodysuit and white sunglasses, brutalist concrete facade with hexagonal voids, hard midday sun.",
    technique: "Character & Fashion Style Tuning",
  },
  {
    id: "p10",   kind: "image",
    src: "/images/audi-10.webp",
    label: "Seating",
    caption:
      "Two moulded shells in a shaft of afternoon light. Nothing left but the line the car is known for \u2014 one in bone white, one in graphite.",
    prompt:
      "Two sculptural moulded chairs, one white one charcoal, against a concrete panel wall, hard diagonal shaft of daylight, long shadows.",
    technique: "3D Form Generative Prompting",
  },
];

/* ─── small reusable image tile ─────────────────────── */
function Tile({
  item,
  onClick,
  className = "",
  children,
}: {
  item: Item;
  onClick: () => void;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    // A tile is a control, so it answers to the keyboard as well as the
    // mouse. role + tabIndex rather than a real <button> so the grid's
    // sizing is untouched.
    <div
      role="button"
      tabIndex={0}
      aria-label={`View ${item.label}`}
      className={`relative overflow-hidden cursor-pointer audi-img-zoom group ${className}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <img
        src={item.src}
        alt={item.label}
        className="w-full h-full object-cover"
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={ytPosterFallback}
      />
      {/* subtle darkening on hover */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-500 pointer-events-none" />
      {/* play icon for video */}
      {item.kind === "video" && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center group-hover:bg-white transition-colors duration-300">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#1a1410] ml-0.5">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

/* ─── App ─────────────────────────────────────────── */
export default function App() {
  const [selected, setSelected] = useState<Item | null>(null);
  const [roleOpen, setRoleOpen] = useState(false);

  const open = (item: Item) => setSelected(item);
  const close = () => setSelected(null);

  const [film, p01, p02, p03, p04, p05, p06, p07, p08, p09, p10] = items;

  return (
    <div className="min-h-screen bg-[#11100e] text-[#f2e8dc]">
      <header className="flex items-center justify-between border-b border-[#f2e8dc]/10 px-6 py-6 sm:px-10">
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 88 20" className="h-4 w-auto text-[#f2e8dc]">
            {[10, 30, 50, 70].map((cx) => (
              <circle
                key={cx}
                cx={cx}
                cy="10"
                r="9.6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
              />
            ))}
          </svg>
        </div>

        <p className="font-audi-serif-body hidden text-sm tracking-wide text-[#f2e8dc]/55 sm:block">
          A Curated Collection
        </p>

        <button
          onClick={() => setRoleOpen(true)}
          className="font-audi-sans text-xs text-[#f2e8dc]/50 underline decoration-[#f2e8dc]/20 underline-offset-4 transition-all duration-300 hover:text-[#f2e8dc] hover:decoration-[#f2e8dc]/60"
        >
          My Role as AI Creative
        </button>
      </header>

      {/* The campaign film is the single, dominant opening image. */}
      <section className="relative h-[86svh] min-h-[580px] max-h-[900px]">
        <Tile item={film} onClick={() => open(film)} className="h-full w-full">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/20" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-7 p-7 sm:flex-row sm:items-end sm:justify-between sm:p-12 lg:p-16">
            <div>
              <p className="font-audi-sans mb-3 text-[10px] uppercase tracking-[0.25em] text-white/55">
                Campaign Film / Audi South Africa / 2024
              </p>
              <h1 className="font-audi-serif text-5xl font-extrabold leading-[0.92] tracking-[-0.04em] text-white sm:text-7xl lg:text-8xl">
                A Curated<br />
                <em className="font-medium">Collection</em>
              </h1>
            </div>
            <p className="font-audi-serif-body max-w-sm text-base leading-relaxed text-white/65 sm:text-right sm:text-lg">
              An AI-powered campaign that lifts one shape \u2014 the Singleframe honeycomb \u2014 out of the car and lets it furnish an entire world.
            </p>
          </div>
        </Tile>
      </section>

      <section className="grid grid-cols-2" style={{ height: "62svh", maxHeight: 560 }}>
        <Tile item={p01} onClick={() => open(p01)} className="h-full">
          <div className="absolute left-5 top-5">
            <span className="font-audi-sans bg-[#f2e8dc]/90 px-2.5 py-1 text-[10px] uppercase tracking-widest text-[#171411] backdrop-blur-sm">
              {p01.label}
            </span>
          </div>
        </Tile>

        <Tile item={p02} onClick={() => open(p02)} className="h-full">
          <div className="absolute bottom-5 left-5">
            <span className="font-audi-sans bg-[#f2e8dc]/90 px-2.5 py-1 text-[10px] uppercase tracking-widest text-[#171411]">
              {p02.label}
            </span>
          </div>
        </Tile>
      </section>

      <section className="grid grid-cols-1 border-y border-[#f2e8dc]/10 sm:grid-cols-3">
        <div className="flex flex-col gap-3 border-b border-[#f2e8dc]/10 px-8 py-10 sm:border-b-0 sm:border-r sm:px-10 sm:py-12">
          <p className="font-audi-sans text-[10px] uppercase tracking-[0.25em] text-[#f2e8dc]/35">
            Audi South Africa / March 2024
          </p>
          <p className="font-audi-serif-body text-xl leading-relaxed text-[#f2e8dc]/80 sm:text-2xl">
            A ground-breaking AI-powered campaign for the Urban and Black Editions, tailored exclusively for South Africa: eleven pieces, one piece of geometry.
          </p>
        </div>

        <div className="flex flex-col justify-center border-b border-[#f2e8dc]/10 px-8 py-10 sm:border-b-0 sm:border-r sm:px-10 sm:py-12">
          <span className="font-audi-serif select-none text-5xl leading-none text-[#d0a36f]/35">&ldquo;</span>
          <p className="font-audi-serif-body -mt-3 text-lg italic leading-relaxed text-[#f2e8dc]/85 sm:text-xl">
            Like perfecting an art piece through multiple drafts: trial, error, and considered craft.
          </p>
          <p className="font-audi-sans mt-4 text-[10px] uppercase tracking-[0.2em] text-[#f2e8dc]/35">
            Riaan van Wyk / Ogilvy SA
          </p>
        </div>

        <button
          className="group flex flex-col justify-between gap-6 px-8 py-10 text-left sm:px-10 sm:py-12"
          onClick={() => setRoleOpen(true)}
        >
          <div>
            <p className="font-audi-sans mb-3 text-[10px] uppercase tracking-[0.25em] text-[#d0a36f]">
              Creative Credits
            </p>
            <h2 className="font-audi-serif text-3xl font-bold leading-[1.05] tracking-[-0.02em] text-[#f2e8dc] sm:text-4xl">
              AI Creative<br />and Prompt<br />Director
            </h2>
          </div>
          <span className="font-audi-sans flex items-center gap-2 text-xs uppercase tracking-widest text-[#f2e8dc]/40 transition-colors group-hover:text-[#d0a36f]">
            Read more <span className="inline-block h-px w-6 bg-current transition-transform group-hover:translate-x-1" />
          </span>
        </button>
      </section>

      <section className="grid grid-cols-2" style={{ height: "62svh", maxHeight: 560 }}>
        <Tile item={p03} onClick={() => open(p03)} className="h-full">
          <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/65 via-transparent to-transparent p-7 sm:p-9">
            <h2 className="font-audi-serif text-2xl font-bold leading-none tracking-[-0.02em] text-white sm:text-4xl">
              The Grille,<br />Rewoven
            </h2>
            <p className="font-audi-sans mt-2 text-[10px] uppercase tracking-widest text-white/50">
              Fashion / Honeycomb Couture
            </p>
          </div>
        </Tile>
        <Tile item={p04} onClick={() => open(p04)} className="h-full">
          <div className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-black/60 via-transparent to-transparent p-7 sm:p-9">
            <div>
              <h2 className="font-audi-serif text-2xl font-bold tracking-[-0.02em] text-white sm:text-4xl">The Empty Plinth</h2>
              <p className="font-audi-sans mt-2 text-[10px] uppercase tracking-widest text-white/50">Architecture / One Repeating Cell</p>
            </div>
          </div>
        </Tile>
      </section>

      <section style={{ height: "58svh", maxHeight: 540 }}>
        <Tile item={p05} onClick={() => open(p05)} className="h-full w-full">
          <div className="absolute left-5 top-5">
            <span className="font-audi-sans bg-[#f2e8dc]/90 px-2.5 py-1 text-[10px] uppercase tracking-widest text-[#171411]">
              {p05.label}
            </span>
          </div>
        </Tile>
      </section>

      <section className="grid grid-cols-2" style={{ height: "62svh", maxHeight: 560 }}>
        <Tile item={p06} onClick={() => open(p06)} className="h-full">
          <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-transparent to-transparent p-7 sm:p-9">
            <h2 className="font-audi-serif text-2xl font-bold leading-none tracking-[-0.02em] text-white sm:text-4xl">
              A House Wearing<br />Its Own Lights
            </h2>
            <p className="font-audi-sans mt-2 text-[10px] uppercase tracking-widest text-white/50">Architecture / Dusk</p>
          </div>
        </Tile>
        <Tile item={p07} onClick={() => open(p07)} className="h-full">
          <div className="absolute bottom-5 left-5">
            <span className="font-audi-sans bg-[#f2e8dc]/90 px-2.5 py-1 text-[10px] uppercase tracking-widest text-[#171411]">
              {p07.label}
            </span>
          </div>
        </Tile>
      </section>

      <section className="grid grid-cols-2" style={{ height: "62svh", maxHeight: 560 }}>
        <Tile item={p08} onClick={() => open(p08)} className="h-full">
          <div className="absolute inset-0 flex flex-col justify-center bg-gradient-to-r from-black/65 via-black/25 to-transparent px-7 sm:px-10">
            <p className="font-audi-serif-body max-w-[290px] text-lg italic leading-relaxed text-white sm:text-xl">
              "By harnessing AI, we are reaffirming our commitment to innovation."
            </p>
            <p className="font-audi-sans mt-3 text-[10px] uppercase tracking-widest text-white/45">
              Tarryn Knight / Audi South Africa
            </p>
          </div>
        </Tile>
        <Tile item={p09} onClick={() => open(p09)} className="h-full">
          <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-transparent to-transparent p-7 sm:p-9">
            <div>
              <h2 className="font-audi-serif text-2xl font-bold tracking-[-0.02em] text-white sm:text-4xl">Scaled &amp; Sunlit</h2>
              <p className="font-audi-sans mt-2 text-[10px] uppercase tracking-widest text-white/50">Fashion / Black Edition</p>
            </div>
          </div>
        </Tile>
      </section>

      <section className="grid grid-cols-2" style={{ height: "55svh", maxHeight: 500 }}>
        <Tile item={p10} onClick={() => open(p10)} className="h-full">
          <div className="absolute right-5 top-5">
            <span className="font-audi-sans bg-[#f2e8dc]/90 px-2.5 py-1 text-[10px] uppercase tracking-widest text-[#171411]">
              {p10.label}
            </span>
          </div>
        </Tile>

        <div className="flex h-full flex-col justify-between bg-[#1c1814] p-8 sm:p-12">
          <div>
            <svg viewBox="0 0 88 20" className="mb-8 h-3.5 w-auto text-[#f2e8dc]/55">
              {[10, 30, 50, 70].map((cx) => (
                <circle key={cx} cx={cx} cy="10" r="9.6" fill="none" stroke="currentColor" strokeWidth="1.4" />
              ))}
            </svg>
            <h2 className="font-audi-serif text-2xl font-bold leading-tight tracking-[-0.02em] text-[#f2e8dc] sm:text-4xl">
              One grille, rebuilt as<br />furniture, couture,<br />architecture and<br />
              <em className="font-medium">a planted wall.</em>
            </h2>
          </div>
          <div className="flex flex-col gap-3">
            <p className="font-audi-sans text-[10px] uppercase tracking-widest text-[#f2e8dc]/35">
              Ogilvy SA / Monkey Donkey / Audi SA
            </p>
            <a
              href="https://www.audi.co.za"
              target="_blank"
              rel="noreferrer"
              className="font-audi-sans w-fit text-[10px] uppercase tracking-widest text-[#f2e8dc]/40 underline decoration-[#f2e8dc]/20 underline-offset-4 transition-colors hover:text-[#f2e8dc]"
            >
              Explore at audi.co.za
            </a>
          </div>
        </div>
      </section>

      <div className="border-t border-[#f2e8dc]/10">
        <div className="grid grid-cols-2 divide-x divide-[#f2e8dc]/10 sm:grid-cols-4">
          {[
            { h: "Portfolio", s: "AI Generative Campaign" },
            { h: "March 2024", s: "Johannesburg, South Africa" },
            { h: "11 Pieces", s: "01 Film / 10 Visuals" },
            { h: "AI Creative", s: "Prompt Direction and Curation" },
          ].map((f) => (
            <div key={f.h} className="px-6 py-7 sm:px-8 sm:py-8">
              <p className="font-audi-serif text-base font-bold text-[#f2e8dc] sm:text-lg">{f.h}</p>
              <p className="font-audi-sans mt-1 text-[10px] uppercase tracking-widest text-[#f2e8dc]/30">{f.s}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-start justify-between gap-3 border-t border-[#f2e8dc]/10 px-6 py-5 sm:flex-row sm:items-center sm:px-10">
          <p className="font-audi-sans text-[10px] uppercase tracking-widest text-[#f2e8dc]/25">
            2024 / A Curated Collection / Inspired by Audi
          </p>
          <div className="flex items-center gap-6">
            <button
              onClick={() => setRoleOpen(true)}
              className="font-audi-sans text-[10px] uppercase tracking-widest text-[#f2e8dc]/40 underline underline-offset-4 transition-colors hover:text-[#f2e8dc]"
            >
              AI Creative Role
            </button>
            <a
              href={`https://www.youtube.com/watch?v=${YT_ID}`}
              target="_blank"
              rel="noreferrer"
              className="font-audi-sans text-[10px] uppercase tracking-widest text-[#f2e8dc]/40 underline underline-offset-4 transition-colors hover:text-[#f2e8dc]"
            >
              Watch Film
            </a>
          </div>
        </div>
      </div>

      {selected && (
        <PieceModal item={selected} ytId={YT_ID} onClose={close} />
      )}
      <RoleModal isOpen={roleOpen} onClose={() => setRoleOpen(false)} />
    </div>
  );
}
