/**
 * Pure helpers for filtering the dashboard ticker list by free-text search
 * and by engine verdict.  Lives here (not inline in the screen) so it can
 * be unit-tested without any React/Zustand/theme dependencies.
 */

export type VerdictFilter = 'ALL' | 'BUY' | 'HOLD' | 'WATCH' | 'AVOID' | 'SELL';

export interface TickerFilterInputs {
  search: string;
  verdict: VerdictFilter;
}

/**
 * Filter a ticker array by free-text search and verdict.
 *
 * - search: case-insensitive substring match on `symbol` OR `name`.
 *           Empty / whitespace-only passes all.
 * - verdict: 'ALL' passes everything; otherwise requires an exact match
 *            on `signals.verdict`.  Tickers whose `signals` is null/undefined
 *            or whose `verdict` is null/undefined are excluded when a specific
 *            verdict is requested.
 */
export function filterTickersForDashboard<
  T extends {
    symbol: string;
    name?: string | null;
    signals?: { verdict?: string | null } | null;
  },
>(tickers: T[], filters: TickerFilterInputs): T[] {
  const q = filters.search.trim().toLowerCase();
  const v = filters.verdict;

  return tickers.filter((t) => {
    // Search filter — bypass when query is empty.
    if (q) {
      const matchSymbol = t.symbol.toLowerCase().includes(q);
      const matchName = (t.name ?? '').toLowerCase().includes(q);
      if (!matchSymbol && !matchName) return false;
    }

    // Verdict filter — bypass when 'ALL'.
    if (v !== 'ALL') {
      if (t.signals?.verdict !== v) return false;
    }

    return true;
  });
}
