import { Fade, Tag } from './shared';

type FlowNodeProps = {
  x: number;
  y: number;
  label: string;
  width?: number;
  accent?: boolean;
};

function FlowNode({ x, y, label, width = 180, accent = false }: FlowNodeProps) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height="52"
        rx="20"
        fill={accent ? '#173f29' : '#0d1a10'}
        stroke={accent ? '#74c69d' : '#2d6a4f'}
        strokeWidth="2"
      />
      <text
        x={x + width / 2}
        y={y + 32}
        textAnchor="middle"
        fill={accent ? '#d8f3dc' : '#b7e4c7'}
        fontSize="13"
        fontWeight="600"
        fontFamily="Inter, sans-serif"
      >
        {label}
      </text>
    </g>
  );
}

function Decision({ x, y, lines }: { x: number; y: number; lines: string[] }) {
  const side = 112;
  const cx = x + side / 2;
  const cy = y + side / 2;
  return (
    <g>
      <polygon
        points={`${cx},${y} ${x + side},${cy} ${cx},${y + side} ${x},${cy}`}
        fill="#0d1a10"
        stroke="#40916c"
        strokeWidth="2.25"
      />
      <text
        x={cx}
        y={cy - ((lines.length - 1) * 8)}
        textAnchor="middle"
        fill="#b7e4c7"
        fontSize="11"
        fontWeight="600"
        fontFamily="Inter, sans-serif"
      >
        {lines.map((line, index) => (
          <tspan key={line} x={cx} dy={index === 0 ? 0 : 15}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
}

function Terminal({ x, y, lines }: { x: number; y: number; lines: string[] }) {
  return (
    <g>
      <circle cx={x} cy={y} r="49" fill="#102719" stroke="#74c69d" strokeWidth="2.5" />
      <circle cx={x} cy={y} r="42" fill="none" stroke="#2d6a4f" />
      <text
        x={x}
        y={y - ((lines.length - 1) * 8)}
        textAnchor="middle"
        fill="#d8f3dc"
        fontSize="12"
        fontWeight="700"
        fontFamily="Inter, sans-serif"
      >
        {lines.map((line, index) => (
          <tspan key={line} x={x} dy={index === 0 ? 0 : 16}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
}

function Connector({ d, label, lx, ly }: { d: string; label?: string; lx?: number; ly?: number }) {
  return (
    <g>
      <path
        d={d}
        fill="none"
        stroke="#74c69d"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeDasharray="2 9"
        markerEnd="url(#tau-flow-arrow)"
        opacity="0.88"
      />
      {label && lx !== undefined && ly !== undefined && (
        <text
          x={lx}
          y={ly}
          textAnchor="middle"
          fill="#d8f3dc"
          fontSize="10"
          fontWeight="800"
          fontFamily="Inter, sans-serif"
        >
          {label}
        </text>
      )}
    </g>
  );
}

function UserFlowDiagram() {
  return (
    <svg
      viewBox="0 0 1450 1730"
      role="img"
      aria-labelledby="user-flow-title user-flow-description"
      className="min-w-[900px] w-full h-auto"
    >
      <title id="user-flow-title">Connected TAU FOODS grocery ordering user flow</title>
      <desc id="user-flow-description">
        A connected flow from account access through combo, browse, saved-item and search paths into cart, delivery, payment and an order confirmation.
      </desc>
      <defs>
        <marker id="tau-flow-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="#74c69d" />
        </marker>
      </defs>

      <text x="70" y="76" fill="#74c69d" fontSize="12" fontWeight="800" fontFamily="Inter, sans-serif" letterSpacing="2.2">
        ORDERING FLOW / 01
      </text>
      <text x="70" y="110" fill="#ffffff" fontSize="24" fontWeight="800" fontFamily="Inter, sans-serif">
        From intent to a confirmed grocery delivery.
      </text>

      {/* Connectors are layered first so every branch visibly meets the next screen. */}
      <Connector d="M725 199 V238 H500 V270" label="RETURNING" lx={554} ly={229} />
      <Connector d="M725 199 V238 H950 V270" label="NEW" lx={898} ly={229} />
      <Connector d="M500 322 V354 H725 V390" />
      <Connector d="M950 322 V354 H725 V390" />
      <Connector d="M725 442 V484 H246 V520" />

      {/* Decision chain from the original flow: combo -> known item -> saved item. */}
      <Connector d="M302 576 H560 V576" label="NO" lx={432} ly={562} />
      <Connector d="M672 576 H960 V576" label="YES" lx={816} ly={562} />

      {/* Combo branch. */}
      <Connector d="M190 632 V668 H150 V710" label="YES" lx={167} ly={660} />
      <Connector d="M240 762 V806 H246 V838" />
      <Connector d="M302 894 H410 V930" label="YES" lx={360} ly={886} />
      <Connector d="M246 950 V982 H150 V1030" label="NO" lx={180} ly={974} />
      <Connector d="M150 1082 V1124" />
      <Connector d="M150 1176 V1218 H650 V1260" />
      <Connector d="M410 982 V1030" />
      <Connector d="M410 1082 V1124" />
      <Connector d="M410 1176 V1218 H650 V1260" />

      {/* Browse/discovery branch. */}
      <Connector d="M616 632 V670 H410 V710" label="NO" lx={548} ly={660} />
      <Connector d="M410 762 V806 H500 V838" />
      <Connector d="M500 890 V930" />
      <Connector d="M500 982 V1030" />
      <Connector d="M500 1082 V1124" />
      <Connector d="M500 1176 V1218 H650 V1260" />

      {/* Saved-item and exact-search branch. */}
      <Connector d="M1016 632 V666 H1090 V1260" label="YES" lx={1052} ly={660} />
      <Connector d="M1072 576 H1240 V710" label="NO" lx={1160} ly={562} />
      <Connector d="M1240 762 V806" />
      <Connector d="M1240 858 V878" />
      <Connector d="M1184 934 H1110 V970" label="YES" lx={1146} ly={926} />
      <Connector d="M1240 990 V1010 H1300 V1030" label="NO" lx={1270} ly={1004} />
      <Connector d="M1110 1022 V1064" />
      <Connector d="M1110 1116 V1158" />
      <Connector d="M1110 1210 V1232 H1090 V1260" />
      <Connector d="M1300 1082 V1124" />
      <Connector d="M1300 1176 V1218 H1090 V1260" />

      {/* One shared checkout spine. */}
      <Connector d="M740 1312 V1350" />
      <Connector d="M740 1402 V1440" />
      <Connector d="M740 1492 V1530" />
      <Connector d="M740 1582 V1612" />

      {/* Goal and access. */}
      <Terminal x={725} y={150} lines={['THE GOAL IS', 'TO ORDER', 'GROCERIES']} />
      <FlowNode x={410} y={270} label="Sign in" accent />
      <FlowNode x={860} y={270} label="Create account" accent />
      <FlowNode x={625} y={390} width={200} label="Main page" accent />

      {/* Core questions from the supplied original diagram. */}
      <Decision x={190} y={520} lines={['Does user want', 'to inspect combos?']} />
      <Decision x={560} y={520} lines={['Does user know', 'what they want?']} />
      <Decision x={960} y={520} lines={['Does user already', 'have items saved?']} />

      {/* Combo route. */}
      <FlowNode x={60} y={710} label={'Category "Food"'} />
      <Decision x={190} y={838} lines={['Does user want', 'to filter a category?']} />
      <FlowNode x={320} y={930} label="Applying filters" />
      <FlowNode x={60} y={1030} label="Result page" />
      <FlowNode x={60} y={1124} label="Select item" />
      <FlowNode x={320} y={1030} label="Result page" />
      <FlowNode x={320} y={1124} label="Select item" />

      {/* Main-page discovery route. */}
      <FlowNode x={320} y={710} label="Main page scrolling" />
      <FlowNode x={410} y={838} label="Interesting items" />
      <FlowNode x={410} y={930} label="Select item" />
      <FlowNode x={410} y={1030} label="My cart" />
      <FlowNode x={410} y={1124} label="Review cart" />

      {/* Saved and search route. */}
      <FlowNode x={1000} y={710} label="My cart" />
      <FlowNode x={1150} y={710} label="Search items" />
      <FlowNode x={1150} y={806} label={'Input "item name"'} />
      <Decision x={1184} y={878} lines={['Does user want', 'to filter results?']} />
      <FlowNode x={1020} y={970} label="Applying filters" />
      <FlowNode x={1020} y={1064} label="Result page" />
      <FlowNode x={1020} y={1158} label="Select item" />
      <FlowNode x={1210} y={1030} label="Result page" />
      <FlowNode x={1210} y={1124} label="Select item" />

      {/* Completion. */}
      <FlowNode x={650} y={1260} label="My cart" accent />
      <FlowNode x={650} y={1350} label="Delivery options" />
      <FlowNode x={650} y={1440} label="Payment method" />
      <FlowNode x={650} y={1530} label="Order summary" />
      <Terminal x={740} y={1660} lines={['ORDER', 'PLACED']} />

      <g transform="translate(70 1480)">
        <rect width="330" height="92" rx="16" fill="#0d1a10" stroke="#243d2c" />
        <circle cx="27" cy="26" r="8" fill="#102719" stroke="#74c69d" />
        <text x="45" y="30" fill="#b7e4c7" fontSize="11" fontFamily="Inter, sans-serif">Start / end state</text>
        <rect x="18" y="49" width="18" height="12" rx="5" fill="#0d1a10" stroke="#2d6a4f" />
        <text x="45" y="60" fill="#b7e4c7" fontSize="11" fontFamily="Inter, sans-serif">Action screen</text>
        <polygon points="242,45 252,55 242,65 232,55" fill="#0d1a10" stroke="#40916c" />
        <text x="262" y="60" fill="#b7e4c7" fontSize="11" fontFamily="Inter, sans-serif">Decision</text>
      </g>
    </svg>
  );
}

export default function UserFlow() {
  return (
    <section id="tau-user-flow" className="py-20 lg:py-28 bg-[#0d1a10]">
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <Fade className="mb-12">
          <Tag>User Flow</Tag>
          <div className="mt-4 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <h2 className="font-tau-futura font-black text-4xl sm:text-5xl text-white tracking-tight">
              ONE CONNECTED PATH
            </h2>
            <p className="text-[14px] text-white/50 max-w-md leading-relaxed">
              This map follows the original decision structure: sign in or create an account,
              then inspect combos, search for a known item, or return to saved items. Every
              valid route reconnects at cart, delivery, payment and order confirmation.
            </p>
          </div>
        </Fade>

        <Fade>
          <div className="rounded-[2rem] bg-[#070c09] border border-[#243d2c] overflow-x-auto p-3 sm:p-6">
            <UserFlowDiagram />
          </div>
          <p className="mt-4 text-xs text-white/30 text-center lg:hidden">Swipe horizontally to review the full connected flow.</p>
        </Fade>
      </div>
    </section>
  );
}