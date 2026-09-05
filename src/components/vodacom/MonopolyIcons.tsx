// Hand-crafted SVG icons that echo the classic Monopoly tokens,
// re-drawn in the Vodacom red so they sit inside the case-study cards.

export const TopHatIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg">
    {/* Top hat */}
    <path
      d="M55 30 Q55 22 65 22 L135 22 Q145 22 145 30 L145 90 L55 90 Z"
      fill="#E60000" stroke="#2A2A2A" strokeWidth="4" strokeLinejoin="round"
    />
    {/* Hat band */}
    <rect x="52" y="72" width="96" height="10" fill="#F4EBDC" stroke="#2A2A2A" strokeWidth="4" />
    {/* Brim */}
    <ellipse cx="100" cy="92" rx="70" ry="10" fill="#E60000" stroke="#2A2A2A" strokeWidth="4" />
    {/* Moustache */}
    <path
      d="M40 135
         Q60 118 100 130
         Q140 118 160 135
         Q150 158 122 150
         Q108 145 100 152
         Q92 145 78 150
         Q50 158 40 135 Z"
      fill="#E60000" stroke="#2A2A2A" strokeWidth="4" strokeLinejoin="round"
    />
  </svg>
);

export const ShoeIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 220 160" className={className} xmlns="http://www.w3.org/2000/svg">
    {/* Boot silhouette */}
    <path
      d="M25 40
         Q25 25 40 25
         L55 25
         Q68 25 68 42
         L68 72
         Q68 82 78 84
         L170 96
         Q198 100 198 118
         L198 128
         Q198 138 188 138
         L38 138
         Q25 138 25 125 Z"
      fill="#E60000" stroke="#2A2A2A" strokeWidth="4" strokeLinejoin="round"
    />
    {/* Sole */}
    <path d="M25 128 L198 128 L198 138 Q198 148 188 148 L38 148 Q25 148 25 135 Z"
      fill="#F4EBDC" stroke="#2A2A2A" strokeWidth="4" />
    {/* Laces */}
    <g stroke="#2A2A2A" strokeWidth="3" fill="none" strokeLinecap="round">
      <path d="M92 96 L118 82" />
      <path d="M110 100 L136 86" />
      <path d="M128 106 L154 92" />
    </g>
  </svg>
);

export const RaceCarIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 260 160" className={className} xmlns="http://www.w3.org/2000/svg">
    {/* body */}
    <path
      d="M15 100
         Q15 85 32 82
         L70 78
         Q78 60 100 58
         L140 58
         Q152 58 158 68
         L172 82
         L228 88
         Q248 92 248 108
         L248 116
         Q248 124 240 124
         L215 124
         A22 22 0 1 0 175 124
         L110 124
         A22 22 0 1 0 70 124
         L28 124
         Q15 124 15 112 Z"
      fill="#E60000" stroke="#2A2A2A" strokeWidth="4" strokeLinejoin="round"
    />
    {/* cockpit */}
    <path d="M108 78 Q118 62 138 62 L150 62 Q158 62 158 74 L158 82 Z"
      fill="#2A2A2A" />
    {/* grill */}
    <g stroke="#2A2A2A" strokeWidth="3">
      <line x1="30" y1="94" x2="60" y2="94" />
      <line x1="30" y1="102" x2="60" y2="102" />
      <line x1="30" y1="110" x2="60" y2="110" />
    </g>
    {/* wheels */}
    <circle cx="90" cy="128" r="18" fill="#2A2A2A" />
    <circle cx="90" cy="128" r="8" fill="#F4EBDC" />
    <circle cx="195" cy="128" r="18" fill="#2A2A2A" />
    <circle cx="195" cy="128" r="8" fill="#F4EBDC" />
  </svg>
);

// Small Vodacom-inspired mark (stylised speech / comma dot)
export const VMark = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 60 60" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="30" cy="30" r="28" fill="#fff" stroke="#2A2A2A" strokeWidth="2" />
    <path
      d="M22 18 Q40 18 40 32 Q40 44 26 46 Q34 38 32 30 Q30 24 22 24 Z"
      fill="#E60000"
    />
  </svg>
);

export const DiceIcon = ({ pips, className = "" }: { pips: number; className?: string }) => {
  const dot = (cx: number, cy: number) => (
    <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="6" className="dice-dot" />
  );
  const map: Record<number, [number, number][]> = {
    1: [[50, 50]],
    2: [[28, 28], [72, 72]],
    3: [[26, 26], [50, 50], [74, 74]],
    4: [[28, 28], [72, 28], [28, 72], [72, 72]],
    5: [[26, 26], [74, 26], [50, 50], [26, 74], [74, 74]],
    6: [[28, 24], [72, 24], [28, 50], [72, 50], [28, 76], [72, 76]],
  };
  return (
    <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="92" height="92" rx="18" fill="#F4EBDC" stroke="#1B1210" strokeWidth="4" />
      {(map[pips] ?? map[1]).map(([x, y]) => dot(x, y))}
    </svg>
  );
};
