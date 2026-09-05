import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ArrowLeft, Search, ShoppingBag, MapPin, Check, Plus, Minus, Trash2, Loader2 } from 'lucide-react';
import {
  CATALOG,
  CATEGORIES,
  Category,
  CITIES,
  formatRand,
  PAYMENT_METHODS,
  PaymentMethodId,
  Product,
} from './data';
import { useCart, SlotId } from './useCart';

/* ─────────── prototype-only palette ─────────── */
const APP_BG = '#f9f9f7';
const APP_INK = '#173f29';
const APP_ACCENT = '#1a4d2e';
const APP_MUTED = '#78907e';
const APP_YELLOW = '#f0d24b';

type Screen = 'onboarding' | 'auth' | 'store' | 'product' | 'cart' | 'checkout' | 'confirmation';

type CheckoutForm = {
  address: string;
  city: string;
  postal: string;
  slot: SlotId;
  payment: PaymentMethodId | '';
};

type Order = {
  reference: string;
  totalCents: number;
  paymentLabel: string;
  slotLabel: string;
  city: string;
  itemCount: number;
  createdAt: Date;
};

/* ─────────── the frame — an iPhone-shaped stage ─────────── */
function DeviceFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto" style={{ width: 'min(393px, 92vw)' }}>
      <div className="relative rounded-[2.6rem] p-[3px] bg-gradient-to-br from-[#c7c9cd] via-[#2a2c2f] to-[#a4a6a9] shadow-[0_28px_80px_rgba(0,0,0,0.55)]">
        <div
          className="relative overflow-hidden rounded-[2.4rem] bg-white"
          style={{ aspectRatio: '393 / 852' }}
        >
          {/* Dynamic island */}
          <div className="absolute left-1/2 -translate-x-1/2 top-2 z-30 w-[100px] h-7 rounded-full bg-black" />
          {children}
        </div>
      </div>
    </div>
  );
}

/* ─────────── shared bits ─────────── */
function StatusBar() {
  return (
    <div className="relative flex items-center justify-between px-6 pt-3 pb-1 text-[12px] font-semibold" style={{ color: APP_INK }}>
      <span>9:41</span>
      <div className="w-24" />
      <div className="flex items-center gap-1 text-[10px]">
        <span>•••</span>
        <span>▲</span>
        <span className="px-1 rounded border border-current">100</span>
      </div>
    </div>
  );
}

