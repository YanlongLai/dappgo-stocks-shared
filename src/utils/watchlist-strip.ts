/**
 * Picks what the dashboard's watchlist tile shows: the first stocks of the
 * user's watchlist that have a quote, or popular stocks to add when the
 * watchlist is empty.
 */

export interface StripQuote {
  price?: number | null;
  changePercent?: number | null;
  name?: string | null;
}

export interface WatchlistStripItem {
  symbol: string;
  name: string | null;
  price: number;
  changePercent: number | null;
}

export type WatchlistStrip =
  | { kind: 'watchlist'; items: WatchlistStripItem[]; total: number }
  | { kind: 'suggestions'; symbols: string[] }
  | { kind: 'empty' };

function normalize(symbol: string): string {
  return symbol.trim().toUpperCase();
}

/**
 * @param watchlist  Symbols in the user's order.
 * @param quotes     Latest quotes by symbol (any case).
 * @param popular    Popular symbols to suggest when the watchlist is empty.
 * @param limit      How many to show (default 3).
 */
export function pickWatchlistStrip(
  watchlist: readonly string[],
  quotes: Readonly<Record<string, StripQuote | null | undefined>>,
  popular: readonly string[] = [],
  limit = 3,
): WatchlistStrip {
  const byKey = new Map<string, StripQuote>();
  for (const [key, value] of Object.entries(quotes)) {
    if (value) byKey.set(normalize(key), value);
  }
  const seen = new Set<string>();
  const ordered = watchlist.map(normalize).filter((s) => s && !seen.has(s) && seen.add(s));

  if (ordered.length > 0) {
    const items: WatchlistStripItem[] = [];
    for (const symbol of ordered) {
      const quote = byKey.get(symbol);
      const price = quote?.price;
      if (typeof price !== 'number' || !Number.isFinite(price)) continue;
      const change = quote?.changePercent;
      items.push({
        symbol,
        name: quote?.name ?? null,
        price,
        changePercent: typeof change === 'number' && Number.isFinite(change) ? change : null,
      });
      if (items.length >= limit) break;
    }
    return { kind: 'watchlist', items, total: ordered.length };
  }

  const owned = new Set(ordered);
  const symbols: string[] = [];
  for (const raw of popular) {
    const symbol = normalize(raw);
    if (!symbol || owned.has(symbol) || symbols.includes(symbol)) continue;
    symbols.push(symbol);
    if (symbols.length >= limit) break;
  }
  return symbols.length > 0 ? { kind: 'suggestions', symbols } : { kind: 'empty' };
}
