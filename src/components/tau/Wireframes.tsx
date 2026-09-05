import { Fade, Tag } from './shared';

type WireframeKind = 'delivery' | 'confirmation' | 'store' | 'sign-in' | 'quick-shop' | 'summary';

const SCREEN_LABELS: Record<WireframeKind, string> = {
  delivery: 'Delivery options',
  confirmation: 'Order placed',
  store: 'Store',
  'sign-in': 'Sign in',
  'quick-shop': 'Quick shop',
  summary: 'Order summary',
};

function Chrome() {
  return (
    <>
      <text x="28" y="42" fill="#40916c" fontSize="13" fontWeight="700">9:41</text>
      <rect x="142" y="18" width="109" height="30" rx="15" fill="#020603" />
      <path d="M328 35h16M330 30v10M351 28v14M358 25v17" stroke="#40916c" strokeWidth="2" strokeLinecap="round" />
    </>
  );
}

function Bar({ x, y, width, height = 24, radius = 8, active = false }: { x: number; y: number; width: number; height?: number; radius?: number; active?: boolean }) {
  return <rect x={x} y={y} width={width} height={height} rx={radius} fill={active ? '#0d5d31' : '#0a311b'} opacity={active ? 0.92 : 0.72} />;
}

function LoFiDrawing({ kind }: { kind: WireframeKind }) {
  const faint = '#0a311b';
  const text = '#3caa67';

  if (kind === 'delivery') {
    return (
      <>
        <text x="196" y="92" textAnchor="middle" fill={text} fontSize="17" fontWeight="700">Delivery Options</text>
        <Bar x={26} y={122} width={78} height={36} radius={18} active />
        <Bar x={114} y={122} width={78} height={36} radius={18} />
        <Bar x={202} y={122} width={78} height={36} radius={18} />
        <Bar x={290} y={122} width={78} height={36} radius={18} />
        <text x="26" y="191" fill={text} fontSize="13" fontWeight="600">Select Speed For First Shipment</text>
        <Bar x={26} y={210} width={162} height={132} radius={16} />
        <Bar x={204} y={210} width={162} height={132} radius={16} />
        <text x="26" y="380" fill={text} fontSize="13" fontWeight="600">Select Date</text>
        <Bar x={26} y={399} width={102} height={70} radius={13} active />
        <Bar x={145} y={399} width={102} height={70} radius={13} />
        <Bar x={264} y={399} width={102} height={70} radius={13} />
        <text x="26" y="509" fill={text} fontSize="13" fontWeight="600">Select Time</text>
        <Bar x={26} y={528} width={102} height={70} radius={13} />
        <Bar x={145} y={528} width={102} height={70} radius={13} active />
        <Bar x={264} y={528} width={102} height={70} radius={13} />
        <Bar x={26} y={748} width={340} height={54} radius={27} active />
      </>
    );
  }

  if (kind === 'confirmation') {
    return (
      <>
        <rect x="82" y="96" width="229" height="209" rx="18" fill={faint} />
        <circle cx="196" cy="190" r="52" fill="#0d5d31" opacity="0.68" />
        <path d="M166 191l20 20 41-48" fill="none" stroke="#5fc986" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
        <text x="196" y="410" textAnchor="middle" fill={text} fontSize="17" fontWeight="700">Order placed.</text>
        <text x="196" y="436" textAnchor="middle" fill={text} fontSize="17" fontWeight="700">Your order number is</text>
        <text x="196" y="470" textAnchor="middle" fill="#5fc986" fontSize="25" fontWeight="800">#5678</text>
        {[57, 126, 196, 267, 336].map((x) => <circle key={x} cx={x} cy="760" r="22" fill={faint} />)}
      </>
    );
  }

  if (kind === 'store') {
    return (
      <>
        <text x="196" y="92" textAnchor="middle" fill={text} fontSize="17" fontWeight="700">Store</text>
        <circle cx="344" cy="87" r="11" fill="none" stroke={text} strokeWidth="2" />
        <rect x="33" y="145" width="327" height="198" rx="16" fill={faint} />
        <text x="196" y="396" textAnchor="middle" fill="#58b979" fontSize="24" fontWeight="700">Vegetables</text>
        <text x="196" y="417" textAnchor="middle" fill={text} fontSize="13">Browse</text>
        <Bar x={28} y={463} width={157} height={162} radius={14} />
        <Bar x={208} y={463} width={157} height={162} radius={14} />
        {[55, 127, 196, 267, 338].map((x) => <circle key={x} cx={x} cy="755" r="22" fill={faint} />)}
      </>
    );
  }

  if (kind === 'sign-in') {
    return (
      <>
        <rect x="72" y="106" width="250" height="142" rx="16" fill={faint} />
        <Bar x={50} y={304} width={293} height={46} radius={10} />
        <Bar x={50} y={370} width={293} height={46} radius={10} />
        <Bar x={50} y={436} width={293} height={46} radius={10} />
        <Bar x={50} y={554} width={293} height={52} radius={26} active />
        <text x="196" y="652" textAnchor="middle" fill={text} fontSize="12" fontWeight="700">SIGN IN</text>
      </>
    );
  }

  if (kind === 'quick-shop') {
    return (
      <>
        <text x="196" y="92" textAnchor="middle" fill={text} fontSize="17" fontWeight="700">Quick Shop</text>
        <path d="M33 80h17v17H33z" fill="none" stroke={text} strokeWidth="2" />
        <path d="M337 86l7 7 14-16" fill="none" stroke={text} strokeWidth="2" />
        <Bar x={26} y={122} width={78} height={36} radius={18} active />
        <Bar x={114} y={122} width={78} height={36} radius={18} />
        <Bar x={202} y={122} width={78} height={36} radius={18} />
        <Bar x={290} y={122} width={78} height={36} radius={18} />
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <rect key={item} x={28 + (item % 3) * 116} y={206 + Math.floor(item / 3) * 160} width="100" height="137" rx="13" fill={faint} />
        ))}
        {[55, 127, 196, 267, 338].map((x) => <circle key={x} cx={x} cy="755" r="22" fill={faint} />)}
      </>
    );
  }

  return (
    <>
      <text x="196" y="92" textAnchor="middle" fill={text} fontSize="17" fontWeight="700">Order Summary</text>
      <Bar x={26} y={122} width={78} height={36} radius={18} active />
      <Bar x={114} y={122} width={78} height={36} radius={18} />
      <Bar x={202} y={122} width={78} height={36} radius={18} />
      <Bar x={290} y={122} width={78} height={36} radius={18} />
      {[0, 1, 2, 3].map((item) => <Bar key={item} x={28} y={196 + item * 88} width={337} height={67} radius={10} />)}
      <text x="28" y="582" fill={text} fontSize="13">Sub-total</text>
      <text x="365" y="582" textAnchor="end" fill={text} fontSize="13">R764.94/mo</text>
      <text x="28" y="608" fill={text} fontSize="13">Delivery</text>
      <text x="365" y="608" textAnchor="end" fill={text} fontSize="13">Standard rate</text>
      <text x="28" y="640" fill="#5fc986" fontSize="17" fontWeight="800">Total</text>
      <text x="365" y="640" textAnchor="end" fill="#5fc986" fontSize="17" fontWeight="800">R764.94/mo</text>
      <Bar x={26} y={706} width={340} height={54} radius={27} active />
    </>
  );
}