function TabBar({ cartCount, onOpenCart }: { cartCount: number; onOpenCart: () => void }) {
  return (
    <div
      className="absolute bottom-0 inset-x-0 flex items-center justify-around py-3 border-t"
      style={{ background: '#ffffff', borderColor: '#e6ece7' }}
    >
      {[
        { icon: '🏠', label: 'Home' },
        { icon: '🔍', label: 'Search' },
      ].map((tab) => (
        <button key={tab.label} className="text-[10px] flex flex-col items-center gap-0.5" style={{ color: APP_MUTED }}>
          <span className="text-lg">{tab.icon}</span>
          {tab.label}
        </button>
      ))}
      <button
        onClick={onOpenCart}
        className="relative flex items-center justify-center w-12 h-12 rounded-full text-white -mt-6 shadow-lg"
        style={{ background: APP_ACCENT }}
        aria-label="Open cart"
      >
        <ShoppingBag className="w-5 h-5" />
        {cartCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
            style={{ background: APP_YELLOW, color: APP_INK }}
          >
            {cartCount}
          </span>
        )}
      </button>
      {[
        { icon: '❤️', label: 'Saved' },
        { icon: '👤', label: 'Profile' },
      ].map((tab) => (
        <button key={tab.label} className="text-[10px] flex flex-col items-center gap-0.5" style={{ color: APP_MUTED }}>
          <span className="text-lg">{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function ScreenHeader({ title, onBack }: { title: string; onBack?: () => void }) {
  return (
    <div className="flex items-center justify-between px-5 pt-3 pb-4">
      {onBack ? (
        <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#eaf2ec' }} aria-label="Back">
          <ArrowLeft className="w-4 h-4" style={{ color: APP_INK }} />
        </button>
      ) : (
        <span className="w-9" />
      )}
      <p className="text-sm font-semibold" style={{ color: APP_INK }}>{title}</p>
      <span className="w-9" />
    </div>
  );
}

/* ─────────── screen: onboarding ─────────── */
function OnboardingScreen({ onNext }: { onNext: () => void }) {
  return (
    <div className="absolute inset-0 flex flex-col" style={{ background: APP_BG }}>
      <StatusBar />
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mb-6" style={{ background: '#fff7d6' }}>
          🦁
        </div>
        <p className="text-2xl font-serif font-bold mb-2" style={{ color: APP_INK }}>Tau Foods</p>
        <div className="w-16 h-0.5 rounded-full mb-6" style={{ background: '#d1a637' }} />
        <p className="text-base font-semibold mb-2" style={{ color: APP_INK }}>Good food belongs to everyone.</p>
        <p className="text-xs" style={{ color: APP_MUTED }}>Fresh, locally sourced and delivered across Mzansi.</p>
      </div>
      <div className="px-6 pb-10 space-y-3">
        <button
          onClick={onNext}
          className="w-full py-3.5 rounded-full text-white text-sm font-bold shadow-sm"
          style={{ background: APP_ACCENT }}
        >
          GET STARTED
        </button>
        <button
          onClick={onNext}
          className="w-full text-xs font-semibold"
          style={{ color: APP_ACCENT }}
        >
          Already have an account? Sign in
        </button>
      </div>
    </div>
  );
}

/* ─────────── screen: auth ─────────── */
function AuthScreen({ onSignedIn }: { onSignedIn: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = () => {
    setError(null);
    // Basic client-side validation — the real backend re-validates.
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.trim().length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }
    setBusy(true);
    // Simulated async round-trip (no real network call)
    setTimeout(() => {
      setBusy(false);
      onSignedIn();
    }, 550);
  };

  return (
    <div className="absolute inset-0 flex flex-col" style={{ background: APP_BG }}>
      <StatusBar />
      <ScreenHeader title="Sign In" />
      <div className="flex-1 px-6 space-y-4">
        <p className="text-xs" style={{ color: APP_MUTED }}>Sign in to sync your cart across devices. (Demo only — any 4-char password works.)</p>

        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: APP_MUTED }}>Email</span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={120}
            className="mt-1 w-full h-11 px-3 rounded-xl text-sm outline-none focus:ring-2"
            style={{ background: '#eef4ef', color: APP_INK }}
            placeholder="you@example.co.za"
          />
        </label>

        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: APP_MUTED }}>Password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            maxLength={72}
            className="mt-1 w-full h-11 px-3 rounded-xl text-sm outline-none focus:ring-2"
            style={{ background: '#eef4ef', color: APP_INK }}
            placeholder="••••••"
          />
        </label>

        {error && (
          <p className="text-[12px] px-3 py-2 rounded-lg" style={{ background: '#fdecec', color: '#b3261e' }}>
            {error}
          </p>
        )}

        <button className="text-[11px] font-semibold" style={{ color: APP_ACCENT }}>Forgot password?</button>
      </div>

      <div className="px-6 pb-10 space-y-3">
        <button
          onClick={submit}
          disabled={busy}
          className="w-full py-3.5 rounded-full text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-70"
          style={{ background: APP_ACCENT }}
        >
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          {busy ? 'Signing in…' : '→ SIGN IN'}
        </button>
        <button
          onClick={onSignedIn}
          className="w-full py-3.5 rounded-full text-xs font-bold"
          style={{ background: 'transparent', color: APP_ACCENT, border: `1.5px solid ${APP_ACCENT}` }}
        >
          CREATE ACCOUNT
        </button>
      </div>
    </div>
  );
}

/* ─────────── screen: store ─────────── */
function StoreScreen({
  category,
  onCategoryChange,
  onSelect,
  onOpenCart,
  cartCount,
}: {
  category: Category;
  onCategoryChange: (c: Category) => void;
  onSelect: (p: Product) => void;
  onOpenCart: () => void;
  cartCount: number;
}) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const safeQuery = query.trim().toLowerCase().slice(0, 40);
    return CATALOG.filter((p) => {
      const catOk = category === 'All' || p.category === category;
      const qOk = !safeQuery || p.name.toLowerCase().includes(safeQuery);
      return catOk && qOk;
    });
  }, [category, query]);

  return (
    <div className="absolute inset-0 flex flex-col" style={{ background: APP_BG }}>
      <StatusBar />
      <div className="px-5 pt-3 pb-2 flex items-center justify-between">
        <div>
          <p className="text-[11px]" style={{ color: APP_MUTED }}>Delivering to</p>
          <p className="text-sm font-bold flex items-center gap-1" style={{ color: APP_INK }}>
            <MapPin className="w-3.5 h-3.5" /> Johannesburg
          </p>
        </div>
        <span className="text-2xl">🦁</span>
      </div>

      <div className="px-5">
        <div className="flex items-center gap-2 px-3 h-10 rounded-full" style={{ background: '#eef4ef' }}>
          <Search className="w-4 h-4" style={{ color: APP_MUTED }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search groceries…"
            maxLength={40}
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: APP_INK }}
          />
        </div>
      </div>

      {/* Category chips */}
      <div className="mt-3 px-5 flex gap-2 overflow-x-auto no-scrollbar" style={{ scrollbarWidth: 'none' }}>
        {CATEGORIES.map((c) => {
          const active = c === category;
          return (
            <button
              key={c}
              onClick={() => onCategoryChange(c)}
              className="shrink-0 px-3.5 h-8 rounded-full text-[11px] font-bold transition-colors"
              style={{
                background: active ? APP_ACCENT : '#eaf2ec',
                color: active ? '#ffffff' : APP_INK,
              }}
            >
              {c}
            </button>
          );
        })}
      </div>

      {/* Combos hero banner */}
      {category === 'All' && (
        <div className="mx-5 mt-4 p-4 rounded-2xl flex items-center gap-3" style={{ background: APP_YELLOW }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-white/70">🧺</div>
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: APP_INK }}>Today’s Deal</p>
            <p className="text-sm font-bold" style={{ color: APP_INK }}>Family Combo from R499.99</p>
          </div>
        </div>
      )}

      {/* Product grid */}
      <div className="flex-1 overflow-y-auto mt-3 px-5 pb-24">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm font-semibold" style={{ color: APP_INK }}>No matches</p>
            <p className="text-xs mt-1" style={{ color: APP_MUTED }}>
              Try a different search or clear the category filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => onSelect(p)}
                className="p-3 rounded-2xl text-left bg-white shadow-sm border border-[#eaf2ec] hover:border-[#c8e0cf] transition-colors"
              >
                <div className="h-20 rounded-xl flex items-center justify-center text-3xl mb-2" style={{ background: '#eaf2ec' }}>
                  {p.emoji}
                </div>
                <p className="text-[11px] font-semibold leading-tight line-clamp-2" style={{ color: APP_INK }}>{p.name}</p>
                <p className="text-[10px]" style={{ color: APP_MUTED }}>{p.unit}</p>
                <p className="text-sm font-bold mt-1" style={{ color: APP_ACCENT }}>{formatRand(p.priceCents)}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      <TabBar cartCount={cartCount} onOpenCart={onOpenCart} />
    </div>
  );
}

