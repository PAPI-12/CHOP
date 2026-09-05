import { Component, ErrorInfo, FormEvent, ReactNode, useEffect, useReducer, useState } from "react";

type Culture = "Skater" | "Dog Walkers" | "Vegan" | "Artist" | "Fashion";
type Screen =
  | "open"
  | "home"
  | "auth"
  | "signUp"
  | "signIn"
  | "menu"
  | "culture"
  | "merch"
  | "motivate"
  | "van";

type State = { screen: Screen; culture: Culture | null; name: string };
type Action =
  | { type: "GO"; screen: Screen }
  | { type: "SELECT_CULTURE"; culture: Culture }
  | { type: "SET_NAME"; name: string }
  | { type: "RESET" };

const initialState: State = { screen: "open", culture: null, name: "Cornetto Lover" };
const allowedScreens: Screen[] = ["open", "home", "auth", "signUp", "signIn", "menu", "culture", "merch", "motivate", "van"];
const allowedCultures: Culture[] = ["Skater", "Dog Walkers", "Vegan", "Artist", "Fashion"];

class PrototypeBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    try { sessionStorage.removeItem("cornetto-prototype"); } catch { /* Recovery works without storage access. */ }
  }

  render() {
    if (this.state.failed) {
      return (
        <Shell>
          <div className="flex h-full flex-col items-center justify-center px-8 text-center">
            <p className="font-corn-display text-3xl leading-none">LET'S TRY THAT AGAIN</p>
            <p className="mt-4 text-sm font-semibold text-white/70">The prototype recovered from an unexpected state. No account details were saved.</p>
            <div className="mt-8 w-full"><PhoneButton onClick={() => this.setState({ failed: false })}>Restart safely</PhoneButton></div>
          </div>
        </Shell>
      );
    }
    return this.props.children;
  }
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "GO":
      return { ...state, screen: action.screen };
    case "SELECT_CULTURE":
      return { ...state, culture: action.culture, screen: "culture" };
    case "SET_NAME":
      return { ...state, name: action.name.trim().slice(0, 40) || "Cornetto Lover" };
    case "RESET":
      return initialState;
    default:
      return initialState;
  }
}

const cultures: { name: Culture; detail: string; color: string }[] = [
  { name: "Skater", detail: "Decks, spots and street sessions", color: "from-[#9d68ed] to-[#6134c6]" },
  { name: "Dog Walkers", detail: "Pack walks and park meet-ups", color: "from-[#64c8ff] to-[#3978df]" },
  { name: "Vegan", detail: "Plant-based scoops and food culture", color: "from-[#79daaa] to-[#29976f]" },
  { name: "Artist", detail: "Murals, zines and creative drops", color: "from-[#ff8abd] to-[#db418a]" },
  { name: "Fashion", detail: "Street style and local designers", color: "from-[#ffd454] to-[#ef9c27]" },
];

const merch = [
  ["Cone PopGrip", "A soft-serve grip for one-handed scrolling."],
  ["Neon Deck", "A limited deck made for night sessions."],
  ["Skull Badge", "An embroidered badge for your skate bag."],
  ["Culture Case", "A protective phone case with local scene graphics."],
  ["Heart Pin", "A small enamel pin for the people you roll with."],
  ["Van Sticker", "Weatherproof artwork inspired by the culture van."],
  ["Crew Tee Drop", "A heavyweight tee for your whole crew."],
  ["Soft Serve Grip", "A textured grip inspired by the Cornetto swirl."],
];

function PhoneButton({ children, onClick, secondary = false, disabled = false }: { children: ReactNode; onClick: () => void; secondary?: boolean; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`w-full rounded-2xl px-4 py-3 text-sm font-black uppercase tracking-[0.12em] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 ${
        secondary ? "border-2 border-white/45 bg-white/10 text-white" : "bg-[#ffd34b] text-[#2c174f] shadow-[0_5px_0_#6c3aad]"
      }`}
    >
      {children}
    </button>
  );
}

