export default function Marquee() {
  const items = [
    "For the Gram",
    "Flexers",
    "Sneakfreak99",
    "ASMR",
    "Boujee",
    "No Cap",
    "Bowl energy",
    "Air Fried",
  ];
  return (
    <div className="relative overflow-hidden border-y-2 border-[#171412] bg-[#f6c945] py-4">
      <div className="nandos-marquee-track flex w-max items-center">
        {[0, 1].map((dup) => (
          <div key={dup} className="flex items-center" aria-hidden={dup === 1}>
            {items.map((item, i) => (
              <span key={i} className="flex shrink-0 items-center">
                <span className="whitespace-nowrap px-4 font-nandos-display text-2xl uppercase tracking-wide text-[#171412] md:text-3xl">
                  {item}
                </span>
                <svg
                  className="h-5 w-5 text-[#e63525]"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M13.2 2.4 21 12l-7.8 9.6L11 19.1 16.5 13H3v-2h13.5L11 4.9z" />
                </svg>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
