const merchCategories = [
  { name: "Skate Decks", mark: "01", blurb: "Graphics built for local sessions" },
  { name: "Pins", mark: "02", blurb: "Small signals for your scene" },
  { name: "Phone Cover", mark: "03", blurb: "Culture graphics for every scroll" },
  { name: "Badges", mark: "04", blurb: "Crew credentials for your skate bag" },
];

const products = [
  { name: "Cone PopGrip", detail: "A soft-serve grip made for one-handed scrolling." },
  { name: "Neon Deck", detail: "A limited graphic deck for late afternoon sessions." },
  { name: "Skull Badge", detail: "An embroidered badge for jackets and skate bags." },
  { name: "Culture Case", detail: "A protective case featuring local scene artwork." },
  { name: "Heart Pin", detail: "An enamel pin for the people you roll with." },
  { name: "Van Sticker", detail: "Weatherproof artwork inspired by the culture van." },
  { name: "Crew Tee Drop", detail: "A heavyweight streetwear tee for the whole crew." },
  { name: "Soft Serve Grip", detail: "A textured phone grip inspired by a Cornetto swirl." },
];

export default function Skater() {
  return (
    <section id="cornetto-culture" className="bg-cornetto-cream py-20 md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="flex flex-col items-center text-center">
          <p className="corn-section-kicker">
            Sub-culture deep dive
          </p>
          <h2 className="mt-4 font-corn-display text-6xl leading-[0.88] tracking-[-0.04em] text-cornetto-purple md:text-8xl">
            THE SKATERS
          </h2>
          <p className="mt-5 max-w-xl font-semibold leading-relaxed text-cornetto-ink/70 md:text-lg">
            Upon picking a culture, users unlock merch tailored to that world —
            skate decks, pins, phone covers, badges — all with Cornetto Culture
            energy.
          </p>
        </div>

        <div className="mt-12 overflow-hidden border-y-[3px] border-cornetto-ink">
          <img loading="lazy" decoding="async"
            src="/images/south-african-skater-crew.webp"
            alt="South African Gen Z skaters posing together at a concrete skatepark"
            className="h-[360px] w-full object-cover object-center md:h-[620px]"
          />
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {merchCategories.map((cat) => (
            <div
              key={cat.name}
              className="corn-outline-sm rounded-[1.5rem] bg-white p-6 text-left transition hover:-translate-y-1"
            >
              <div className="font-corn-display text-3xl text-cornetto-orange">{cat.mark}</div>
              <h3 className="mt-3 font-corn-display text-2xl leading-none text-cornetto-purple">
                {cat.name}
              </h3>
              <p className="mt-2 text-sm font-bold text-cornetto-ink/60">{cat.blurb}</p>
            </div>
          ))}
        </div>

        <div className="corn-outline-shadow mt-14 overflow-hidden rounded-[2rem] bg-white p-2 cv-auto">
          <img
            src="/images/cornetto-merch-products.webp"
            alt="Cornetto Culture skater merchandise arranged on a neutral surface"
            loading="lazy"
            decoding="async"
            className="w-full object-cover"
          />
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          {products.map((p) => (
            <div
              key={p.name}
              className="corn-outline-sm flex min-h-52 flex-col justify-between rounded-[1.5rem] bg-white p-5 text-cornetto-ink"
            >
              <span className="text-xs font-black uppercase tracking-[0.2em] text-cornetto-orange">
                Culture merch
              </span>
              <div>
                <span className="font-corn-display text-xl leading-tight text-cornetto-purple">{p.name}</span>
                <p className="mt-3 text-sm font-semibold leading-relaxed text-cornetto-ink/65">{p.detail}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="corn-outline-shadow mt-16 rounded-[2rem] bg-cornetto-purple p-8 text-center md:p-12">
          <p className="corn-section-kicker text-cornetto-orange">
            Come for the cones, stay for the crew
          </p>
          <h3 className="mt-4 font-corn-display text-4xl leading-[0.9] tracking-[-0.03em] text-cornetto-cream md:text-7xl">
            EVERY SCENE GETS
            <br />
            ITS OWN DROP
          </h3>
          <p className="mx-auto mt-5 max-w-2xl font-semibold leading-relaxed text-cornetto-cream/80">
            From tournaments of taste to Sunday hangouts — skaters, vegans, dog
            walkers, and artists each get a tailored Cornetto moment, merch
            line, and a shot at sponsorship.
          </p>
        </div>
      </div>
    </section>
  );
}