function LoFiPhone({ kind }: { kind: WireframeKind }) {
  return (
    <article className="mx-auto w-full max-w-[242px]">
      <div className="p-1 rounded-[2.35rem] bg-[#07120b] border-2 border-[#087e3e] shadow-[0_18px_45px_rgba(0,0,0,0.42)]">
        <div className="overflow-hidden rounded-[2rem] bg-[#031006]" style={{ aspectRatio: '393 / 852' }}>
          <svg viewBox="0 0 393 852" className="block w-full h-full" aria-label={`${SCREEN_LABELS[kind]} low-fidelity wireframe`}>
            <rect width="393" height="852" fill="#031006" />
            <Chrome />
            <LoFiDrawing kind={kind} />
          </svg>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between px-1">
        <p className="text-xs font-semibold text-white/70">{SCREEN_LABELS[kind]}</p>
        <p className="text-[10px] font-mono text-[#74c69d]">393 x 852</p>
      </div>
    </article>
  );
}

export default function Wireframes() {
  return (
    <section id="tau-wireframes" className="py-20 lg:py-28 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <Fade className="mb-14">
          <Tag>Wireframes</Tag>
          <div className="mt-4 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <h2 className="font-tau-futura font-black text-4xl sm:text-5xl text-white tracking-tight">
              LO-FI PROTOTYPES
            </h2>
            <p className="text-[14px] text-white/50 max-w-md leading-relaxed">
              These lo-fi screens use the original iPhone 14 Pro / 15 / 16 Pro design canvas
              of 393 x 852 points. They validate the delivery, store, authentication, quick-shop,
              and order-summary hierarchy before visual styling is applied.
            </p>
          </div>
        </Fade>

        <Fade>
          <div className="rounded-[2rem] bg-[#070c09] border border-[#243d2c] p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4 mb-8 border-b border-[#243d2c] pb-5">
              <p className="text-xs text-white/50">Validated prototype set</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#74c69d] font-bold">iPhone viewport / 393 x 852</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-x-5 gap-y-9">
              {(['delivery', 'confirmation', 'store', 'sign-in', 'quick-shop', 'summary'] as WireframeKind[]).map((kind) => (
                <LoFiPhone key={kind} kind={kind} />
              ))}
            </div>
          </div>
        </Fade>

        <Fade className="mt-12">
          <div className="grid md:grid-cols-[0.8fr_1.2fr] gap-5">
            <div className="p-7 rounded-2xl bg-[#0d1a10] border border-[#243d2c]">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#74c69d] font-bold mb-4">Testing focus</p>
              <ul className="space-y-3 text-[13px] text-white/55">
                {[
                  'Can a shopper choose delivery speed, date and time without hesitation?',
                  'Does order confirmation provide a clear next action and reference number?',
                  'Is Quick Shop distinguishable from the full Store browsing flow?',
                  'Can the summary be scanned before payment on a 393 px-wide display?',
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 bg-[#74c69d]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-7 rounded-2xl bg-[#0d1a10] border border-[#243d2c]">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#74c69d] font-bold mb-4">Information Architecture</p>
              <div className="flex flex-wrap items-center gap-2">
                {[
                  'Home', 'Store', 'Vegetables', 'Quick Shop', 'Search', 'Product detail',
                  'My Cart', 'Delivery options', 'Payment method', 'Order summary', 'Order placed',
                ].map((item, index) => (
                  <div key={item} className="flex items-center gap-2">
                    <span className={`px-3 py-2 rounded-lg text-[11px] border ${index === 0 ? 'bg-[#1a4d2e] border-[#2d6a4f] text-[#74c69d]' : 'bg-[#0a0a0a] border-[#243d2c] text-white/55'}`}>
                      {item}
                    </span>
                    {index < 10 && <span className="text-[#2d6a4f] text-xs">-&gt;</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Fade>
      </div>
    </section>
  );
}