/* ─────────── screen: product detail ─────────── */
function ProductScreen({
  product,
  quantity,
  onBack,
  onAdd,
  onInc,
  onDec,
  onOpenCart,
  cartCount,
}: {
  product: Product;
  quantity: number;
  onBack: () => void;
  onAdd: () => void;
  onInc: () => void;
  onDec: () => void;
  onOpenCart: () => void;
  cartCount: number;
}) {
  return (
    <div className="absolute inset-0 flex flex-col" style={{ background: APP_BG }}>
      <StatusBar />
      <ScreenHeader title={product.category} onBack={onBack} />

      <div className="flex-1 overflow-y-auto pb-24">
        <div className="mx-5 h-56 rounded-3xl flex items-center justify-center text-8xl" style={{ background: '#eaf2ec' }}>
          {product.emoji}
        </div>

        <div className="px-5 mt-5">
          <p className="text-lg font-bold" style={{ color: APP_INK }}>{product.name}</p>
          <p className="text-xs mt-1" style={{ color: APP_MUTED }}>{product.farm}</p>

          <div className="flex flex-wrap gap-1.5 mt-3">
            {product.tags.map((t) => (
              <span key={t} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: '#eaf2ec', color: APP_ACCENT }}>
                {t}
              </span>
            ))}
          </div>

          <div className="flex items-end justify-between mt-5">
            <div>
              <p className="text-[10px] uppercase tracking-widest" style={{ color: APP_MUTED }}>Price</p>
              <p className="text-2xl font-bold" style={{ color: APP_INK }}>{formatRand(product.priceCents)}</p>
              <p className="text-[11px]" style={{ color: APP_MUTED }}>{product.unit}</p>
            </div>
            {quantity > 0 && (
              <div className="flex items-center gap-2">
                <button onClick={onDec} className="w-9 h-9 rounded-full flex items-center justify-center bg-[#eaf2ec]" aria-label="Decrease quantity">
                  <Minus className="w-4 h-4" style={{ color: APP_INK }} />
                </button>
                <span className="text-base font-bold w-6 text-center" style={{ color: APP_INK }}>{quantity}</span>
                <button onClick={onInc} className="w-9 h-9 rounded-full flex items-center justify-center text-white" style={{ background: APP_ACCENT }} aria-label="Increase quantity">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="absolute bottom-24 inset-x-0 px-5">
        {quantity === 0 ? (
          <button
            onClick={onAdd}
            className="w-full py-3.5 rounded-full text-white text-sm font-bold"
            style={{ background: APP_ACCENT }}
          >
            + ADD TO CART
          </button>
        ) : (
          <button
            onClick={onOpenCart}
            className="w-full py-3.5 rounded-full text-white text-sm font-bold flex items-center justify-center gap-2"
            style={{ background: APP_ACCENT }}
          >
            REVIEW CART <ShoppingBag className="w-4 h-4" />
          </button>
        )}
      </div>

      <TabBar cartCount={cartCount} onOpenCart={onOpenCart} />
    </div>
  );
}