function Field({ label, type = "text", value, onChange, maxLength = 80 }: { label: string; type?: string; value: string; onChange: (value: string) => void; maxLength?: number }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.15em] text-white/70">{label}</span>
      <input
        type={type}
        value={value}
        maxLength={maxLength}
        autoComplete="off"
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border-2 border-white/20 bg-white/10 px-3 py-3 text-sm font-bold text-white outline-none placeholder:text-white/35 focus:border-[#ffd34b]"
      />
    </label>
  );
}

function AppHeader({ title, onBack, onReset }: { title: string; onBack?: () => void; onReset: () => void }) {
  return (
    <header className="flex items-center justify-between px-5 pb-4 pt-14">
      <button type="button" onClick={onBack || onReset} aria-label={onBack ? "Go back" : "Restart prototype"} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/12 text-xl font-black text-white">
        {onBack ? "‹" : "×"}
      </button>
      <div className="text-center">
        <p className="font-corn-round text-2xl font-extrabold leading-none">Cornetto</p>
        <p className="mt-1 text-[9px] font-black uppercase tracking-[0.22em] text-white/65">{title}</p>
      </div>
      <button type="button" onClick={onReset} className="h-9 rounded-full bg-white/12 px-3 text-[9px] font-black uppercase tracking-wide text-white">Reset</button>
    </header>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[420px]">
      <div className="relative rounded-[3.2rem] bg-black p-[9px] shadow-[0_24px_60px_rgba(33,20,52,0.35)]">
        <div className="pointer-events-none absolute inset-[3px] rounded-[3rem] border border-white/35" />
        <div className="relative aspect-[9/19.45] overflow-hidden rounded-[2.65rem] bg-gradient-to-b from-[#7838dc] via-[#4f16aa] to-[#1a003d] text-white">
          <div className="absolute left-1/2 top-3 z-50 h-8 w-32 -translate-x-1/2 rounded-full bg-black" />
          <div className="absolute inset-x-0 top-0 z-40 flex items-center justify-between px-8 pt-6 text-sm font-black">
            <span>9:41</span><span>▮▮▮  ▱</span>
          </div>
          {children}
          <div className="absolute bottom-3 left-1/2 z-50 h-1.5 w-32 -translate-x-1/2 rounded-full bg-white" />
        </div>
      </div>
    </div>
  );
}

function OpenScreen({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-8 text-center">
      <div className="absolute inset-0 opacity-20 [background:radial-gradient(circle_at_50%_25%,#ffffff_0,transparent_32%)]" />
      <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-2 border-white/35 bg-white/10 text-5xl">C</div>
      <h3 className="font-corn-round relative mt-7 text-5xl font-extrabold leading-[0.8]">Cornetto<br />Culture</h3>
      <p className="relative mt-5 max-w-[260px] text-sm font-bold leading-relaxed text-white/70">Find your people. Back your scene. Bring the culture van to your city.</p>
      <div className="relative mt-10 w-full"><PhoneButton onClick={onOpen}>Open app</PhoneButton></div>
      <p className="relative mt-5 text-[10px] font-black uppercase tracking-[0.2em] text-white/45">Built for South African Gen Z</p>
    </div>
  );
}

function HomeScreen({ name, onContinue, onReset }: { name: string; onContinue: () => void; onReset: () => void }) {
  return (
    <div className="relative h-full">
      <img src="/images/app-home.webp" alt="Cornetto Culture app home" loading="eager" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#1a003d] via-transparent to-black/10" />
      <div className="absolute inset-x-5 bottom-24 rounded-2xl border border-white/25 bg-[#4f16aa]/90 p-4 backdrop-blur-md">
        <p className="text-lg font-black">Hi, {name}!</p>
        <p className="mt-1 text-xs font-semibold text-white/75">Explore events, rewards and the cultures shaping Mzansi.</p>
        <div className="mt-4"><PhoneButton onClick={onContinue}>Find your culture</PhoneButton></div>
      </div>
      <button type="button" onClick={onReset} className="absolute right-5 top-14 rounded-full bg-black/35 px-3 py-2 text-[9px] font-black uppercase tracking-wide">Restart</button>
    </div>
  );
}

