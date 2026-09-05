// A stylised isometric "Ready Business" board — echoing the printed magazine spread.
// Uses inline SVG so it stays crisp and colourful.

export const MonopolyBoard = () => (
  <svg
    viewBox="0 0 800 520"
    xmlns="http://www.w3.org/2000/svg"
    className="w-full h-auto"
    aria-label="Ready Business Monopoly board illustration"
  >
    <defs>
      <linearGradient id="grass" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#A9D66A" />
        <stop offset="1" stopColor="#6EB33F" />
      </linearGradient>
      <linearGradient id="road" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stopColor="#3A3A3A" />
        <stop offset="1" stopColor="#212121" />
      </linearGradient>
    </defs>

    {/* Grass diamond (isometric) */}
    <polygon points="400,20 780,240 400,460 20,240" fill="url(#grass)" stroke="#1B1210" strokeWidth="3" />

    {/* Roads crossing */}
    <polygon points="400,60 720,240 400,420 80,240" fill="none" />
    <polygon points="400,120 660,240 400,360 140,240"
             fill="url(#road)" opacity="0" />
    {/* Two crossing streets */}
    <polygon points="400,80 590,175 400,270 210,175" fill="url(#road)" />
    <polygon points="400,210 590,305 400,400 210,305" fill="url(#road)" />
    <polygon points="400,80 210,175 210,305 400,210" fill="url(#road)" opacity=".9" />
    <polygon points="400,80 590,175 590,305 400,210" fill="url(#road)" opacity=".75" />

    {/* Road dashes */}
    <g stroke="#F5E36B" strokeWidth="3" strokeDasharray="10 8" fill="none">
      <path d="M240 190 L390 265" />
      <path d="M560 190 L410 265" />
      <path d="M240 290 L390 215" />
      <path d="M560 290 L410 215" />
    </g>

    {/* Township house (left) */}
    <g transform="translate(120 195)">
      <polygon points="0,30 40,10 80,30 80,70 40,90 0,70" fill="#E68A3C" stroke="#1B1210" strokeWidth="2" />
      <polygon points="0,30 40,50 80,30 40,10" fill="#F2B072" stroke="#1B1210" strokeWidth="2" />
      <rect x="30" y="55" width="14" height="20" fill="#1B1210" />
    </g>

    {/* Shop */}
    <g transform="translate(210 145)">
      <polygon points="0,30 44,8 88,30 88,72 44,94 0,72" fill="#E85A5A" stroke="#1B1210" strokeWidth="2" />
      <polygon points="0,30 44,52 88,30 44,8" fill="#FF8888" stroke="#1B1210" strokeWidth="2" />
      <rect x="32" y="60" width="24" height="18" fill="#F4EBDC" stroke="#1B1210" strokeWidth="1.5" />
    </g>

    {/* Suburb house */}
    <g transform="translate(540 155)">
      <polygon points="0,30 50,5 100,30 100,80 50,105 0,80" fill="#4C7CB8" stroke="#1B1210" strokeWidth="2" />
      <polygon points="0,30 50,55 100,30 50,5" fill="#7AA6D6" stroke="#1B1210" strokeWidth="2" />
      <rect x="36" y="60" width="18" height="24" fill="#1B1210" />
      <rect x="66" y="60" width="14" height="14" fill="#F4EBDC" />
    </g>

    {/* Office tower */}
    <g transform="translate(620 100)">
      <polygon points="0,50 40,30 40,150 0,170" fill="#2C4A6B" stroke="#1B1210" strokeWidth="2" />
      <polygon points="40,30 80,50 80,170 40,150" fill="#3D6690" stroke="#1B1210" strokeWidth="2" />
      <g fill="#F5E36B">
        <rect x="8" y="70" width="8" height="8" />
        <rect x="24" y="66" width="8" height="8" />
        <rect x="8" y="94" width="8" height="8" />
        <rect x="24" y="90" width="8" height="8" />
        <rect x="8" y="118" width="8" height="8" />
        <rect x="24" y="114" width="8" height="8" />
        <rect x="50" y="72" width="8" height="8" />
        <rect x="66" y="76" width="8" height="8" />
        <rect x="50" y="96" width="8" height="8" />
        <rect x="66" y="100" width="8" height="8" />
      </g>
    </g>

    {/* Wifi arcs above each building */}
    <g stroke="#E60000" strokeWidth="3" fill="none" strokeLinecap="round">
      <path d="M160 175 q10 -12 20 0" />
      <path d="M155 168 q15 -18 30 0" />
      <path d="M260 120 q10 -12 20 0" />
      <path d="M255 113 q15 -18 30 0" />
      <path d="M590 130 q10 -12 20 0" />
      <path d="M585 123 q15 -18 30 0" />
      <path d="M660 80 q10 -12 20 0" />
      <path d="M655 73 q15 -18 30 0" />
    </g>
    <g fill="#E60000">
      <circle cx="170" cy="182" r="3" />
      <circle cx="270" cy="127" r="3" />
      <circle cx="600" cy="137" r="3" />
      <circle cx="670" cy="87" r="3" />
    </g>

    {/* Tiny cars on the road */}
    <g>
      <rect x="330" y="150" width="26" height="12" rx="3" fill="#F5E36B" stroke="#1B1210" strokeWidth="2" transform="rotate(28 343 156)" />
      <rect x="450" y="235" width="26" height="12" rx="3" fill="#E60000" stroke="#1B1210" strokeWidth="2" transform="rotate(-28 463 241)" />
      <rect x="290" y="290" width="26" height="12" rx="3" fill="#4C7CB8" stroke="#1B1210" strokeWidth="2" transform="rotate(-28 303 296)" />
    </g>

    {/* Monopoly-style property tiles across bottom */}
    <g transform="translate(0 420)">
      {[
        { x: 40,  label: "COVENTRY ST.", band: "#8B2E2E" },
        { x: 200, label: "VINE STREET",  band: "#7BB08A" },
        { x: 360, label: "SANDTON",      band: "#2E5EAA" },
        { x: 520, label: "PARK LANE",    band: "#2E5EAA" },
        { x: 680, label: "GO DREAM",     band: "#E60000" },
      ].map((t) => (
        <g key={t.label} transform={`translate(${t.x} 0)`}>
          <rect width="120" height="80" fill="#F4EBDC" stroke="#1B1210" strokeWidth="2.5" />
          <rect width="120" height="18" fill={t.band} stroke="#1B1210" strokeWidth="2.5" />
          <text
            x="60" y="52"
            textAnchor="middle"
            fontFamily="Rubik Mono One, monospace"
            fontSize="11"
            fill="#1B1210"
          >{t.label}</text>
        </g>
      ))}
    </g>

    {/* Arrow indicating movement */}
    <g transform="translate(560 470)">
      <path d="M0 0 L60 0 L60 -6 L80 5 L60 16 L60 10 L0 10 Z"
            fill="#1B1210" transform="rotate(-8)" />
    </g>
  </svg>
);
