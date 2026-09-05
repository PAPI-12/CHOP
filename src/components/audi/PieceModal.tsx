import { useEffect } from "react";

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
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", h);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="audi-fade-in fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-md sm:items-center">
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className="audi-slide-up relative z-10 flex w-full flex-col overflow-hidden border border-[#f2e8dc]/10 bg-[#171411] sm:max-w-4xl sm:flex-row"
        style={{ maxHeight: "90svh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex-1 overflow-hidden bg-black" style={{ minHeight: 260 }}>
          {item.kind === "video" ? (
            <iframe
              className="aspect-video w-full"
              style={{ minHeight: 260, height: "100%" }}
              src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1`}
              title="Campaign Film"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <img loading="lazy" decoding="async"
              src={item.src}
              alt={item.label}
              className="h-full w-full object-cover"
            />
          )}
        </div>

        <div className="flex shrink-0 flex-col justify-between border-t border-[#f2e8dc]/10 p-7 sm:w-72 sm:border-l sm:border-t-0 sm:p-9">
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
