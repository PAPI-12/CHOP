import React, { useEffect, useRef } from 'react';

type Props = {
  children: React.ReactNode;
  /** Direction the element travels in from. */
  from?: 'up' | 'left' | 'right' | 'scale';
  /** Seconds. */
  delay?: number;
  duration?: number;
  className?: string;
  as?: 'div' | 'article' | 'section' | 'span' | 'li';
};

/**
 * Scroll reveal, done with IntersectionObserver + a CSS transition.
 *
 * This replaces framer-motion's `whileInView` on the landing route. Motion is a
 * ~46kB gzip runtime that had to be parsed and executed before the home page
 * could show anything, purely to fade a handful of blocks in. The observer
 * fires once, flips one class, and the compositor does the rest — so the first
 * route now ships no animation library at all and paints noticeably sooner.
 */
const Reveal: React.FC<Props> = ({
  children,
  from = 'up',
  delay = 0,
  duration = 0.7,
  className = '',
  as: Tag = 'div',
}) => {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.dataset.shown = 'true';
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        el.dataset.shown = 'true';
        io.disconnect();
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      className={`reveal reveal-${from} ${className}`}
      data-shown="false"
      style={{ transitionDelay: `${delay}s`, transitionDuration: `${duration}s` }}
    >
      {children}
    </Tag>
  );
};

export default Reveal;
