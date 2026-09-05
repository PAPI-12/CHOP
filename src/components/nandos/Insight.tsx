export default function Insight() {
  return (
    <section id="nandos-insight" className="bg-[#6a13a1] py-20 text-[#f5efe4] md:py-28 relative overflow-hidden">
      <div className="grain absolute inset-0" />
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-1/2 h-[28rem] w-[28rem] -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(156,219,40,0.35),transparent_60%)] blur-2xl"
      />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="reveal mb-12">
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.25em] text-[#f6c945]">
            / The Big Idea
          </p>
          <h2 className="font-nandos-display text-4xl uppercase leading-[0.9] md:text-7xl">
            Don&rsquo;t talk to the youth.
            <br />
            <span className="nandos-outline-white">Talk like them.</span>
          </h2>
        </div>

        <div className="grid gap-10 lg:grid-cols-2">
          <div className="reveal space-y-6 text-lg leading-relaxed text-[#f5efe4]/85">
            <p>
              The youth don&rsquo;t want another lecture — from brands or
              anyone. They want to be <em>seen</em>. So instead of a political
              statement, we made a cultural one: a love letter to the
              beautiful absurdity of modern flexing.
            </p>
            <p>
              Art direction leaned all the way in — saturated colour, bold
              type, brazen product drops, and a soundtrack that lives in
              sensory ASMR. It spoke directly to the feed-obsessed energy of
              the moment, while still feeling unmistakably, irreverently
              Nando&rsquo;s.
            </p>
          </div>

          <div className="reveal flex flex-col justify-center">
            <div className="space-y-4">
              {[
                ["Not", "POLITICAL"],
                ["Was", "CULTURAL"],
                ["Definitely", "COOL"],
                ["Always", "NANDO'S"],
              ].map(([k, v], i) => (
                <div
                  key={i}
                  className="flex items-end gap-5 border-b border-[#f5efe4]/15 pb-3"
                >
                  <span className="font-mono text-xs uppercase tracking-widest text-[#f6c945]">
                    {k}
                  </span>
                  <span className="font-nandos-display text-3xl uppercase leading-none text-[#f5efe4] md:text-5xl">
                    {v}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
