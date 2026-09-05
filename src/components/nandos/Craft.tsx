const SWATCHES = [
  { name: "Ember", hex: "#E63525", note: "Peri heat" },
  { name: "Flame", hex: "#F04E23", note: "Flex" },
  { name: "Grape", hex: "#6A13A1", note: "Neon nights" },
  { name: "Lime", hex: "#B8FF2E", note: "Sneaker pop" },
  { name: "Butter", hex: "#F6C945", note: "Gold chain" },
];

export default function Craft() {
  return (
    <section id="nandos-craft" className="bg-[#f5efe4] py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="reveal mb-12 max-w-3xl">
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.25em] text-[#e63525]">
            / Craft
          </p>
          <h2 className="font-nandos-display text-4xl uppercase leading-[0.9] md:text-6xl">
            The <span className="text-[#e63525]">Loud</span> Language
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-[#171412]/75">
            A deliberately maximalist palette borrowed straight from sneaker
            culture and late-night city lights. Nothing muted. Everything
            brazen.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Colour system */}
          <div className="reveal rounded-3xl border-2 border-[#171412] bg-[#fbf6ec] p-7">
            <p className="mb-6 text-[11px] font-bold uppercase tracking-[0.2em] text-[#171412]/45">
              Colour System
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {SWATCHES.map((s) => (
                <div
                  key={s.hex}
                  className="group flex flex-col overflow-hidden rounded-2xl border-2 border-[#171412]"
                >
                  <div
                    className="h-20 transition-transform group-hover:scale-105"
                    style={{ backgroundColor: s.hex }}
                  />
                  <div className="bg-[#fbf6ec] p-2 text-[11px] font-bold uppercase leading-tight">
                    <span>{s.name}</span>
                    <span className="block font-mono normal-case text-[#171412]/45">
                      {s.hex} · {s.note}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Type system */}
          <div className="reveal flex flex-col justify-between rounded-3xl border-2 border-[#171412] bg-[#171412] p-7 text-[#f5efe4]">
            <div>
              <p className="mb-6 text-[11px] font-bold uppercase tracking-[0.2em] text-[#f5efe4]/45">
                Type System
              </p>
              <p className="font-nandos-display text-6xl uppercase leading-none">
                Anton
              </p>
              <p className="mt-2 font-mono text-sm text-[#f5efe4]/60">
                Condensed display / all-caps energy
              </p>
            </div>
            <div className="mt-8 space-y-6">
              <div>
                <p className="font-mono text-xs text-[#f5efe4]/50">Body</p>
                <p className="mt-1 text-3xl font-extrabold tracking-tight">
                  Archivo — Bold, honest, street.
                </p>
              </div>
              <div>
                <p className="font-mono text-xs text-[#f5efe4]/50">Voiceover / labels</p>
                <p className="mt-1 font-mono text-xl text-[#f6c945]">
                  Space Mono — the fine print flex.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
