import { useEffect, useState } from "react";

function useCountdown(target: Date) {
  const calc = () => {
    const diff = Math.max(0, target.getTime() - Date.now());
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    const secs = Math.floor((diff / 1000) % 60);
    return { days, hours, mins, secs };
  };

  const [time, setTime] = useState(calc);

  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target.getTime()]);

  return time;
}

export default function Role() {
  const [target] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 10);
    d.setHours(d.getHours() + 12);
    return d;
  });
  const { days, hours, mins, secs } = useCountdown(target);

  return (
    <section id="cornetto-role" className="bg-cornetto-cream pb-0 pt-10 md:pt-16 cv-auto">
      {/* CTA banner */}
      <div className="mx-auto max-w-5xl px-5 md:px-8">
        <div className="corn-outline-shadow relative overflow-hidden rounded-[2rem] cv-auto">
          <img
            src="/images/van-night.webp"
            alt="Cornetto culture van"
            loading="lazy"
            decoding="async"
            className="h-72 w-full object-cover md:h-96"
          />
          <div className="absolute inset-0 bg-cornetto-purple/65" />
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <h2 className="font-corn-display hero-title-shadow text-4xl leading-none text-cornetto-cream md:text-7xl">
              THE VAN'S CALLING
              <br />
              ARE YOU READY?
            </h2>
            <a
              href="#cornetto-top"
              className="corn-pill-yellow mt-6 rounded-full px-8 py-3 text-sm font-black uppercase tracking-[0.15em] transition hover:-translate-y-1"
            >
              Back to the top
            </a>
          </div>
        </div>
      </div>

      {/* Countdown */}
      <div className="mx-auto mt-16 max-w-3xl px-5 text-center md:px-8">
        <div className="flex items-center justify-between text-sm font-black uppercase tracking-[0.2em] text-cornetto-purple/60">
          <span>Your scene</span>
          <span>we're rolling</span>
        </div>
        <div className="mt-5 space-y-1 font-corn-display text-6xl leading-none tracking-[-0.04em] text-cornetto-purple md:text-8xl">
          <div>
            {String(days).padStart(2, "0")}{" "}
            <span className="text-4xl md:text-5xl">DAYS</span>
          </div>
          <div>
            {String(hours).padStart(2, "0")}{" "}
            <span className="text-4xl md:text-5xl">HOURS</span>
          </div>
          <div>
            {String(mins).padStart(2, "0")}{" "}
            <span className="text-4xl md:text-5xl">MIN</span>
          </div>
          <div>
            {String(secs).padStart(2, "0")}{" "}
            <span className="text-4xl md:text-5xl">SEC</span>
          </div>
        </div>
      </div>

      {/* Role */}
      <div className="mt-20 bg-gradient-to-b from-cornetto-lavender/45 to-cornetto-orange/55 px-5 py-20 text-center md:px-8">
        <p className="corn-section-kicker text-cornetto-purple/70">
          The Role
        </p>
        <h2 className="mt-5 font-corn-display text-5xl leading-none tracking-[-0.04em] text-cornetto-purple md:text-8xl">
          UI/UX · ILLUSTRATOR
        </h2>
        <p className="mx-auto mt-5 max-w-xl font-semibold leading-relaxed text-cornetto-ink/70">
          A pro-active idea for Cornetto Ice Cream — showcasing UI/UX thinking,
          campaign strategy, and illustration craft for Gen Z culture
          activation.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {["Research", "User Flows", "UI Design", "Illustration", "Campaign"].map(
            (tag) => (
              <span
                key={tag}
                className="corn-pill-cream rounded-full px-4 py-2 text-xs font-black uppercase tracking-wider"
              >
                {tag}
              </span>
            ),
          )}
        </div>
      </div>

      {/* Footer brand */}
      <div className="bg-cornetto-purple px-5 py-16 text-center md:px-8 md:py-20">
        <h2 className="font-corn-round text-[clamp(3rem,12vw,8rem)] font-extrabold leading-none tracking-[-0.06em] text-cornetto-cream">
          Cornetto Culture
        </h2>
        <div className="mx-auto mt-10 flex max-w-4xl flex-col items-center justify-between gap-6 text-sm text-white/70 md:flex-row">
          <div className="text-center md:text-left">
            <p className="font-semibold text-white">Portfolio piece</p>
            <p>UI/UX · Illustration</p>
          </div>
          <div className="text-center">
            <p>Original concept for Cornetto</p>
            <p>Inspired layout energy · rebuilt for culture</p>
          </div>
          <div className="text-center md:text-right">
            <p className="font-semibold text-white">PAPI RABORIFE</p>
            <p>Case study redesign</p>
          </div>
        </div>
      </div>
    </section>
  );
}
