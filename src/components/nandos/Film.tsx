export default function Film() {
  return (
    <section id="nandos-film" className="relative bg-[#171412] py-20 md:py-28 text-[#f5efe4]">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="reveal mb-10 flex flex-wrap items-end justify-between gap-6">
          <h2 className="font-nandos-display text-4xl uppercase leading-[0.9] md:text-6xl">
            The Big Film
          </h2>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#f5efe4]/60">
            00:35 · Television · Social
          </p>
        </div>

        <div className="reveal overflow-hidden rounded-3xl border border-[#f5efe4]/15 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.9)]">
          <div className="relative aspect-video w-full bg-[#1f1a16]">
            <iframe
              className="absolute inset-0 h-full w-full"
              src="https://www.youtube.com/embed/s2Z6m6Om0Pg"
              title="Nando's Boujee Bowl — TV Commercial"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>

        <div className="reveal mt-10 grid gap-6 text-[#f5efe4]/75 md:grid-cols-3">
          <p className="md:col-span-2 text-lg leading-relaxed">
            A 35-second satire on the <em>&ldquo;for the Gram&rdquo;</em> era.
            From the sneakfreak pouring his bowl into a fresh pair of PUMAs,
            to the foodie hovering for that perfect Insta-snap — it&rsquo;s a
            love letter to everyone doing the absolute most for the shot.
          </p>
          <p className="text-sm leading-relaxed text-[#f5efe4]/50">
            Art direction drove every frame — the loud colour story, the
            gaudy flex energy, the product moments. All shot on Fujifilm X-T3
            &amp; ARRI Alexa Mini.
          </p>
        </div>
      </div>
    </section>
  );
}
