const topFlow = ["OPEN APP"];
const authFlow = ["SIGN UP", "SIGN IN"];
const cultureFlow = ["SKATER", "DOG WALKERS", "VEGAN", "ARTIST"];
const actionFlow = ["MERCH DROP", "MOTIVATE WHY", "VAN PULLS UP"];

function FlowPill({ children, featured = false }: { children: string; featured?: boolean }) {
  return (
    <div
      className={`rounded-full border-[3px] border-cornetto-purple px-6 py-3 text-center text-xs font-black uppercase tracking-[0.22em] md:text-sm ${
        featured ? "bg-cornetto-orange text-cornetto-ink shadow-[7px_7px_0_#211434]" : "bg-cornetto-cream text-cornetto-purple"
      }`}
    >
      {children}
    </div>
  );
}

function Connector({ tall = false }: { tall?: boolean }) {
  return <div className={`${tall ? "h-16" : "h-10"} w-[3px] bg-cornetto-purple/30`} />;
}

export default function UserFlow() {
  return (
    <section className="bg-cornetto-cream py-20 md:py-32 cv-auto">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 md:px-8 lg:grid-cols-[0.85fr_1.45fr]">
        <div>
          <p className="corn-section-kicker">04 - User Flow</p>
          <h2 className="mt-5 font-corn-display text-5xl leading-[0.9] tracking-[-0.04em] text-cornetto-purple md:text-8xl">
            OPEN. PICK.
            <br />
            MOTIVATE.
          </h2>
          <p className="mt-8 max-w-md text-base font-semibold leading-relaxed text-cornetto-ink/70 md:text-lg">
            I created a user flow to help me understand how the user will
            navigate through the Cornetto Culture app. Upon arrival, after the
            user creates an account, the menu frame appears with a list of sub-
            cultures - navigation still conforms to a simple but effective
            experience.
          </p>
        </div>

        <div className="corn-outline-shadow rounded-[2rem] bg-cornetto-lavender/35 px-4 py-10 md:px-8 md:py-12">
          <div className="flex flex-col items-center">
            {topFlow.map((item) => (
              <FlowPill key={item}>{item}</FlowPill>
            ))}
            <Connector />

            <div className="flex flex-wrap justify-center gap-4">
              {authFlow.map((item) => (
                <FlowPill key={item}>{item}</FlowPill>
              ))}
            </div>
            <Connector />

            <FlowPill>CREATE ACCOUNT</FlowPill>
            <Connector />

            <FlowPill>MENU</FlowPill>
            <Connector tall />

            <div className="relative flex w-full flex-wrap justify-center gap-3 md:gap-5">
              <div className="absolute -top-8 left-1/2 hidden h-8 w-[68%] -translate-x-1/2 border-x-[3px] border-t-[3px] border-cornetto-purple/30 md:block" />
              {cultureFlow.map((item) => (
                <FlowPill key={item}>{item}</FlowPill>
              ))}
            </div>
            <Connector tall />

            <div className="relative flex w-full flex-wrap justify-center gap-3 md:gap-5">
              <div className="absolute -top-8 left-1/2 hidden h-8 w-[54%] -translate-x-1/2 border-x-[3px] border-t-[3px] border-cornetto-purple/30 md:block" />
              {actionFlow.map((item) => (
                <FlowPill key={item}>{item}</FlowPill>
              ))}
            </div>

            <div className="mt-10">
              <FlowPill featured>SIMPLIFIED USER FLOW</FlowPill>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}