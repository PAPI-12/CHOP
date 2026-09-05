import React, { useEffect, useRef, useState } from 'react';
import { useMouse } from '../context/MouseContext';

const RING_STIFF = 420;
const RING_DAMP = 32;
const RING_MASS = 0.35;
const DOT_STIFF = 1000;
const DOT_DAMP = 50;
const DOT_MASS = 0.1;

/**
 * Custom cursor.
 *
 * Two framer-motion springs used to run here on every route. It is now a
 * single rAF loop integrating two springs by hand and writing transforms
 * directly, which:
 *   - keeps the motion runtime off the critical path entirely,
 *   - never re-renders React while the pointer moves,
 *   - sleeps when the pointer is idle so it costs nothing at rest,
 *   - and only mounts at all on real fine-pointer devices.
 */
const CustomCursor: React.FC = () => {
  const { subscribe, position, cursorSize } = useMouse();
  const [enabled, setEnabled] = useState(false);
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const hoverRef = useRef(false);
  const wakeRef = useRef<() => void>(() => {});
  const sizeRef = useRef(cursorSize);
  sizeRef.current = cursorSize;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setEnabled(
      window.matchMedia('(pointer: fine)').matches && window.matchMedia('(hover: hover)').matches,
    );
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const ring = ringRef.current;
    const dot = dotRef.current;
    if (!ring || !dot) return;

    let rx = position.current.x;
    let ry = position.current.y;
    let rvx = 0;
    let rvy = 0;
    let dx = rx;
    let dy = ry;
    let dvx = 0;
    let dvy = 0;
    let raf = 0;
    let lastT = 0;
    let idle = 0;
    let size = 24;
    let targetSize = 24;

    const resolveSize = () =>
      hoverRef.current ? 60 : sizeRef.current === 'large' ? 56 : 24;

    const step = (now: number) => {
      const dt = lastT ? Math.min((now - lastT) / 1000, 0.032) : 1 / 60;
      lastT = now;

      const tx = position.current.x;
      const ty = position.current.y;

      rvx += ((-RING_STIFF * (rx - tx) - RING_DAMP * rvx) / RING_MASS) * dt;
      rvy += ((-RING_STIFF * (ry - ty) - RING_DAMP * rvy) / RING_MASS) * dt;
      rx += rvx * dt;
      ry += rvy * dt;

      dvx += ((-DOT_STIFF * (dx - tx) - DOT_DAMP * dvx) / DOT_MASS) * dt;
      dvy += ((-DOT_STIFF * (dy - ty) - DOT_DAMP * dvy) / DOT_MASS) * dt;
      dx += dvx * dt;
      dy += dvy * dt;

      targetSize = resolveSize();
      size += (targetSize - size) * Math.min(1, dt * 14);

      ring.style.transform = `translate3d(${rx - size / 2}px, ${ry - size / 2}px, 0)`;
      ring.style.width = `${size}px`;
      ring.style.height = `${size}px`;
      dot.style.transform = `translate3d(${dx - 3}px, ${dy - 3}px, 0)`;
      dot.style.opacity = sizeRef.current === 'large' ? '0' : '1';

      const settled =
        Math.abs(rx - tx) < 0.1 &&
        Math.abs(ry - ty) < 0.1 &&
        Math.abs(dx - tx) < 0.1 &&
        Math.abs(dy - ty) < 0.1 &&
        Math.abs(size - targetSize) < 0.2;

      idle = settled ? idle + 1 : 0;
      if (idle > 6) {
        raf = 0;
        lastT = 0;
        return;
      }
      raf = requestAnimationFrame(step);
    };

    const wake = () => {
      if (!raf) {
        lastT = 0;
        raf = requestAnimationFrame(step);
      }
    };

    wakeRef.current = wake;
    const unsubscribe = subscribe(wake);

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const next =
        target.tagName === 'A' ||
        target.tagName === 'BUTTON' ||
        !!target.closest('a,button,[role="button"],.cursor-pointer');
      if (next === hoverRef.current) return;
      hoverRef.current = next;
      wake();
    };

    window.addEventListener('mouseover', handleMouseOver, { passive: true });
    wake();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      unsubscribe();
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, [enabled, subscribe, position]);

  // The loop sleeps when idle; a size-mode change must wake it so the ring
  // actually resizes even if the pointer has not moved.
  useEffect(() => {
    if (enabled) wakeRef.current();
  }, [cursorSize, enabled]);

  if (!enabled) return null;

  return (
    <>
      <div
        ref={ringRef}
        className="custom-cursor fixed top-0 left-0 rounded-full border-[3px] border-[#d7ff4f] z-[9999] pointer-events-none hidden md:block"
        style={{ width: 24, height: 24, willChange: 'transform', backfaceVisibility: 'hidden' }}
        aria-hidden
      />
      <div
        ref={dotRef}
        className="custom-cursor fixed top-0 left-0 w-1.5 h-1.5 bg-[#d7c4aa] rounded-full z-[9999] pointer-events-none hidden md:block"
        style={{ willChange: 'transform' }}
        aria-hidden
      />
    </>
  );
};

export default CustomCursor;
