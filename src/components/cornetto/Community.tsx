import { useState } from "react";

const cards = [
  {
    type: "cta" as const,
    title: "DOUBLE SCOOP DOUBLE FUN",
    body: "Pitch your culture. Pull up the van.",
    action: "Join the culture list",
  },
  {
    type: "photo" as const,
    image:
      "https://images.pexels.com/photos/5325913/pexels-photo-5325913.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=800",
    title: "FROM FEED TO STREET",
    overlay: "Let the good times melt",
  },
  {
    type: "photo" as const,
    image:
      "https://images.pexels.com/photos/5560410/pexels-photo-5560410.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=800",
    title: "LET THE GOOD TIMES MELT",
    overlay: "Cornetto Culture",
  },
  {
    type: "photo" as const,
    image:
      "https://images.pexels.com/photos/8591604/pexels-photo-8591604.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=800",
    title: "CREW NIGHTS",
    overlay: "Tuesdays at golden hour",
  },
];

const quotes = [
  {
    name: "Amina K.",
    role: "Skater",
    text: "Finally a brand that rolls to the park instead of shouting from a billboard.",
  },
  {
    name: "Jordan M.",
    role: "Artist",
    text: "The merch actually looks like something my crew would wear. Instant save.",
  },
  {
    name: "Leo S.",
    role: "Dog Walker",
    text: "I pitched our Sunday pack meet-up. If the van shows, we're legends.",
  },
  {
    name: "Priya R.",
    role: "Vegan",
    text: "Love that sub-cultures aren't an afterthought — they're the whole product.",
  },
  {
    name: "Chris N.",
    role: "Skater",
    text: "R5K sponsorship for our mini contest? Say less. Already on the waitlist.",
  },
];

export default function Community() {
  const [index, setIndex] = useState(0);
  const visible = quotes.slice(index, index + 3);
  const shown =
    visible.length < 3
      ? [...visible, ...quotes.slice(0, 3 - visible.length)]
      : visible;

  const prev = () =>
    setIndex((i) => (i - 1 + quotes.length) % quotes.length);
  const next = () => setIndex((i) => (i + 1) % quotes.length);

  return (
    <section className="bg-cornetto-cream py-20 md:py-32 cv-auto">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="text-center">
          <p className="font-corn-display text-2xl leading-none tracking-wide text-cornetto-purple md:text-4xl">
            CULTURE → COME FOR THE CONES, STAY FOR THE CREW
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) =>
            card.type === "cta" ? (
              <div
                key={card.title}
                className="corn-outline-shadow flex min-h-[320px] flex-col justify-between rounded-[1.75rem] bg-cornetto-purple p-6 text-cornetto-cream"
              >
                <div>
                  <h3 className="font-corn-display text-4xl leading-none">
                    {card.title}
                  </h3>
                  <p className="mt-3 text-sm font-semibold text-cornetto-cream/80">{card.body}</p>
                </div>
                <button
                  type="button"
                  className="corn-pill-cream mt-6 rounded-full px-4 py-3 text-sm font-black uppercase tracking-[0.12em] transition hover:bg-cornetto-orange"
                >
                  {card.action}
                </button>
              </div>
            ) : (
              <div
                key={card.title}
                className="corn-outline-shadow relative min-h-[320px] overflow-hidden rounded-[1.75rem] cv-auto"
              >
                <img
                  src={card.image}
                  alt={card.title}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-cornetto-deep/90 via-cornetto-deep/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-cornetto-orange">
                    {card.overlay}
                  </p>
                  <h3 className="mt-1 font-corn-display text-3xl leading-none">
                    {card.title}
                  </h3>
                </div>
              </div>
            ),
          )}
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-center text-cornetto-ink/70">
          From sponsorship pitches and Sunday hangouts to merch drops and crew
          nights — this is where you come to claim your scene, connect, and get
          the van rolling.
        </p>

        <div className="mt-16 text-center">
          <h3 className="font-corn-display text-4xl leading-[0.9] text-cornetto-purple md:text-6xl">
            75+ CREWS ALREADY
            <br />
            ON THE CULTURE LIST
          </h3>
          <p className="mt-2 text-sm text-cornetto-ink/55">
            You're not the only one curious…
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {shown.map((q) => (
            <blockquote
              key={q.name + q.text}
              className="corn-outline-sm rounded-[1.5rem] bg-cornetto-purple p-6 text-cornetto-cream"
            >
              <p className="text-sm font-semibold leading-relaxed text-cornetto-cream/90">
                “{q.text}”
              </p>
              <footer className="mt-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-cornetto-ink bg-cornetto-orange font-black text-cornetto-ink">
                  {q.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-black">{q.name}</p>
                  <p className="text-xs font-semibold text-cornetto-cream/60">{q.role}</p>
                </div>
              </footer>
            </blockquote>
          ))}
        </div>

        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={prev}
            aria-label="Previous quotes"
            className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-cornetto-purple text-cornetto-purple transition hover:bg-cornetto-purple hover:text-white"
          >
            ←
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next quotes"
            className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-cornetto-purple text-cornetto-purple transition hover:bg-cornetto-purple hover:text-white"
          >
            →
          </button>
        </div>
      </div>
    </section>
  );
}
