import { createContext, useContext, useMemo, useState, ReactNode } from 'react';

type Ctx = {
  open: boolean;
  launch: () => void;
  close: () => void;
};

const PrototypeCtx = createContext<Ctx | null>(null);

export function PrototypeProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const value = useMemo<Ctx>(
    () => ({
      open,
      launch: () => setOpen(true),
      close: () => setOpen(false),
    }),
    [open],
  );
  return <PrototypeCtx.Provider value={value}>{children}</PrototypeCtx.Provider>;
}

export function usePrototype(): Ctx {
  const ctx = useContext(PrototypeCtx);
  if (!ctx) throw new Error('usePrototype must be used inside <PrototypeProvider>');
  return ctx;
}
