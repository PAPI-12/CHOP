import { useCallback, useMemo, useReducer } from 'react';
import {
  CATALOG,
  DELIVERY_FEES_CENTS,
  FREE_DELIVERY_THRESHOLD_CENTS,
  MAX_CART_LINES,
  MAX_QTY_PER_LINE,
  Product,
  VOUCHERS,
} from './data';

export type SlotId = keyof typeof DELIVERY_FEES_CENTS;

export type CartState = {
  lines: Record<string, number>; // productId -> quantity (1..MAX_QTY_PER_LINE)
  voucher: string;
  slot: SlotId;
};

type Action =
  | { type: 'add'; productId: string }
  | { type: 'inc'; productId: string }
  | { type: 'dec'; productId: string }
  | { type: 'remove'; productId: string }
  | { type: 'set-voucher'; value: string }
  | { type: 'set-slot'; slot: SlotId }
  | { type: 'clear' };

function reducer(state: CartState, action: Action): CartState {
  switch (action.type) {
    case 'add': {
      const current = state.lines[action.productId] ?? 0;
      // Guard rails: never over MAX, never over MAX_CART_LINES distinct items
      if (!(action.productId in state.lines) && Object.keys(state.lines).length >= MAX_CART_LINES) {
        return state;
      }
      const next = Math.min(current + 1, MAX_QTY_PER_LINE);
      return { ...state, lines: { ...state.lines, [action.productId]: next } };
    }
    case 'inc': {
      const current = state.lines[action.productId];
      if (current === undefined) return state;
      const next = Math.min(current + 1, MAX_QTY_PER_LINE);
      return { ...state, lines: { ...state.lines, [action.productId]: next } };
    }
    case 'dec': {
      const current = state.lines[action.productId];
      if (current === undefined) return state;
      const next = current - 1;
      if (next <= 0) {
        const { [action.productId]: _removed, ...rest } = state.lines;
        return { ...state, lines: rest };
      }
      return { ...state, lines: { ...state.lines, [action.productId]: next } };
    }
    case 'remove': {
      const { [action.productId]: _removed, ...rest } = state.lines;
      return { ...state, lines: rest };
    }
    case 'set-voucher': {
      // Strip anything that isn't A-Z0-9 or dash, and clamp length
      const safe = action.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 16);
      return { ...state, voucher: safe };
    }
    case 'set-slot':
      return { ...state, slot: action.slot };
    case 'clear':
      return { lines: {}, voucher: '', slot: state.slot };
    default:
      return state;
  }
}

const INITIAL_STATE: CartState = { lines: {}, voucher: '', slot: 'tomorrow' };

export type PricedLine = {
  product: Product;
  quantity: number;
  lineTotalCents: number;
};

export type Totals = {
  subtotalCents: number;
  discountCents: number;
  deliveryCents: number;
  totalCents: number;
  voucherApplied: boolean;
  itemCount: number;
};

export function useCart() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  const lookup = useMemo(() => {
    const map = new Map<string, Product>();
    for (const p of CATALOG) map.set(p.id, p);
    return map;
  }, []);

  const pricedLines: PricedLine[] = useMemo(() => {
    const rows: PricedLine[] = [];
    for (const [id, qty] of Object.entries(state.lines)) {
      const product = lookup.get(id);
      if (!product) continue; // defensively skip unknown ids
      const safeQty = Math.max(1, Math.min(qty, MAX_QTY_PER_LINE));
      rows.push({ product, quantity: safeQty, lineTotalCents: product.priceCents * safeQty });
    }
    return rows;
  }, [state.lines, lookup]);

  const totals: Totals = useMemo(() => {
    const subtotalCents = pricedLines.reduce((sum, l) => sum + l.lineTotalCents, 0);
    const voucherRate = VOUCHERS[state.voucher] ?? 0;
    const discountCents = Math.floor(subtotalCents * voucherRate);
    const afterDiscount = subtotalCents - discountCents;
    const deliveryCents = afterDiscount >= FREE_DELIVERY_THRESHOLD_CENTS ? 0 : DELIVERY_FEES_CENTS[state.slot];
    const totalCents = Math.max(0, afterDiscount + deliveryCents);
    const itemCount = pricedLines.reduce((sum, l) => sum + l.quantity, 0);
    return {
      subtotalCents,
      discountCents,
      deliveryCents,
      totalCents,
      voucherApplied: voucherRate > 0,
      itemCount,
    };
  }, [pricedLines, state.voucher, state.slot]);

  const add = useCallback((productId: string) => dispatch({ type: 'add', productId }), []);
  const inc = useCallback((productId: string) => dispatch({ type: 'inc', productId }), []);
  const dec = useCallback((productId: string) => dispatch({ type: 'dec', productId }), []);
  const remove = useCallback((productId: string) => dispatch({ type: 'remove', productId }), []);
  const setVoucher = useCallback((value: string) => dispatch({ type: 'set-voucher', value }), []);
  const setSlot = useCallback((slot: SlotId) => dispatch({ type: 'set-slot', slot }), []);
  const clear = useCallback(() => dispatch({ type: 'clear' }), []);

  return {
    state,
    pricedLines,
    totals,
    add,
    inc,
    dec,
    remove,
    setVoucher,
    setSlot,
    clear,
    isEmpty: pricedLines.length === 0,
  };
}
