export default function Overview() {
  return (
    <section className="bg-[#f5efe4] py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-12 md:grid-cols-12">
          {/* Left: intro */}
          <div className="reveal md:col-span-7">
            <p className="mb-6 font-mono text-xs uppercase tracking-[0.25em] text-[#e63525]">
              / The Brief
            </p>
            <h2 className="font-nandos-display text-4xl uppercase leading-[0.95] tracking-tight md:text-6xl">
              Keep it cool.
              <br />
              Keep it <span className="text-[#e63525]">un-political.</span>
            </h2>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-[#171412]/80">
              Nando&rsquo;s is famous — loudly, proudly — for being political.
              But for the Boujee Bowl, the ask was different. They wanted
              something new that could appeal to the youth in a{" "}
              <strong className="text-[#171412]">genuinely cool way</strong>{" "}
              without doing the politics. So we turned the lens on the culture
              itself.
            </p>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-[#171412]/80">
              A culture obsessed with flexing. With the perfect post. With
              doing the <em>most</em> for the Gram. We built the whole film
              around it — a laugh-out-loud, sideways nod to everyone who will
              do absolutely anything for the shot.
            </p>
          </div>

          {/* Right: facts */}
          <div className="reveal md:col-span-5">
            <div className="rounded-3xl border-2 border-[#171412] bg-[#fbf6ec] p-8 shadow-[8px_8px_0_0_var(--color-ink)]">
              <ul className="divide-y divide-[#171412]/10">
                {[
                  ["Role", "Art Director"],
                  ["Agency", "M&C Saatchi Abel"],
                  ["Director", "Slim — Darling"],
                  ["Sound", "ASMR / flex sizzle"],
                  ["Release", "2019 · South Africa"],
                ].map(([k, v]) => (
                  <li key={k} className="flex items-start justify-between gap-4 py-4">
                    <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#171412]/45">
                      {k}
                    </span>
                    <span className="text-right font-semibold">{v}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
