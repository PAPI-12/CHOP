const CREDITS = [
  ["Client", "Nando's South Africa"],
  ["Agency", "M&C Saatchi Abel"],
  ["Role", "Art Director"],
  ["Director", "Slim — Darling"],
  ["Executive Creative", "Neo Mashigo"],
  ["Creative Director", "Stephanie Larsen"],
  ["Creative Director", "Vanessa von Broembsen"],
  ["Copywriters", "Nox Setati, Pakamani Mancotywa"],
  ["Cinematography", "Rick Joaquim"],
];

export default function Credits() {
  return (
    <section id="nandos-credits" className="bg-[#171412] text-[#f5efe4] py-20 md:py-24 relative overflow-hidden">
      <div className="grain absolute inset-0" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="reveal lg:col-span-5">
            <p className="mb-4 font-mono text-xs uppercase tracking-[0.25em] text-[#ff5a2c]">
              / Credits
            </p>
            <h2 className="font-nandos-display text-4xl uppercase leading-[0.9] md:text-6xl">
              Made loud,
              <br />
              made together
            </h2>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-[#f5efe4]/55">
              A wild brief deserves a wild room. This one had plenty of both.
            </p>
          </div>

          <div className="reveal lg:col-span-7">
            <dl className="grid gap-x-10 gap-y-4 sm:grid-cols-2">
              {CREDITS.map(([k, v]) => (
                <div
                  key={k + v}
                  className="flex flex-col gap-1 border-b border-[#f5efe4]/10 pb-4"
                >
                  <dt className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#f5efe4]/40">
                    {k}
                  </dt>
                  <dd className="font-semibold text-[#f5efe4]/90">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
