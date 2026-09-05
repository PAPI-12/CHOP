import React from 'react';

export const ScribbleX = ({
  className,
  style,
  ...rest
}: { className?: string; style?: React.CSSProperties } & React.SVGProps<SVGSVGElement>) => (
  <svg className={className} style={style} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" {...rest}>
    <line x1="4" y1="4" x2="36" y2="36" stroke="#D7FF4F" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="36" y1="4" x2="4" y2="36" stroke="#D7FF4F" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export const ScribbleUnderline = ({
  className,
  style,
  ...rest
}: { className?: string; style?: React.CSSProperties } & React.SVGProps<SVGSVGElement>) => (
  <svg className={className} style={style} viewBox="0 0 120 14" fill="none" xmlns="http://www.w3.org/2000/svg" {...rest}>
    <path d="M4 10 Q40 4 70 10 Q95 15 116 8" stroke="#D7C4AA" strokeWidth="2.5" strokeLinecap="round" fill="none" />
  </svg>
);

export const ScribbleWave = ({
  className,
  style,
  ...rest
}: { className?: string; style?: React.CSSProperties } & React.SVGProps<SVGSVGElement>) => (
  <svg className={className} style={style} viewBox="0 0 120 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...rest}>
    <path d="M2 14 Q30 2 60 14 T118 10" stroke="#D7C4AA" strokeWidth="2" strokeLinecap="round" fill="none" />
  </svg>
);

/**
 * Ambient floaters.
 *
 * These used to be framer-motion `animate` loops. Fifteen of them run at once
 * in the hero, and each one ticks on the main thread every frame — enough to
 * visibly cost frames during the intro and while scrolling. They are now pure
 * CSS keyframes, which the compositor runs off-thread for free, and they honour
 * prefers-reduced-motion via the stylesheet.
 */
export const FloatingCross = ({
  className,
  size = 28,
  duration = 6,
  delay = 0,
  frozen = false,
}: {
  className?: string;
  size?: number;
  duration?: number;
  delay?: number;
  frozen?: boolean;
}) => (
  <div
    data-hero-physics="deco"
    className={`pointer-events-none select-none ${className || ''}`}
    style={{ width: size, height: size }}
  >
    <div
      className={frozen ? 'w-full h-full' : 'float-cross w-full h-full'}
      style={frozen ? undefined : { animationDuration: `${duration}s`, animationDelay: `${delay}s` }}
    >
      <ScribbleX className="w-full h-full" />
    </div>
  </div>
);

export const FloatingWave = ({
  className,
  width = 120,
  duration = 7,
  delay = 0,
  frozen = false,
}: {
  className?: string;
  width?: number;
  duration?: number;
  delay?: number;
  frozen?: boolean;
}) => (
  <div
    data-hero-physics="deco"
    className={`pointer-events-none select-none ${className || ''}`}
    style={{ width }}
  >
    <div
      className={frozen ? 'w-full' : 'float-wave w-full'}
      style={frozen ? undefined : { animationDuration: `${duration}s`, animationDelay: `${delay}s` }}
    >
      <ScribbleWave className="w-full h-auto" />
    </div>
  </div>
);
