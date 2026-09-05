import { motion, useInView, animate } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

export function Fade({
  children,
  className = '',
  delay = 0,
  y = 28,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function Counter({
  to, prefix = '', suffix = '', decimals = 0,
}: {
  to: number; prefix?: string; suffix?: string; decimals?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const ctrl = animate(0, to, {
      duration: 1.6,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setVal(v),
    });
    return () => ctrl.stop();
  }, [inView, to]);
  return (
    <span ref={ref} className="tabular-nums">
      {prefix}{val.toFixed(decimals)}{suffix}
    </span>
  );
}

/** Tau Foods logomark */
export function TauLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="19" fill="#1a4d2e" stroke="#2d6a4f" strokeWidth="1.5" />
      {/* Stylised T */}
      <rect x="10" y="12" width="20" height="3" rx="1.5" fill="#74c69d" />
      <rect x="17.5" y="15" width="5" height="13" rx="2" fill="#74c69d" />
    </svg>
  );
}

/** South African flag inline SVG */
export function SAFlag({ className = 'w-6 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 40" className={`${className} rounded-[2px]`}>
      <rect width="60" height="40" fill="#007a4d" />
      <rect width="60" height="13.3" fill="#de3831" />
      <rect y="26.7" width="60" height="13.3" fill="#002395" />
      <polygon points="0,0 26,20 0,40" fill="#ffb612" />
      <polygon points="0,3 22,20 0,37" fill="#000" />
      <polygon points="0,0 24,20 0,40" fill="#fff" />
      <polygon points="0,5 20,20 0,35" fill="#007a4d" />
    </svg>
  );
}

export function Tag({
  children, dark = true,
}: { children: React.ReactNode; dark?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-full
      ${dark ? 'bg-white/8 text-[#74c69d] border border-[#2d6a4f]/60' : 'bg-[#d8f3dc] text-[#1a4d2e]'}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {children}
    </span>
  );
}
