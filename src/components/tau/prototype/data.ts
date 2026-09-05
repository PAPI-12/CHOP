/**
 * Static catalog for the in-browser Tau Foods prototype.
 * Prices are in Rand-cents to avoid float rounding.
 */

export type Product = {
  id: string;
  name: string;
  unit: string;
  priceCents: number;
  category: 'Vegetables' | 'Fruit' | 'Meat' | 'Dairy' | 'Pantry' | 'Combos';
  emoji: string;
  farm: string;
  tags: string[];
};

export const CATALOG: Product[] = [
  { id: 'veg-butternut', name: 'Butternut Squash', unit: 'per kg', priceCents: 1899, category: 'Vegetables', emoji: '🎃', farm: 'ZZ2 Farms · Limpopo', tags: ['Local', 'Seasonal'] },
  { id: 'veg-spinach', name: 'Baby Spinach 200g', unit: 'pack', priceCents: 2499, category: 'Vegetables', emoji: '🥬', farm: 'Riverstone · WC', tags: ['Halaal'] },
  { id: 'veg-onion', name: 'Brown Onions 2kg', unit: 'bag', priceCents: 3499, category: 'Vegetables', emoji: '🧅', farm: 'Ceres Fresh · WC', tags: ['Staple'] },
  { id: 'veg-potato', name: 'Potatoes 5kg', unit: 'bag', priceCents: 6299, category: 'Vegetables', emoji: '🥔', farm: 'Sandveld · WC', tags: ['Staple'] },
  { id: 'fruit-naartjies', name: 'Naartjies', unit: 'per kg', priceCents: 2499, category: 'Fruit', emoji: '🍊', farm: 'Citrusdal · WC', tags: ['Seasonal'] },
  { id: 'fruit-berries', name: 'Mixed Berries 250g', unit: 'pack', priceCents: 5499, category: 'Fruit', emoji: '🍓', farm: 'Berry Melody · GP', tags: ['Premium'] },
  { id: 'meat-boerewors', name: 'Boerewors', unit: 'per kg', priceCents: 8999, category: 'Meat', emoji: '🥩', farm: 'Karoo Butchery · NC', tags: ['Halaal-cert'] },
  { id: 'meat-chicken', name: 'Free-Range Chicken', unit: 'per kg', priceCents: 8999, category: 'Meat', emoji: '🍗', farm: 'Elgin Free Range · WC', tags: ['Halaal-cert'] },
  { id: 'dairy-amasi', name: 'Amasi 500ml', unit: 'bottle', priceCents: 1850, category: 'Dairy', emoji: '🥛', farm: 'Fair Cape · WC', tags: ['Local'] },
  { id: 'dairy-eggs', name: 'Free-Range Eggs 30pk', unit: 'tray', priceCents: 9499, category: 'Dairy', emoji: '🥚', farm: 'Nulaid · KZN', tags: [] },
  { id: 'pantry-maize', name: 'Super Maize Meal 5kg', unit: 'bag', priceCents: 6299, category: 'Pantry', emoji: '🌽', farm: 'Ace Milling · GP', tags: ['Staple'] },
  { id: 'pantry-rooibos', name: 'Rooibos Tea 80 bags', unit: 'pack', priceCents: 4500, category: 'Pantry', emoji: '🍵', farm: 'Cederberg · WC', tags: ['Local'] },
  { id: 'combo-basic', name: 'Basic Combo (10 items)', unit: 'bundle', priceCents: 27494, category: 'Combos', emoji: '🧺', farm: 'Curated by Tau Foods', tags: ['Bundle', 'Value'] },
  { id: 'combo-family', name: 'Family Combo (18 items)', unit: 'bundle', priceCents: 49999, category: 'Combos', emoji: '🎁', farm: 'Curated by Tau Foods', tags: ['Bundle'] },
];

export const CATEGORIES = ['All', 'Combos', 'Vegetables', 'Fruit', 'Meat', 'Dairy', 'Pantry'] as const;
export type Category = typeof CATEGORIES[number];

export const VOUCHERS: Record<string, number> = {
  TAU10: 0.10,
  MZANSI15: 0.15,
};

export const DELIVERY_FEES_CENTS = { today: 4900, tomorrow: 2900, weekend: 0 };
export const FREE_DELIVERY_THRESHOLD_CENTS = 35000;

export const PAYMENT_METHODS = [
  { id: 'snapscan', label: 'SnapScan', icon: '📱' },
  { id: 'ozow', label: 'Ozow Instant EFT', icon: '⚡' },
  { id: 'capitec', label: 'Capitec Pay', icon: '💳' },
  { id: 'eft', label: 'Manual EFT', icon: '🏦' },
  { id: 'cod', label: 'Cash on Delivery', icon: '💵' },
] as const;

export type PaymentMethodId = typeof PAYMENT_METHODS[number]['id'];

export const CITIES = [
  'Johannesburg', 'Soweto', 'Sandton', 'Cape Town', 'Bo-Kaap', 'Khayelitsha',
  'Durban', 'Pretoria', 'Gqeberha', 'Bloemfontein', 'Stellenbosch',
] as const;

export const MAX_QTY_PER_LINE = 20;
export const MAX_CART_LINES = 50;

/** Format cents as `R1 234.56` using SA locale conventions. */
export function formatRand(cents: number): string {
  const value = Math.max(0, cents) / 100;
  return `R${value.toLocaleString('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
