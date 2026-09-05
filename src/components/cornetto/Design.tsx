import AppPrototype from "./AppPrototype";

type Culture = "Skater" | "Dog Walkers" | "Vegan" | "Artist" | "Fashion";

const cultures: { name: Culture; detail: string; color: string }[] = [
  { name: "Skater", detail: "Decks, spots and street sessions", color: "from-[#9d68ed] to-[#6134c6]" },
  { name: "Dog Walkers", detail: "Pack walks and park meet-ups", color: "from-[#64c8ff] to-[#3978df]" },
  { name: "Vegan", detail: "Plant-based scoops and food culture", color: "from-[#79daaa] to-[#29976f]" },
  { name: "Artist", detail: "Murals, zines and creative drops", color: "from-[#ff8abd] to-[#db418a]" },
  { name: "Fashion", detail: "Street style and local designers", color: "from-[#ffd454] to-[#ef9c27]" },
];

function PhoneShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-[300px]">
      <div className="relative rounded-[2.6rem] bg-black p-[7px] shadow-[10px_10px_0_#211434]">
        <div className="relative aspect-[9/19] overflow-hidden rounded-[2.1rem] bg-gradient-to-b from-[#7838dc] via-[#4f16aa] to-[#1a003d] text-white">
          <div className="pointer-events-none absolute left-1/2 top-2.5 h-5 w-20 -translate-x-1/2 rounded-full bg-black" />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 pt-4 text-[10px] font-black">
            <span>9:41</span>
            <span>▮▮▮ ▱</span>
          </div>
          {children}
          <div className="pointer-events-none absolute bottom-2 left-1/2 h-1 w-20 -translate-x-1/2 rounded-full bg-white/80" />
        </div>
      </div>
    </div>
  );
}

function PrototypeMenuPhone() {
  return (
    <PhoneShell>
      <div className="flex h-full flex-col px-4 pb-10 pt-12">
        <div className="flex items-center justify-between">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15">‹</div>
          <div className="text-center">
            <p className="font-corn-round text-[18px] font-extrabold leading-none">Cornetto</p>
            <p className="text-[7px] font-black uppercase tracking-[0.18em] text-white/60">Pick your culture</p>
          </div>
          <div className="flex h-7 items-center rounded-full bg-white/15 px-2 text-[7px] font-black uppercase">Reset</div>
        </div>

        <h3 className="font-corn-display mt-4 text-[18px] leading-[0.9]">WHERE DO YOU DEEP DIVE?</h3>
        <p className="mt-2 text-[9px] font-semibold leading-snug text-white/65">Choose the scene that feels most like you.</p>

        <div className="mt-4 space-y-2.5">
          {cultures.map((c) => (
            <div key={c.name} className={`rounded-[14px] bg-gradient-to-r ${c.color} px-3 py-2.5 shadow-[0_4px_0_rgba(20,0,50,0.4)]`}>
              <p className="font-corn-display text-[13px] leading-none">{c.name}</p>
              <p className="mt-1 text-[8px] font-bold leading-tight text-white/75">{c.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </PhoneShell>
  );
}

function PrototypeCulturePhone() {
  return (
    <PhoneShell>
      <div className="flex h-full flex-col px-4 pb-10 pt-12">
        <div className="flex items-center justify-between">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15">‹</div>
          <div className="text-center">
            <p className="font-corn-round text-[18px] font-extrabold leading-none">Cornetto</p>
            <p className="text-[7px] font-black uppercase tracking-[0.18em] text-white/60">Skater</p>
          </div>
          <div className="flex h-7 items-center rounded-full bg-white/15 px-2 text-[7px] font-black uppercase">Reset</div>
        </div>

        <div className="mt-4 overflow-hidden rounded-[16px] border border-white/15 bg-white/10">
          <img src="/images/south-african-skater-crew.webp" alt="South African skater crew" loading="lazy" decoding="async" className="h-[92px] w-full object-cover" />
          <div className="p-3">
            <p className="font-corn-display text-[12px] leading-none">SKATER CULTURE</p>
            <p className="mt-1 text-[8px] font-semibold leading-tight text-white/65">Back your people, unlock the drop and tell us where the van should pull up.</p>
          </div>
        </div>

        <div className="mt-4 space-y-2.5">
          <div className="rounded-[12px] bg-[#ffd34b] px-3 py-2.5 text-center text-[9px] font-black uppercase tracking-wide text-[#2c174f] shadow-[0_3px_0_#6c3aad]">Merch drop</div>
          <div className="rounded-[12px] border-2 border-white/30 bg-white/10 px-3 py-2.5 text-center text-[9px] font-black uppercase tracking-wide">Motivate why</div>
          <div className="rounded-[12px] border-2 border-white/30 bg-white/10 px-3 py-2.5 text-center text-[9px] font-black uppercase tracking-wide">Van pulls up</div>
        </div>
      </div>
    </PhoneShell>
  );
}

export default function Design() {
  return (
    <section id="cornetto-design" className="corn-gradient-section py-20 md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="grid items-end gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="corn-section-kicker">The Design</p>
            <h2 className="mt-4 font-corn-display text-5xl leading-[0.88] tracking-[-0.04em] text-cornetto-purple md:text-8xl">USER INTERFACE</h2>
          </div>
          <p className="mx-auto mt-5 max-w-2xl text-base font-semibold leading-relaxed text-cornetto-ink/70 md:text-lg">
            The user experience and interface in this application is created in such a way that any user can navigate with ease and access its full capabilities. This interface is the epitome of a modern, minimalistic style — built for Gen Z who are tech savvy and gravitate towards simplicity.
          </p>
        </div>

        <div className="relative mt-14 flex justify-center">
          <div className="pointer-events-none absolute -left-2 top-6 hidden -rotate-[8deg] flex-col items-center md:-left-10 md:flex lg:-left-6">
            <span className="hand-note text-2xl text-cornetto-purple lg:text-3xl">try me!</span>
            <svg width="70" height="60" viewBox="0 0 70 60" fill="none" className="mt-1 text-cornetto-purple">
              <path
                d="M4 4C18 10 30 22 34 38C36 46 34 52 30 56"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M18 50L30 56L34 42"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </div>
          <AppPrototype />
        </div>

        <div className="mt-24 grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="corn-section-kicker">The Menu</p>
            <h3 className="mt-4 font-corn-display text-5xl leading-[0.9] tracking-[-0.04em] text-cornetto-ink md:text-7xl">
              PICK YOUR<br /><span className="text-cornetto-purple">SUB-CULTURE</span>
            </h3>
            <p className="mt-8 max-w-md text-base font-semibold leading-relaxed text-cornetto-ink/75 md:text-lg">
              Upon arrival after user creates an account, the menu frame appears with a list of sub-cultures. Navigation through the app still conforms to a simple but effective interface and experience — important for users mainly because Gen Z are tech savvy and gravitate towards simplicity.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="corn-pill-cream rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-wider">Menu = Cultures</span>
              <span className="corn-pill-yellow rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-wider">Culture = Actions</span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-10 md:flex-row">
            <PrototypeMenuPhone />
            <PrototypeCulturePhone />
          </div>
        </div>
      </div>
    </section>
  );
}
