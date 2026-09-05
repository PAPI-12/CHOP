import { useEffect } from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const responsibilities = [
  {
    title: "Prompt Architecture",
    body: "Crafted generative prompts specifying lighting, material, surface reflectivity and Audi's design language, translating brand DNA into visual inputs.",
  },
  {
    title: "Curatorial Direction",
    body: "Iterated through hundreds of AI drafts until each image felt genuinely curated, not generated. Trial, error, and considered craft.",
  },
  {
    title: "Navigating AI Boundaries",
    body: "Identified and worked around current AI motion and fidelity limitations, blending generative assets with real Audi vehicle photography.",
  },
  {
    title: "Brand Alignment",
    body: "Ensured every visual metaphor, from fashion to architecture and nature, directly reflected Audi's brand values and the South African driver's aspirations.",
  },
];

export default function RoleModal({ isOpen, onClose }: Props) {
  useEffect(() => {
    if (!isOpen) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", h);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="audi-fade-in fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-md sm:items-center">
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className="audi-slide-up relative z-10 w-full overflow-y-auto border border-[#f2e8dc]/10 bg-[#171411] sm:max-w-2xl"
        style={{ maxHeight: "90svh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#f2e8dc]/10 px-8 py-5 sm:px-10">
          <span className="font-audi-sans text-[10px] uppercase tracking-[0.25em] text-[#d0a36f]">
            Creative Credits
          </span>
          <button
            onClick={onClose}
            className="font-audi-sans text-xs text-[#f2e8dc]/35 underline underline-offset-4 transition-colors hover:text-[#f2e8dc]"
          >
            Close
          </button>
        </div>

        <div className="px-8 py-8 sm:px-10 sm:py-10">
          <p className="font-audi-sans mb-2 text-[10px] uppercase tracking-[0.25em] text-[#f2e8dc]/35">
            A Curated Collection / Inspired by Audi
          </p>
          <h2 className="font-audi-serif mb-8 text-4xl font-extrabold leading-[1.02] tracking-[-0.03em] text-[#f2e8dc] sm:text-5xl">
            AI Creative<br />and Prompt Director
          </h2>

          <div className="mb-10 grid grid-cols-3 divide-x divide-[#f2e8dc]/10 border border-[#f2e8dc]/10">
            {[
              {label:"Client",    val:"Audi South Africa"},
              {label:"Agency",    val:"Ogilvy SA"},
              {label:"AI Studio", val:"Monkey Donkey"},
            ].map(c => (
              <div key={c.label} className="p-4 sm:p-5">
                <p className="font-audi-sans mb-1 text-[9px] uppercase tracking-widest text-[#f2e8dc]/30">
                  {c.label}
                </p>
                <p className="font-audi-sans text-sm font-medium text-[#f2e8dc]">
                  {c.val}
                </p>
              </div>
            ))}
          </div>

          <p className="font-audi-serif-body mb-8 text-lg leading-relaxed text-[#f2e8dc]/75">
            As Lead AI Creative, I translated Audi's design language, from black grilles and matrix LED lights to chrome accents, into precise generative prompts. Working alongside Ogilvy SA and Monkey Donkey, I guided hundreds of AI iterations to craft cinematic worlds spanning fashion, architecture, nature and art.
          </p>

          <div className="mb-10 divide-y divide-[#f2e8dc]/10 border-t border-[#f2e8dc]/10">
            {responsibilities.map((r, i) => (
              <div key={r.title} className="flex gap-5 py-5">
                <span className="font-audi-sans mt-0.5 w-4 shrink-0 text-[10px] text-[#d0a36f]/70">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="font-audi-serif mb-1 text-base font-bold text-[#f2e8dc]">
                    {r.title}
                  </p>
                  <p className="font-audi-serif-body text-sm leading-relaxed text-[#f2e8dc]/55">
                    {r.body}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mb-10 border-l-2 border-[#d0a36f]/40 pl-6">
            <p className="font-audi-serif-body text-lg italic leading-relaxed text-[#f2e8dc]/70">
              "Employing AI was similar to perfecting an art piece through multiple drafts, a series of considered and crafted instructions with multiple iterations that finally lead to the perfect image, done repeatedly."
            </p>
            <p className="font-audi-sans mt-3 text-[9px] uppercase tracking-widest text-[#f2e8dc]/30">
              Riaan van Wyk / Head of Creative, Ogilvy SA
            </p>
          </div>

          <button
            onClick={onClose}
            className="font-audi-sans w-full border border-[#f2e8dc]/15 py-4 text-xs uppercase tracking-widest text-[#f2e8dc]/40 transition-all duration-300 hover:border-[#f2e8dc]/40 hover:text-[#f2e8dc]"
          >
            Back to the Collection
          </button>
        </div>
      </div>
    </div>
  );
}
