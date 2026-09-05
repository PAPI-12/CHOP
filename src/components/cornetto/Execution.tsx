export default function Execution() {
  return (
    <section
      id="cornetto-execution"
      className="relative overflow-hidden bg-cornetto-orange py-20 md:py-32 cv-auto"
    >
      <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full border-[30px] border-cornetto-cream/30" />
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 md:px-8 lg:grid-cols-2">
        <div className="relative order-2 flex justify-center lg:order-1">
          <div className="corn-phone-frame corn-outline-shadow relative w-[260px] md:w-[300px]">
            <img
              src="/images/cornetto-skater.webp"
              alt="Cornetto Culture app profile character"
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="corn-pill-red absolute -bottom-4 -right-2 rounded-2xl px-4 py-3 md:right-8">
            <p className="text-xs font-black uppercase tracking-wider">
              Campaign hook
            </p>
            <p className="font-corn-display text-2xl text-cornetto-cream">
              Tell us your scene
            </p>
          </div>
        </div>

        <div className="order-1 text-cornetto-ink lg:order-2">
          <p className="corn-section-kicker text-cornetto-purple">
            The Execution
          </p>
          <h2 className="mt-3 font-corn-display text-5xl leading-[0.92] tracking-[-0.04em] text-cornetto-purple md:text-8xl">
            AN APP THAT
            <br />
            FINDS THE CREW
          </h2>
          <p className="mt-8 max-w-xl text-base font-semibold leading-relaxed text-cornetto-ink/80 md:text-lg">
            A campaign where we get our users to tell us where they're hanging
            out — for the chance to win a R5 000 Cornetto sponsorship for their
            interests. Through this, we'll find out where they are and have the
            chance to make tactical advertising in their space.
          </p>
          <p className="mt-4 max-w-xl text-base font-semibold leading-relaxed text-cornetto-ink/80 md:text-lg">
            We'll achieve this through creating an app where our users can pick
            which sub-culture they belong to from a list of sub-cultures and
            motivate why they think the culture van should show up and bring
            merch tailored for that sub-culture. This app will house the type of
            products Cornetto has in-store for their sub-culture.
          </p>

          <ul className="mt-8 space-y-3">
            {[
              "Users claim their sub-culture",
              "Pitch why the van should roll up",
              "Unlock scene-specific merch",
              "Compete for R5 000 sponsorship",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm font-bold md:text-base">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-cornetto-ink bg-cornetto-cream text-xs font-black text-cornetto-purple">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
