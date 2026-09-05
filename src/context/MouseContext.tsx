import { createContext, useCallback, useContext, useRef, useState, useEffect, ReactNode } from 'react';

type Listener = (x: number, y: number) => void;

interface MouseContextType {
  /** Subscribe to raw pointer position. Returns an unsubscribe function. */
  subscribe: (fn: Listener) => () => void;
  /** Latest pointer position, readable without re-rendering. */
  position: { current: { x: number; y: number } };
  cursorSize: 'normal' | 'large';
  setCursorSize: (size: 'normal' | 'large') => void;
}

const noopPosition = { current: { x: 0, y: 0 } };

const MouseContext = createContext<MouseContextType>({
  subscribe: () => () => {},
  position: noopPosition,
  cursorSize: 'normal',
  setCursorSize: () => {},
});

/**
 * Pointer broadcast.
 *
 * Previously backed by framer-motion MotionValues, which meant the motion
 * runtime was imported by the app shell on every route. This is a plain
 * subscription: consumers read a ref or subscribe to a callback, so pointer
 * movement never triggers a React render anywhere in the tree.
 */
export const MouseProvider = ({ children }: { children: ReactNode }) => {
  const position = useRef({ x: 0, y: 0 });
  const listeners = useRef(new Set<Listener>());
  const [cursorSize, setCursorSize] = useState<'normal' | 'large'>('normal');

  const subscribe = useCallback((fn: Listener) => {
    listeners.current.add(fn);
    return () => { listeners.current.delete(fn); };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia('(pointer: fine)').matches) return;

    const handleMouseMove = (e: MouseEvent) => {
      position.current.x = e.clientX;
      position.current.y = e.clientY;
      listeners.current.forEach((fn) => fn(e.clientX, e.clientY));
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <MouseContext.Provider value={{ subscribe, position, cursorSize, setCursorSize }}>
      {children}
    </MouseContext.Provider>
  );
};

export const useMouse = () => useContext(MouseContext);
