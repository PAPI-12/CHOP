const pillars = [
  {
    label: "The Insight",
    title: "Gen Z deep-dives",
    body: "Gen Z feel strongly about their interests. They're not just a little interested — they deep dive into the communities that define them.",
  },
  {
    label: "The Problem",
    title: "Hard to find them",
    body: "We don't know where Gen Z are because they hang out in sub-cultures. We need a list of these sub-cultures to truly connect with them.",
  },
  {
    label: "The Opportunity",
    title: "Meet them there",
    body: "To Cornetto your culture is to celebrate your way of life with people who get it — and bring the van (plus merch) right to that world.",
  },
];

export default function Insight() {
  return (
    <section id="cornetto-insight" className="relative overflow-hidden bg-cornetto-cream py-20 md:py-32 cv-auto">
      <div className="pointer-events-none absolute -right-32 top-16 h-72 w-72 rounded-full border-[28px] border-cornetto-lavender/50" />
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="corn-section-kicker mb-4">
              Cornetto Culture
            </p>
            <h2 className="font-corn-display text-5xl leading-[0.92] tracking-[-0.04em] text-cornetto-purple md:text-8xl">
              BECOME PART OF
              <br />
              <span className="text-cornetto-ink">THE CULTURE</span>
            </h2>
            <p className="mt-8 max-w-lg text-base font-semibold leading-relaxed text-cornetto-ink/75 md:text-lg">
              To Cornetto your culture is to celebrate your way of life as a
              community with similar interests — how you think, what you say,
              how you identify with each other, what you do, make, and your
              attitude.
            </p>
            <p className="mt-4 max-w-lg text-base font-semibold leading-relaxed text-cornetto-ink/75 md:text-lg">
              To Cornetto your culture is to express your creativity and give
              significance to your interests — after all, how you spend most of
              your time, with the people you love and vibe with. Cornetto
              understands this.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <span className="corn-pill-cream rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.15em]">
                Brand activation
              </span>
              <span className="corn-pill-yellow rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.15em]">
                Mobile app
              </span>
              <span className="corn-pill-red rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.15em]">
                Illustration
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-cornetto-orange/50" />
            <img
              src="/images/cornetto-crew.webp"
              alt="Diverse Gen Z friends representing Cornetto Culture"
              loading="lazy"
              decoding="async"
              className="corn-outline-shadow relative w-full rounded-[2rem]"
            />
          </div>
        </div>

        <div className="mt-20 grid gap-5 md:grid-cols-3">
          {pillars.map((item, i) => (
            <article
              key={item.label}
              className="corn-outline-sm group rounded-[1.5rem] bg-cornetto-lavender/35 p-7 transition hover:-translate-y-1"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-cornetto-purple">
                  {item.label}
                </span>
                <span className="font-corn-display text-3xl text-cornetto-purple/40">
                  0{i + 1}
                </span>
              </div>
              <h3 className="font-corn-display text-3xl leading-none text-cornetto-purple">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-cornetto-ink/70">
                {item.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
