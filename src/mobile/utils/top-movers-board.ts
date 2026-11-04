/**
 * top-movers-board.ts — helpers for the multi-day TopMoversBoard card.
 *
 * Distinct from top-movers.ts which derives DAY change from ticker_data.
 * This module consumes engine-emitted top_movers_5d / top_movers_30d
 * payloads (pre-ranked gainers + losers lists).
 */

export interface MoverEntry {
  symbol: string;
  name: string;
  return_pct: number;
  current_close: number;
  sector?: string;
}

export interface TopMoversData {
  gainers?: MoverEntry[];
  losers?: MoverEntry[];
}

/**
 * Pick the TopMoversData for a given period.
 * Returns `{ gainers: [], losers: [] }` when the requested period is absent.
 */
export function pickMoversFor(
  data: { top_movers_5d?: TopMoversData; top_movers_30d?: TopMoversData },
  period: '5d' | '30d',
): TopMoversData {
  const raw = period === '5d' ? data.top_movers_5d : data.top_movers_30d;
  return {
    gainers: raw?.gainers ?? [],
    losers: raw?.losers ?? [],
  };
}
