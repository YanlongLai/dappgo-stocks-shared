/** App adapter reads its settings store and supplies locale on every call. */
import type { Locale } from './locale';

/** Preserve the caller's precision/currency choices while localizing separators. */
export function formatNumber(value: number, options: Intl.NumberFormatOptions | number | undefined, locale: Locale): string {
  // A digit count preserves existing fixed-price/indicator slots without grouping.
  const resolved = typeof options === 'number'
    ? { minimumFractionDigits: options, maximumFractionDigits: options, useGrouping: false }
    : options;
  return new Intl.NumberFormat(locale, resolved).format(value);
}

/** Accept percentage points (12.5 means 12.5%), as in engine data. */
export function formatPercent(value: number, options: Intl.NumberFormatOptions | undefined, locale: Locale): string {
  return formatNumber(value / 100, { style: 'percent', ...options }, locale);
}

export function formatDate(value: Date | string | number, options: Intl.DateTimeFormatOptions | undefined, locale: Locale): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  return new Intl.DateTimeFormat(locale, options).format(date);
}
