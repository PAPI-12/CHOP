const panels = [
  {
    title: "DEEP DIVE\nCULTURE",
    image:
      "https://images.pexels.com/photos/5899270/pexels-photo-5899270.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1600",
    caption: "Where Gen Z actually hangs",
  },
  {
    title: "CREW UP\n& SHOW UP",
    image:
      "https://images.pexels.com/photos/8570885/pexels-photo-8570885.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1600",
    caption: "Friends who get the vibe",
  },
  {
    title: "VAN TO\nYOUR SCENE",
    image: "/images/van-night.webp",
    caption: "Tactical drop-ins, not billboards",
  },
  {
    title: "MERCH THAT\nMATCHES",
    image:
      "https://images.pexels.com/photos/6968797/pexels-photo-6968797.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1600",
    caption: "Tailored to every sub-culture",
  },
  {
    title: "WIN THE\nSPOTLIGHT",
    image:
      "https://images.pexels.com/photos/8576110/pexels-photo-8576110.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1600",
    caption: "R5 000 Cornetto sponsorship",
  },
];

export default function Lifestyle() {
  return (
    <section className="bg-cornetto-cream cv-auto">
      <div className="mx-auto max-w-7xl px-5 py-20 text-center md:px-8 md:py-28">
        <p className="corn-section-kicker">
          From scroll to sidewalk
        </p>
        <h2 className="mt-4 font-corn-display text-5xl leading-none tracking-[-0.04em] text-cornetto-purple md:text-8xl">
          THE CORNETTO WAY
        </h2>
      </div>

      <div className="flex flex-col">
        {panels.map((panel) => (
          <div
            key={panel.title}
            className="relative flex min-h-[62vh] items-center justify-center overflow-hidden border-y-[3px] border-cornetto-deep md:min-h-[75vh] cv-auto"
          >
            <img
              src={panel.image}
              alt={panel.caption}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-cornetto-deep/85 via-cornetto-purple/25 to-cornetto-deep/20" />
            <div className="relative z-10 px-6 text-center">
              <p className="mb-4 text-xs font-black uppercase tracking-[0.35em] text-cornetto-orange">
                {panel.caption}
              </p>
              <h3 className="font-corn-display hero-title-shadow text-[clamp(3.5rem,12vw,8rem)] leading-[0.9] whitespace-pre-line text-cornetto-cream">
                {panel.title}
              </h3>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
