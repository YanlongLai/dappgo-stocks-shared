import type { PurchasesPackage } from './entitlement';

export type AdFreePromoEnds = Readonly<{ iso: string; month: number; day: number }>;
export type AdFreePricePresentation = Readonly<{
  /** Store-localized price of the package being sold. Null until the offering has loaded. */
  price: string | null;
  /** Store-localized regular price; non-null only while a promotion is active. */
  regularPrice: string | null;
  promoActive: boolean;
  /** Promotion end date; non-null only while a promotion is active and the date is valid and not past. */
  promoEnds: AdFreePromoEnds | null;
}>;

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Parses the offering metadata value `promo_ends` (ISO date or date-time).
 * Date-only values stay valid through the end of that day. Missing, unparsable
 * or past values yield null.
 */
export function parsePromoEnds(raw: unknown, now: Date): AdFreePromoEnds | null {
  if (typeof raw !== 'string' || raw.trim() === '') return null;
  const value = raw.trim();
  const dateOnly = DATE_ONLY.exec(value);
  if (dateOnly) {
    const [year, month, day] = [Number(dateOnly[1]), Number(dateOnly[2]), Number(dateOnly[3])];
    const end = new Date(year, month - 1, day, 23, 59, 59, 999);
    if (end.getFullYear() !== year || end.getMonth() !== month - 1 || end.getDate() !== day) return null;
    return end.getTime() < now.getTime() ? null : { iso: value, month, day };
  }
  const time = new Date(value);
  if (Number.isNaN(time.getTime()) || time.getTime() < now.getTime()) return null;
  return { iso: time.toISOString(), month: time.getMonth() + 1, day: time.getDate() };
}

function usablePrice(pkg: PurchasesPackage | null | undefined): { text: string; value: number | null } | null {
  const text = pkg?.product?.priceString;
  if (typeof text !== 'string' || text.trim() === '') return null;
  const value = pkg?.product?.price;
  return { text, value: typeof value === 'number' && Number.isFinite(value) ? value : null };
}

/**
 * Pure price presentation. A promotion is shown only when a regular package
 * exists, its price string differs from the selling price and its numeric
 * price is higher. Anything missing falls back to the selling price alone.
 */
export function presentAdFreePrice(input: {
  selling: PurchasesPackage | null | undefined;
  regular: PurchasesPackage | null | undefined;
  metadata?: Record<string, unknown> | null;
  now?: Date;
}): AdFreePricePresentation {
  const selling = usablePrice(input.selling);
  const regular = usablePrice(input.regular);
  const price = selling?.text ?? null;
  const promoActive = Boolean(selling && regular && selling.value !== null && regular.value !== null
    && regular.text !== selling.text && regular.value > selling.value);
  if (!promoActive) return { price, regularPrice: null, promoActive: false, promoEnds: null };
  return {
    price,
    regularPrice: regular!.text,
    promoActive: true,
    promoEnds: parsePromoEnds(input.metadata?.promo_ends, input.now ?? new Date()),
  };
}