/* ─────────── screen: cart ─────────── */
function CartScreen({
  cart,
  onBack,
  onCheckout,
  onOpenCart,
  cartCount,
}: {
  cart: ReturnType<typeof useCart>;
  onBack: () => void;
  onCheckout: () => void;
  onOpenCart: () => void;
  cartCount: number;
}) {
  const { pricedLines, totals, inc, dec, remove, setVoucher, state } = cart;

  return (
    <div className="absolute inset-0 flex flex-col" style={{ background: APP_BG }}>
      <StatusBar />
      <ScreenHeader title="My Cart" onBack={onBack} />

      {pricedLines.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <span className="text-5xl mb-3">🛒</span>
          <p className="text-sm font-bold" style={{ color: APP_INK }}>Your cart is empty</p>
          <p className="text-xs mt-1" style={{ color: APP_MUTED }}>
            Browse the store to add fresh, locally sourced groceries.
          </p>
          <button onClick={onBack} className="mt-6 px-5 py-2.5 rounded-full text-white text-xs font-bold" style={{ background: APP_ACCENT }}>
            Back to store
          </button>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-5 pb-3">
            <div className="space-y-2.5">
              {pricedLines.map(({ product, quantity, lineTotalCents }) => (
                <div key={product.id} className="p-3 rounded-2xl bg-white border border-[#eaf2ec] flex items-center gap-3">
                  <div className="w-11 h-11 rounded-lg flex items-center justify-center text-xl" style={{ background: '#eaf2ec' }}>
                    {product.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold truncate" style={{ color: APP_INK }}>{product.name}</p>
                    <p className="text-[10px]" style={{ color: APP_MUTED }}>{formatRand(product.priceCents)} · {product.unit}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <button onClick={() => dec(product.id)} className="w-6 h-6 rounded-md bg-[#eaf2ec] flex items-center justify-center" aria-label="Decrease">
                        <Minus className="w-3 h-3" style={{ color: APP_INK }} />
                      </button>
                      <span className="text-[11px] font-bold w-4 text-center" style={{ color: APP_INK }}>{quantity}</span>
                      <button onClick={() => inc(product.id)} className="w-6 h-6 rounded-md flex items-center justify-center text-white" style={{ background: APP_ACCENT }} aria-label="Increase">
                        <Plus className="w-3 h-3" />
                      </button>
                      <button onClick={() => remove(product.id)} className="ml-auto text-[10px] flex items-center gap-1" style={{ color: '#b3261e' }} aria-label="Remove">
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    </div>
                  </div>
                  <p className="text-[12px] font-bold" style={{ color: APP_INK }}>{formatRand(lineTotalCents)}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 rounded-2xl bg-white border border-[#eaf2ec]">
              <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: APP_MUTED }}>Voucher</p>
              <div className="flex gap-2 mt-1.5">
                <input
                  value={state.voucher}
                  onChange={(e) => setVoucher(e.target.value)}
                  placeholder="e.g. TAU10"
                  maxLength={16}
                  className="flex-1 h-9 px-3 rounded-lg text-sm outline-none uppercase tracking-wider"
                  style={{ background: '#f3f8f4', color: APP_INK }}
                />
                {totals.voucherApplied && (
                  <span className="px-3 rounded-lg text-[11px] font-bold flex items-center gap-1" style={{ background: '#d9efe0', color: APP_ACCENT }}>
                    <Check className="w-3 h-3" /> Applied
                  </span>
                )}
              </div>
              <p className="text-[10px] mt-1" style={{ color: APP_MUTED }}>
                Try <span className="font-bold">TAU10</span> or <span className="font-bold">MZANSI15</span>.
              </p>
            </div>

            <div className="mt-3 p-3 rounded-2xl bg-white border border-[#eaf2ec] space-y-1.5 text-[12px]">
              <div className="flex justify-between" style={{ color: APP_MUTED }}>
                <span>Subtotal ({totals.itemCount} items)</span>
                <span style={{ color: APP_INK }}>{formatRand(totals.subtotalCents)}</span>
              </div>
              {totals.voucherApplied && (
                <div className="flex justify-between" style={{ color: APP_ACCENT }}>
                  <span>Voucher discount</span>
                  <span>-{formatRand(totals.discountCents)}</span>
                </div>
              )}
              <div className="flex justify-between" style={{ color: APP_MUTED }}>
                <span>Delivery ({state.slot})</span>
                <span style={{ color: totals.deliveryCents === 0 ? APP_ACCENT : APP_INK }}>
                  {totals.deliveryCents === 0 ? 'Free' : formatRand(totals.deliveryCents)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#eaf2ec]" style={{ color: APP_INK }}>
                <span className="font-bold">Total</span>
                <span className="font-bold">{formatRand(totals.totalCents)}</span>
              </div>
            </div>
          </div>

          <div className="px-5 pb-24 pt-3">
            <button
              onClick={onCheckout}
              className="w-full py-3.5 rounded-full text-white text-sm font-bold"
              style={{ background: APP_ACCENT }}
            >
              CHECKOUT · {formatRand(totals.totalCents)}
            </button>
          </div>
        </>
      )}

      <TabBar cartCount={cartCount} onOpenCart={onOpenCart} />
    </div>
  );
}

/* ─────────── screen: checkout ─────────── */
function CheckoutScreen({
  form,
  setForm,
  totalCents,
  onBack,
  onPlace,
  isPlacing,
  errors,
}: {
  form: CheckoutForm;
  setForm: (updater: (f: CheckoutForm) => CheckoutForm) => void;
  totalCents: number;
  onBack: () => void;
  onPlace: () => void;
  isPlacing: boolean;
  errors: Partial<Record<keyof CheckoutForm, string>>;
}) {
  return (
    <div className="absolute inset-0 flex flex-col" style={{ background: APP_BG }}>
      <StatusBar />
      <ScreenHeader title="Checkout" onBack={onBack} />

      <div className="flex-1 overflow-y-auto px-5 pb-32 space-y-4">
        <section className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: APP_MUTED }}>Delivery address</p>
          <input
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value.slice(0, 120) }))}
            placeholder="Street address"
            className="w-full h-11 px-3 rounded-xl text-sm outline-none"
            style={{ background: '#eef4ef', color: APP_INK }}
          />
          {errors.address && <p className="text-[10px]" style={{ color: '#b3261e' }}>{errors.address}</p>}

          <div className="grid grid-cols-2 gap-2">
            <select
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              className="h-11 px-3 rounded-xl text-sm outline-none"
              style={{ background: '#eef4ef', color: APP_INK }}
            >
              <option value="">City…</option>
              {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input
              value={form.postal}
              onChange={(e) => setForm((f) => ({ ...f, postal: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
              placeholder="Postal (4 digits)"
              inputMode="numeric"
              className="h-11 px-3 rounded-xl text-sm outline-none"
              style={{ background: '#eef4ef', color: APP_INK }}
            />
          </div>
          {errors.city && <p className="text-[10px]" style={{ color: '#b3261e' }}>{errors.city}</p>}
          {errors.postal && <p className="text-[10px]" style={{ color: '#b3261e' }}>{errors.postal}</p>}
        </section>

        <section className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: APP_MUTED }}>Delivery slot</p>
          <div className="grid grid-cols-3 gap-2">
            {([
              { id: 'today', label: 'Today', hint: 'R49' },
              { id: 'tomorrow', label: 'Tomorrow', hint: 'R29' },
              { id: 'weekend', label: 'Weekend', hint: 'Free' },
            ] as { id: SlotId; label: string; hint: string }[]).map((slot) => {
              const active = form.slot === slot.id;
              return (
                <button
                  key={slot.id}
                  onClick={() => setForm((f) => ({ ...f, slot: slot.id }))}
                  className="py-3 rounded-xl text-center text-[11px] font-bold"
                  style={{
                    background: active ? APP_ACCENT : '#eef4ef',
                    color: active ? '#ffffff' : APP_INK,
                  }}
                >
                  {slot.label}
                  <div className="text-[9px] font-normal opacity-80">{slot.hint}</div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: APP_MUTED }}>Payment method</p>
          <div className="space-y-1.5">
            {PAYMENT_METHODS.map((m) => {
              const active = form.payment === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setForm((f) => ({ ...f, payment: m.id }))}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border transition-colors"
                  style={{
                    background: active ? '#eaf2ec' : '#ffffff',
                    borderColor: active ? APP_ACCENT : '#eaf2ec',
                    color: APP_INK,
                  }}
                >
                  <span className="text-xl">{m.icon}</span>
                  <span className="text-sm font-semibold flex-1 text-left">{m.label}</span>
                  {active && <Check className="w-4 h-4" style={{ color: APP_ACCENT }} />}
                </button>
              );
            })}
          </div>
          {errors.payment && <p className="text-[10px]" style={{ color: '#b3261e' }}>{errors.payment}</p>}
        </section>
      </div>

      <div className="absolute bottom-0 inset-x-0 p-5 border-t" style={{ background: '#ffffff', borderColor: '#eaf2ec' }}>
        <div className="flex justify-between mb-3 text-sm">
          <span style={{ color: APP_MUTED }}>Total to pay</span>
          <span className="font-bold" style={{ color: APP_INK }}>{formatRand(totalCents)}</span>
        </div>
        <button
          onClick={onPlace}
          disabled={isPlacing}
          className="w-full py-3.5 rounded-full text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-70"
          style={{ background: APP_ACCENT }}
        >
          {isPlacing && <Loader2 className="w-4 h-4 animate-spin" />}
          {isPlacing ? 'Placing order…' : 'PLACE ORDER'}
        </button>
      </div>
    </div>
  );
}

/* ─────────── screen: confirmation ─────────── */
function ConfirmationScreen({ order, onDone }: { order: Order; onDone: () => void }) {
  return (
    <div className="absolute inset-0 flex flex-col" style={{ background: APP_BG }}>
      <StatusBar />
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6" style={{ background: '#d9efe0' }}>
          <Check className="w-10 h-10" style={{ color: APP_ACCENT }} strokeWidth={3} />
        </div>
        <p className="text-lg font-bold" style={{ color: APP_INK }}>Order placed.</p>
        <p className="text-sm mt-1" style={{ color: APP_INK }}>Your order number is</p>
        <p className="text-2xl font-bold mt-2" style={{ color: APP_ACCENT }}>#{order.reference}</p>

        <div className="mt-6 w-full p-4 rounded-2xl bg-white border border-[#eaf2ec] text-left space-y-2">
          <div className="flex justify-between text-xs">
            <span style={{ color: APP_MUTED }}>Items</span>
            <span style={{ color: APP_INK }}>{order.itemCount}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span style={{ color: APP_MUTED }}>Delivery</span>
            <span style={{ color: APP_INK }}>{order.slotLabel} · {order.city}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span style={{ color: APP_MUTED }}>Payment</span>
            <span style={{ color: APP_INK }}>{order.paymentLabel}</span>
          </div>
          <div className="flex justify-between text-sm pt-2 border-t border-[#eaf2ec]">
            <span className="font-bold" style={{ color: APP_INK }}>Total paid</span>
            <span className="font-bold" style={{ color: APP_ACCENT }}>{formatRand(order.totalCents)}</span>
          </div>
        </div>
      </div>
      <div className="px-6 pb-10">
        <button
          onClick={onDone}
          className="w-full py-3.5 rounded-full text-white text-sm font-bold"
          style={{ background: APP_ACCENT }}
        >
          BACK TO STORE
        </button>
      </div>
    </div>
  );
}

/* ─────────── the modal shell + orchestrator ─────────── */
export default function Prototype({ open, onClose }: { open: boolean; onClose: () => void }) {
  const cart = useCart();
  const [screen, setScreen] = useState<Screen>('onboarding');
  const [category, setCategory] = useState<Category>('All');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<CheckoutForm>({ address: '', city: '', postal: '', slot: 'tomorrow', payment: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutForm, string>>>({});
  const [isPlacing, setIsPlacing] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Reset every time the modal opens.
  useEffect(() => {
    if (open) {
      setScreen('onboarding');
      setCategory('All');
      setSelectedProduct(null);
      setForm({ address: '', city: '', postal: '', slot: 'tomorrow', payment: '' });
      setErrors({});
      setOrder(null);
      cart.clear();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Escape to close + focus management + body scroll lock
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = originalOverflow;
    };
  }, [open, onClose]);

  // Sync the checkout slot with the cart totals slot
  useEffect(() => {
    cart.setSlot(form.slot);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.slot]);

  const handleSelect = useCallback((p: Product) => {
    setSelectedProduct(p);
    setScreen('product');
  }, []);

  const validateCheckout = useCallback(() => {
    const next: Partial<Record<keyof CheckoutForm, string>> = {};
    if (form.address.trim().length < 3) next.address = 'Please enter a delivery address.';
    if (/<[^>]+>/.test(form.address)) next.address = 'HTML tags are not allowed.';
    if (!form.city) next.city = 'Please choose your city.';
    if (!/^\d{4}$/.test(form.postal)) next.postal = 'Postal code must be 4 digits.';
    if (!form.payment) next.payment = 'Please choose a payment method.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [form]);

  const placeOrder = useCallback(() => {
    if (cart.isEmpty) return;
    if (!validateCheckout()) return;
    setIsPlacing(true);
    // Simulated async request. In production this hits POST /api/orders.
    setTimeout(() => {
      const method = PAYMENT_METHODS.find((m) => m.id === form.payment);
      const paymentLabel = method?.label ?? 'Unknown';
      const slotLabel = form.slot === 'today' ? 'Today' : form.slot === 'tomorrow' ? 'Tomorrow' : 'Weekend';
      const reference = generateReference();
      setOrder({
        reference,
        totalCents: cart.totals.totalCents,
        paymentLabel,
        slotLabel,
        city: form.city,
        itemCount: cart.totals.itemCount,
        createdAt: new Date(),
      });
      setIsPlacing(false);
      setScreen('confirmation');
      cart.clear();
    }, 800);
  }, [cart, form, validateCheckout]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <button
          aria-label="Close prototype"
          onClick={onClose}
          className="absolute inset-0 bg-[#020604]/85 backdrop-blur-md cursor-default"
        />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between px-4 sm:px-8 py-3 border-b border-[#243d2c] bg-[#0a0a0a]/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#1a4d2e] border border-[#2d6a4f] flex items-center justify-center">
              <span className="text-[#74c69d] font-bold text-sm">τ</span>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[#74c69d] font-bold">Live Case Study</p>
              <p className="text-sm text-white font-semibold">Tau Foods Interactive Prototype</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-[10px] text-white/40">
              <kbd className="px-2 py-1 rounded bg-white/10 border border-white/20 font-mono">Esc</kbd>
              to close
            </div>
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Close prototype"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stage */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-6 overflow-y-auto">
          <DeviceFrame>
            <AnimatePresence mode="wait">
              <motion.div
                key={screen}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0"
              >
                {screen === 'onboarding' && <OnboardingScreen onNext={() => setScreen('auth')} />}
                {screen === 'auth' && <AuthScreen onSignedIn={() => setScreen('store')} />}
                {screen === 'store' && (
                  <StoreScreen
                    category={category}
                    onCategoryChange={setCategory}
                    onSelect={handleSelect}
                    onOpenCart={() => setScreen('cart')}
                    cartCount={cart.totals.itemCount}
                  />
                )}
                {screen === 'product' && selectedProduct && (
                  <ProductScreen
                    product={selectedProduct}
                    quantity={cart.state.lines[selectedProduct.id] ?? 0}
                    onBack={() => setScreen('store')}
                    onAdd={() => cart.add(selectedProduct.id)}
                    onInc={() => cart.inc(selectedProduct.id)}
                    onDec={() => cart.dec(selectedProduct.id)}
                    onOpenCart={() => setScreen('cart')}
                    cartCount={cart.totals.itemCount}
                  />
                )}
                {screen === 'cart' && (
                  <CartScreen
                    cart={cart}
                    onBack={() => setScreen('store')}
                    onCheckout={() => setScreen('checkout')}
                    onOpenCart={() => setScreen('cart')}
                    cartCount={cart.totals.itemCount}
                  />
                )}
                {screen === 'checkout' && (
                  <CheckoutScreen
                    form={form}
                    setForm={setForm}
                    totalCents={cart.totals.totalCents}
                    onBack={() => setScreen('cart')}
                    onPlace={placeOrder}
                    isPlacing={isPlacing}
                    errors={errors}
                  />
                )}
                {screen === 'confirmation' && order && (
                  <ConfirmationScreen order={order} onDone={() => setScreen('store')} />
                )}
              </motion.div>
            </AnimatePresence>
          </DeviceFrame>
        </div>

        {/* Footer hints */}
        <div className="relative z-10 px-4 sm:px-8 py-3 border-t border-[#243d2c] bg-[#0a0a0a]/80 flex flex-wrap items-center justify-between gap-3 text-[11px] text-white/40">
          <div className="flex items-center gap-3">
            <span>Try voucher <span className="text-[#74c69d] font-bold">TAU10</span> or <span className="text-[#74c69d] font-bold">MZANSI15</span></span>
          </div>
          <div className="flex items-center gap-3">
            <span>Screen · <span className="text-white/70">{screen}</span></span>
            {cart.totals.itemCount > 0 && <span>Cart · <span className="text-white/70">{formatRand(cart.totals.totalCents)}</span></span>}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function generateReference(): string {
  const hex = Math.floor(Math.random() * 0xffffff).toString(16).toUpperCase().padStart(6, '0');
  return hex.slice(0, 5);
}
