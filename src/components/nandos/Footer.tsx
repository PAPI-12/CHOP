export default function Footer() {
  return (
    <div className="bg-[#f5efe4]">
      {/* CTA strip */}
      <div className="border-t-2 border-[#171412] bg-[#ff5a2c] overflow-hidden">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-5 py-14 sm:px-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-[#f5efe4]/70">
              Next project →
            </p>
            <a
              href="#nandos-top"
              className="font-nandos-display text-5xl uppercase leading-none text-[#f5efe4] hover:underline md:text-7xl"
            >
              Back to Boujee
            </a>
          </div>
          <a
            href="#nandos-top"
            className="rounded-full border-2 border-[#f5efe4] px-6 py-3 text-sm font-bold uppercase tracking-[0.2em] text-[#f5efe4] transition-colors hover:bg-[#f5efe4] hover:text-[#171412]"
          >
            ↑ Scroll top
          </a>
        </div>
      </div>

      {/* Base */}
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 text-[11px] font-bold uppercase tracking-[0.2em] text-[#171412]/50">
          <span>
            Nando&rsquo;s Boujee Bowl · Portfolio
          </span>
          <span>Art Direction · 2019</span>
        </div>
        <p className="mt-6 max-w-2xl text-xs leading-relaxed text-[#171412]/40">
          Portfolio case-study concept. All credits and references belong to
          Nando&rsquo;s, M&amp;C Saatchi Abel and the original campaign. Built
          as a personal art-direction showcase.
        </p>
      </div>
    </div>
  );
}
