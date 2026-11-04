/**
 * Known upcoming earnings dates for watchlist tickers.
 *
 * Maintained by hand for now — refresh quarterly. The Matrix screen uses
 * this to warn traders about IV-crush risk within 14 days of earnings.
 * TODO: source from yfinance during daily-report and publish to
 * dashboard/data.json so the app stops having to edit code on earnings day.
 */

// Ticker is widened to plain `string` — the universe of analyzed tickers
// is now driven by `data.tickers` (engine), not a compile-time list. The
// old 3-name `TICKERS` const is gone; `KNOWN_EARNINGS` accepts any symbol
// and consumers iterate via `Object.keys(KNOWN_EARNINGS)`.
export type Ticker = string;

export const KNOWN_EARNINGS: Partial<Record<string, string>> = {
  TSLA: '2026-04-22',
  AMZN: '2026-05-01',
  NVDA: '2026-05-28',
};

/** Days until earnings, or null if unknown / already passed. */
export function daysUntilEarnings(ticker: string): number | null {
  const dateStr = KNOWN_EARNINGS[ticker];
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const now = new Date();
  const diff = Math.ceil(
    (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
  return diff > 0 ? diff : null;
}