function AuthScreen({ go, reset }: { go: (screen: Screen) => void; reset: () => void }) {
  return (
    <div className="h-full">
      <AppHeader title="Join the culture" onBack={() => go("home")} onReset={reset} />
      <div className="flex h-[76%] flex-col justify-center px-7 text-center">
        <p className="font-corn-display text-3xl leading-none">YOUR SCENE STARTS HERE</p>
        <p className="mx-auto mt-4 max-w-[260px] text-sm font-semibold text-white/70">Create an account or sign in to pick a culture and motivate why the van should pull up.</p>
        <div className="mt-10 space-y-4">
          <PhoneButton onClick={() => go("signUp")}>Sign up</PhoneButton>
          <PhoneButton secondary onClick={() => go("signIn")}>Sign in</PhoneButton>
        </div>
      </div>
    </div>
  );
}

function AccountScreen({ mode, onSuccess, go, reset }: { mode: "signUp" | "signIn"; onSuccess: (name: string) => void; go: (screen: Screen) => void; reset: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const safeEmail = email.trim().toLowerCase();
    if (mode === "signUp" && name.trim().length < 2) return setError("Please enter at least two characters for your name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safeEmail)) return setError("Please enter a valid email address.");
    if (password.length < 8) return setError("Password must be at least eight characters.");
    setError("");
    onSuccess(mode === "signUp" ? name : safeEmail.split("@")[0]);
  };
  return (
    <div className="h-full overflow-y-auto">
      <AppHeader title={mode === "signUp" ? "Create account" : "Welcome back"} onBack={() => go("auth")} onReset={reset} />
      <form onSubmit={submit} noValidate className="px-7 pt-7">
        <h3 className="font-corn-display text-3xl leading-none">{mode === "signUp" ? "CREATE ACCOUNT" : "SIGN IN"}</h3>
        <p className="mt-3 text-sm font-semibold text-white/65">{mode === "signUp" ? "Tell us who you are, then pick your culture." : "Use your details to continue your culture journey."}</p>
        <div className="mt-8 space-y-4">
          {mode === "signUp" && <Field label="Name" value={name} onChange={setName} maxLength={40} />}
          <Field label="Email" type="email" value={email} onChange={setEmail} />
          <Field label="Password" type="password" value={password} onChange={setPassword} maxLength={72} />
        </div>
        {error && <div role="alert" className="mt-4 rounded-xl border border-[#ff9fc5] bg-[#7a164d]/70 p-3 text-xs font-bold text-white">{error}</div>}
        <button type="submit" className="mt-6 w-full rounded-2xl bg-[#ffd34b] px-4 py-3 text-sm font-black uppercase tracking-[0.12em] text-[#2c174f] shadow-[0_5px_0_#6c3aad] active:translate-y-1 active:shadow-none">{mode === "signUp" ? "Create account" : "Sign in"}</button>
      </form>
    </div>
  );
}

function MenuScreen({ select, go, reset }: { select: (culture: Culture) => void; go: (screen: Screen) => void; reset: () => void }) {
  return (
    <div className="h-full overflow-y-auto pb-12">
      <AppHeader title="Pick your culture" onBack={() => go("auth")} onReset={reset} />
      <div className="px-6 pt-4">
        <h3 className="font-corn-display text-3xl leading-none">WHERE DO YOU DEEP DIVE?</h3>
        <p className="mt-3 text-sm font-semibold text-white/65">Choose the scene that feels most like you. You can restart and explore another at any time.</p>
        <div className="mt-6 space-y-3">
          {cultures.map((culture) => (
            <button key={culture.name} type="button" onClick={() => select(culture.name)} className={`w-full rounded-2xl bg-gradient-to-r ${culture.color} p-4 text-left shadow-[0_5px_0_rgba(20,0,50,0.45)] transition active:translate-y-1 active:shadow-none`}>
              <p className="font-corn-display text-xl leading-none">{culture.name}</p>
              <p className="mt-1 text-xs font-bold text-white/75">{culture.detail}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function CultureScreen({ culture, go, reset }: { culture: Culture | null; go: (screen: Screen) => void; reset: () => void }) {
  const safeCulture = culture || "Skater";
  return (
    <div className="h-full overflow-y-auto pb-12">
      <AppHeader title={safeCulture} onBack={() => go("menu")} onReset={reset} />
      <div className="px-6 pt-4">
        <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/10">
          <img loading="lazy" decoding="async" src={safeCulture === "Skater" ? "/images/south-african-skater-crew.webp" : "/images/cornetto-crew.webp"} alt={`${safeCulture} culture`} className="h-48 w-full object-cover" />
          <div className="p-4"><p className="font-corn-display text-2xl leading-none">{safeCulture.toUpperCase()} CULTURE</p><p className="mt-2 text-xs font-semibold text-white/70">Back your people, unlock the drop and tell us where the van should pull up.</p></div>
        </div>
        <div className="mt-5 space-y-3">
          <PhoneButton onClick={() => go("merch")}>Merch drop</PhoneButton>
          <PhoneButton secondary onClick={() => go("motivate")}>Motivate why</PhoneButton>
          <PhoneButton secondary onClick={() => go("van")}>Van pulls up</PhoneButton>
        </div>
      </div>
    </div>
  );
}

function MerchScreen({ go, reset }: { go: (screen: Screen) => void; reset: () => void }) {
  return (
    <div className="h-full overflow-y-auto pb-14">
      <AppHeader title="Merch drop" onBack={() => go("culture")} onReset={reset} />
      <div className="px-5 pt-3">
        <h3 className="font-corn-display text-3xl leading-none">THE DROP</h3>
        <div className="mt-5 grid grid-cols-2 gap-3">
          {merch.map(([name, detail], index) => (
            <article key={name} className={`min-h-32 rounded-2xl p-3 text-left text-[#2c174f] ${index % 4 === 0 ? "bg-[#ffaad0]" : index % 4 === 1 ? "bg-[#b88aed]" : index % 4 === 2 ? "bg-[#75c9ff]" : "bg-[#ffd44d]"}`}>
              <span className="font-corn-display text-base leading-none">{name}</span><span className="mt-2 block text-[10px] font-bold leading-tight opacity-75">{detail}</span>
            </article>
          ))}
        </div>
        <div className="mt-5"><PhoneButton onClick={() => go("motivate")}>Motivate why</PhoneButton></div>
      </div>
    </div>
  );
}

function MotivateScreen({ culture, go, reset }: { culture: Culture | null; go: (screen: Screen) => void; reset: () => void }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const clean = reason.trim();
    if (clean.length < 20) return setError("Tell us a little more. Use at least 20 characters.");
    if (clean.length > 300) return setError("Keep the motivation under 300 characters.");
    setError("");
    go("van");
  };
  return (
    <div className="h-full overflow-y-auto">
      <AppHeader title="Motivate why" onBack={() => go("culture")} onReset={reset} />
      <form onSubmit={submit} className="px-7 pt-7">
        <h3 className="font-corn-display text-3xl leading-none">BRING THE VAN TO YOUR SCENE</h3>
        <p className="mt-3 text-sm font-semibold text-white/65">Why should Cornetto back the {culture || "Skater"} community where you live?</p>
        <textarea value={reason} maxLength={300} onChange={(event) => setReason(event.target.value)} className="mt-6 h-44 w-full resize-none rounded-2xl border-2 border-white/20 bg-white/10 p-4 text-sm font-bold text-white outline-none placeholder:text-white/35 focus:border-[#ffd34b]" placeholder="Tell us about your crew, your spot and what the sponsorship could unlock..." />
        <div className="mt-2 flex justify-between text-[10px] font-bold text-white/50"><span>No personal addresses, phone numbers or private details.</span><span>{reason.length}/300</span></div>
        {error && <p role="alert" className="mt-3 rounded-xl bg-[#7a164d]/70 p-3 text-xs font-bold">{error}</p>}
        <button type="submit" className="mt-5 w-full rounded-2xl bg-[#ffd34b] px-4 py-3 text-sm font-black uppercase tracking-[0.12em] text-[#2c174f] shadow-[0_5px_0_#6c3aad]">Submit motivation</button>
      </form>
    </div>
  );
}

function VanScreen({ culture, reset }: { culture: Culture | null; reset: () => void }) {
  return (
    <div className="relative flex h-full flex-col items-center justify-center overflow-hidden px-7 text-center">
      <img src="/images/van-night.webp" alt="Cornetto culture van" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#1a003d] via-[#4f16aa]/70 to-[#7033d8]/55" />
      <div className="relative rounded-3xl border border-white/25 bg-[#361076]/85 p-6 backdrop-blur-md">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ffd34b]">Motivation received</p>
        <h3 className="font-corn-display mt-4 text-4xl leading-[0.9]">THE VAN COULD PULL UP</h3>
        <p className="mt-5 text-sm font-semibold leading-relaxed text-white/75">Your {culture || "Skater"} culture pitch is safely staged in this prototype. A real launch would send it to moderation before publication.</p>
        <div className="mt-7"><PhoneButton onClick={reset}>Start again</PhoneButton></div>
      </div>
    </div>
  );
}

export default function AppPrototype() {
  const [state, dispatch] = useReducer(reducer, initialState, (fallback) => {
    try {
      const stored = sessionStorage.getItem("cornetto-prototype");
      if (!stored) return fallback;
      const parsed = JSON.parse(stored) as Partial<State>;
      if (!allowedScreens.includes(parsed.screen as Screen)) return fallback;
      const safeName = typeof parsed.name === "string" ? parsed.name.trim().slice(0, 40) || fallback.name : fallback.name;
      const safeCulture = allowedCultures.includes(parsed.culture as Culture) ? parsed.culture as Culture : null;
      return { screen: parsed.screen as Screen, name: safeName, culture: safeCulture };
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    try { sessionStorage.setItem("cornetto-prototype", JSON.stringify(state)); } catch { /* Prototype remains usable when storage is blocked. */ }
  }, [state]);

  const go = (screen: Screen) => dispatch({ type: "GO", screen });
  const reset = () => dispatch({ type: "RESET" });
  const completeAccount = (name: string) => { dispatch({ type: "SET_NAME", name }); go("menu"); };

  let content: ReactNode;
  switch (state.screen) {
    case "open": content = <OpenScreen onOpen={() => go("home")} />; break;
    case "home": content = <HomeScreen name={state.name} onContinue={() => go("auth")} onReset={reset} />; break;
    case "auth": content = <AuthScreen go={go} reset={reset} />; break;
    case "signUp": content = <AccountScreen mode="signUp" onSuccess={completeAccount} go={go} reset={reset} />; break;
    case "signIn": content = <AccountScreen mode="signIn" onSuccess={completeAccount} go={go} reset={reset} />; break;
    case "menu": content = <MenuScreen select={(culture) => dispatch({ type: "SELECT_CULTURE", culture })} go={go} reset={reset} />; break;
    case "culture": content = <CultureScreen culture={state.culture} go={go} reset={reset} />; break;
    case "merch": content = <MerchScreen go={go} reset={reset} />; break;
    case "motivate": content = <MotivateScreen culture={state.culture} go={go} reset={reset} />; break;
    case "van": content = <VanScreen culture={state.culture} reset={reset} />; break;
    default: content = <OpenScreen onOpen={() => go("home")} />;
  }

  return <PrototypeBoundary><Shell>{content}</Shell></PrototypeBoundary>;
}