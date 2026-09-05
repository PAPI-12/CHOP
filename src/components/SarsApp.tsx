import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const youtubeUrl = "https://www.youtube.com/embed/ARPCyulojp8";
const youtubeWatchUrl = "https://youtu.be/ARPCyulojp8?si=S3nmuS-4MZ4S9Is8";

const details = [
  ["Client", "SARS"],
  ["Campaign", "2019 tax season"],
  ["Product", "SARS MobiApp"],
  ["Medium", "TV advert"],
];

export default function App() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#030303] font-sans text-[#e7e3de]">
      <nav className="sticky top-[64px] md:top-[76px] z-30 bg-[#030303]/90 backdrop-blur border-b border-white/10">
        <div className="mx-auto flex max-w-[1800px] items-center justify-between px-5 py-4 text-white md:px-8 lg:px-10">
          <Link to="/work" className="text-sm font-black uppercase tracking-tight">
            ← Back to Work
          </Link>
          <div className="hidden items-center gap-8 text-xs font-bold uppercase tracking-[0.22em] md:flex">
            <a className="transition hover:opacity-60" href="#sars-film">Film</a>
            <a className="transition hover:opacity-60" href="#sars-brief">Brief</a>
            <a className="transition hover:opacity-60" href="#sars-credits">Credits</a>
          </div>
          <a
            className="rounded-full border border-white/35 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] transition hover:bg-white hover:text-black"
            href={youtubeWatchUrl}
            target="_blank"
            rel="noreferrer"
          >
            Watch
          </a>
        </div>
      </nav>

      <section id="sars-top" className="relative min-h-screen bg-[#030303] px-5 pb-10 pt-20 md:px-8 lg:px-10">
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-70">
          <div
            className="absolute -right-24 top-36 h-[30rem] w-[30rem] rounded-full bg-[#077469] blur-[120px]"
            style={{ transform: `translate3d(0, ${scrollY * 0.08}px, 0)` }}
          />
          <div
            className="absolute -left-20 top-[44rem] h-[24rem] w-[24rem] rounded-full bg-[#b4613b] blur-[110px]"
            style={{ transform: `translate3d(0, ${scrollY * -0.06}px, 0)` }}
          />
        </div>

        <div className="relative mx-auto max-w-[1800px]">
          <div className="grid items-start gap-6 lg:grid-cols-[1fr_0.38fr]">
            <h1 className="sars-hero-type sars-reveal text-[clamp(4.5rem,15.5vw,19rem)] font-black uppercase leading-[0.82] tracking-[-0.085em] text-[#f2eee9]">
              FRIENDS
              <br />
              &amp; TAXES
            </h1>
            <div className="sars-reveal-delayed max-w-[20rem] pt-3 text-sm font-medium leading-relaxed tracking-[-0.01em] text-[#c2bcbe] lg:pt-2">
              Fresh and vibrant TV advert for the SARS 2019 tax season, created to punt the newest way to file your returns: the SARS MobiApp.
            </div>
          </div>

          <div className="-mt-2 flex items-baseline gap-3 md:-mt-6 lg:-mt-10">
            <span className="sars-reveal-slow font-sars-serif text-[clamp(4rem,10vw,12rem)] italic leading-none tracking-[-0.06em] text-[#d48160]">
              for
            </span>
            <span className="sars-hero-type sars-text-pan bg-[length:220%_100%] bg-clip-text text-[clamp(4.8rem,14.5vw,18rem)] font-black uppercase leading-[0.8] tracking-[-0.085em] text-transparent">
              SARS
            </span>
          </div>

          <div id="sars-film" className="relative mt-8 overflow-hidden rounded-[1.7rem] bg-[#111] shadow-[0_40px_110px_rgba(0,0,0,0.65)] md:rounded-[2.2rem]">
            <iframe
              className="aspect-video w-full"
              src={youtubeUrl}
              title="SARS Friends and Taxes TV advert"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
            <div className="pointer-events-none absolute bottom-4 left-5 z-10 flex flex-col text-white md:bottom-6 md:left-8">
              <span className="text-sm font-black uppercase tracking-tight md:text-base">SARS MobiApp</span>
              <span className="font-sars-serif text-xs italic tracking-normal text-white/80 md:text-sm">Commercial Ad</span>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#030303] py-5 text-[#d7d2cb]">
        <div className="sars-marquee flex whitespace-nowrap text-sm font-black uppercase tracking-[0.26em]">
          {Array.from({ length: 8 }).map((_, index) => (
            <span key={index} className="mx-8 shrink-0">
              Convenience / Speed / File anywhere / SARS MobiApp /
            </span>
          ))}
        </div>
      </section>

      <section className="bg-[#e7e3de] px-5 py-20 text-[#050505] md:px-8 md:py-28 lg:px-10">
        <div className="mx-auto grid max-w-[1800px] gap-12 lg:grid-cols-[0.9fr_1.4fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#b4613b]">Case details</p>
            <h2 className="mt-4 max-w-[8ch] text-[clamp(4rem,9vw,11rem)] font-black uppercase leading-[0.82] tracking-[-0.08em]">
              Made for tax season.
            </h2>
          </div>
          <div className="grid content-start gap-0 border-t border-black/25">
            {details.map(([label, value]) => (
              <MetaRow key={label} label={label} value={value} />
            ))}
          </div>
        </div>
      </section>

      <section id="sars-brief" className="relative overflow-hidden bg-[#f36f3d] px-5 py-20 text-[#050505] md:px-8 md:py-28 lg:px-10">
        <div className="absolute -right-24 top-10 hidden text-[38rem] font-black uppercase leading-none tracking-[-0.12em] text-black/[0.06] lg:block">
          APP
        </div>
        <div className="relative mx-auto max-w-[1800px]">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.6fr]">
            <p className="text-xs font-black uppercase tracking-[0.28em]">01 / Task</p>
            <p className="max-w-[22ch] text-[clamp(3rem,6.6vw,9rem)] font-black uppercase leading-[0.86] tracking-[-0.075em]">
              Create a fresh and vibrant TV advert.
            </p>
          </div>
          <div className="mt-16 grid gap-10 border-t border-black/25 pt-10 lg:grid-cols-[0.8fr_1.6fr]">
            <p className="text-xs font-black uppercase tracking-[0.28em]">02 / Idea</p>
            <p className="max-w-[30ch] text-[clamp(2rem,4.2vw,6rem)] font-black uppercase leading-[0.9] tracking-[-0.06em]">
              Play to the strengths of the app: convenience and speed of processing.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#027466] px-5 py-20 text-[#e7e3de] md:px-8 md:py-28 lg:px-10">
        <div className="mx-auto max-w-[1800px]">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#ffcc2c]">Creative approach</p>
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <Approach number="01" title="No queues" body="The story reframed tax filing as something that could happen wherever the taxpayer already was." />
            <Approach number="02" title="No drag" body="The app benefit was reduced to a simple promise: fewer steps, faster processing, less friction." />
            <Approach number="03" title="More human" body="The tone made SARS feel conversational and everyday, not procedural or intimidating." />
          </div>
        </div>
      </section>

      <section id="sars-credits" className="bg-[#030303] px-5 py-20 text-[#e7e3de] md:px-8 md:py-28 lg:px-10">
        <div className="mx-auto grid max-w-[1800px] gap-12 lg:grid-cols-[0.9fr_1.4fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#b4613b]">Credits</p>
            <h2 className="mt-4 text-[clamp(4rem,10vw,12rem)] font-black uppercase leading-[0.8] tracking-[-0.085em]">
              Team.
            </h2>
          </div>
          <div className="border-t border-white/20">
            <Credit role="Art Director" name="Papi Raborife" />
            <Credit role="Copy Writer" name="Pakamani Mancyotwa" />
            <Credit role="Work" name="SARS - Friends and Taxes" />
            <Credit role="Year" name="2019" />
          </div>
        </div>
      </section>

      <div className="bg-[#030303] px-5 pb-8 text-[#e7e3de] md:px-8 lg:px-10">
        <div className="mx-auto flex max-w-[1800px] flex-col gap-4 border-t border-white/15 pt-8 text-xs font-bold uppercase tracking-[0.18em] md:flex-row md:items-center md:justify-between">
          <p>SARS - Friends and Taxes</p>
          <a className="text-[#f36f3d] transition hover:text-[#ffcc2c]" href={youtubeWatchUrl} target="_blank" rel="noreferrer">
            Watch the work
          </a>
        </div>
      </div>
    </main>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-3 border-b border-black/25 py-6 md:grid-cols-[0.45fr_1fr] md:items-baseline">
      <span className="text-xs font-black uppercase tracking-[0.25em] text-black/45">{label}</span>
      <span className="text-3xl font-black uppercase leading-none tracking-[-0.055em] md:text-5xl">{value}</span>
    </div>
  );
}

function Approach({ number, title, body }: { number: string; title: string; body: string }) {
  return (
    <div className="border-t border-white/25 pt-6 transition duration-300 hover:-translate-y-1 hover:border-[#ffcc2c]">
      <p className="text-xs font-black uppercase tracking-[0.25em] text-[#ffcc2c]">{number}</p>
      <h3 className="mt-8 text-[clamp(2.8rem,5vw,6rem)] font-black uppercase leading-[0.82] tracking-[-0.075em]">
        {title}
      </h3>
      <p className="mt-6 max-w-md text-lg font-bold leading-[1.25] tracking-[-0.03em] text-white/75">{body}</p>
    </div>
  );
}

function Credit({ role, name }: { role: string; name: string }) {
  return (
    <div className="grid gap-3 border-b border-white/20 py-6 md:grid-cols-[0.45fr_1fr] md:items-baseline">
      <span className="text-xs font-black uppercase tracking-[0.25em] text-white/40">{role}</span>
      <span className="text-3xl font-black uppercase leading-none tracking-[-0.055em] md:text-5xl">{name}</span>
    </div>
  );
}