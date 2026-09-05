export default function Hero() {
  return (
    <section
      id="nandos-top"
      className="relative overflow-hidden bg-[#171412] text-[#f5efe4] pt-14 pb-14"
    >
      <div className="grain absolute inset-0" />
      {/* Diagonal colour burst */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(244,78,35,0.55),transparent_62%)] blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -left-24 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(154,44,161,0.4),transparent_62%)] blur-2xl"
      />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="stagger mb-10 flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.25em] text-[#f5efe4]/70">
          <span className="rounded-full border border-[#f5efe4]/25 px-3 py-1">Case Study</span>
          <span className="rounded-full border border-[#f5efe4]/25 px-3 py-1">Art Direction</span>
          <span className="rounded-full border border-[#f5efe4]/25 px-3 py-1">M&amp;C Saatchi Abel</span>
          <span className="rounded-full border border-[#f5efe4]/25 px-3 py-1">2019</span>
        </div>

        <h1 className="font-nandos-display uppercase leading-[0.86]">
          <span className="block text-[clamp(4rem,13vw,11rem)] text-[#f5efe4]">Nando&rsquo;s</span>
          <span className="block nandos-outline-white text-[clamp(3rem,10vw,8.5rem)]">
            Boujee&nbsp;Bowl
          </span>
        </h1>

        <div className="mt-10 grid gap-8 md:grid-cols-12">
          <p
            className="max-w-xl text-lg font-medium text-[#f5efe4]/85 text-pretty md:col-span-7 md:text-2xl"
          >
            How do you talk to the youth in a cool way — without doing
            the politics? We found a way to laugh at ourselves.
          </p>
          <div className="flex items-end md:col-span-5 md:justify-end">
            <a
              href="#nandos-film"
              className="group inline-flex items-center gap-4 rounded-full border-2 border-[#f5efe4] px-7 py-4 text-sm font-bold uppercase tracking-[0.2em] transition-all hover:bg-[#ff5a2c] hover:border-[#ff5a2c]"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
              Play the film
              <span className="text-[#f5efe4]/50 transition-colors group-hover:text-[#f5efe4]">↓</span>
            </a>
          </div>
        </div>

        <div className="mt-14 flex flex-wrap items-end justify-between gap-6 border-t border-[#f5efe4]/15 pt-6 text-[11px] font-bold uppercase tracking-[0.22em] text-[#f5efe4]/60">
          <span>Role — Art Director</span>
          <span>Director — Slim</span>
          <span>Client — Nando&rsquo;s South Africa</span>
        </div>
      </div>
    </section>
  );
}
