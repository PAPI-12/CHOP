import { useEffect } from "react";
import VideoEmbed from "../VideoEmbed";
import { useScrollLock } from "../../hooks/useScrollLock";

type Item = {
  id: string;
  kind: "video" | "image";
  src: string;
  label: string;
  caption: string;
  prompt?: string;
  technique?: string;
};

type Props = {
  item: Item;
  ytId: string;
  onClose: () => void;
};

export default function PieceModal({ item, ytId, onClose }: Props) {
  // Locks the page without letting it slide sideways as the scrollbar goes.
  useScrollLock();

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div className="audi-fade-in fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-md sm:items-center">
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className="audi-slide-up relative z-10 flex w-full flex-col overflow-hidden border border-[#f2e8dc]/10 bg-[#171411] sm:max-w-4xl sm:flex-row"
        style={{ maxHeight: "90svh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* min-h-0 so this pane may actually shrink inside the flex row —
            without it a flex item refuses to go below its content size and
            pushes the panel past its own max-height. */}
        <div className="relative min-h-0 flex-1 overflow-hidden bg-black" style={{ minHeight: 260 }}>
          {item.kind === "video" ? (
            <div className="aspect-video w-full" style={{ minHeight: 260 }}>
              <VideoEmbed id={ytId} title="Audi — A Curated Collection, campaign film" autoPlay />
            </div>
          ) : (
            <img loading="lazy" decoding="async"
              src={item.src}
              alt={item.label}
              className="h-full w-full object-cover"
            />
          )}
        </div>

        {/* Caption, prompt, technique and credits together run taller than a
            laptop viewport allows the panel to be, and the panel clips. Let
            the column scroll rather than silently swallowing the end of it. */}
        <div className="flex min-h-0 shrink-0 flex-col justify-between overflow-y-auto overscroll-contain border-t border-[#f2e8dc]/10 p-7 sm:w-72 sm:border-l sm:border-t-0 sm:p-9">
          <div className="mb-7 flex items-start justify-between">
            <span className="font-audi-sans text-[10px] uppercase tracking-widest text-[#d0a36f]">
              {item.label}
            </span>
            <button
              onClick={onClose}
              className="font-audi-sans text-xs text-[#f2e8dc]/35 transition-colors hover:text-[#f2e8dc]"
            >
              Close
            </button>
          </div>

          <div className="flex flex-1 flex-col gap-7">
            <p className="font-audi-serif-body text-lg leading-relaxed text-[#f2e8dc]/85">
              {item.caption}
            </p>

            {item.prompt && (
              <div>
                <p className="font-audi-sans mb-2 text-[9px] uppercase tracking-[0.25em] text-[#f2e8dc]/30">
                  Generative Prompt
                </p>
                <p className="font-audi-serif-body text-sm italic leading-relaxed text-[#f2e8dc]/55">
                  "{item.prompt}"
                </p>
              </div>
            )}

            {item.technique && (
              <div>
                <p className="font-audi-sans mb-1 text-[9px] uppercase tracking-[0.25em] text-[#f2e8dc]/30">
                  AI Technique
                </p>
                <p className="font-audi-sans text-xs font-medium leading-relaxed text-[#f2e8dc]/70">
                  {item.technique}
                </p>
              </div>
            )}
          </div>

          <div className="mt-8 border-t border-[#f2e8dc]/10 pt-5">
            <p className="font-audi-sans text-[9px] uppercase tracking-widest text-[#f2e8dc]/25">
              Audi SA / Ogilvy SA / Monkey Donkey
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
