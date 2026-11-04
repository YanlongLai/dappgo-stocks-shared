export type DashboardTopMoverDirection = 'gainer' | 'loser' | 'flat';

export interface DashboardTopMover {
  symbol: string;
  name?: string;
  changePct: number;
  direction: DashboardTopMoverDirection;
}

interface TickerLike {
  symbol?: string;
  name?: string;
  price_change_pct?: number | null;
}

/**
 * Keep the existing largest-absolute-move selection while making its
 * direction explicit for truthful hero copy and iconography.
 */
export function pickDashboardTopMover(
  tickers: Record<string, TickerLike>,
): DashboardTopMover | null {
  let selected: DashboardTopMover | null = null;

  for (const [key, ticker] of Object.entries(tickers)) {
    const changePct = ticker.price_change_pct;
    if (typeof changePct !== 'number' || !Number.isFinite(changePct)) continue;

    if (selected && Math.abs(changePct) <= Math.abs(selected.changePct)) continue;

    selected = {
      symbol: ticker.symbol ?? key,
      name: ticker.name,
      changePct,
      direction:
        changePct > 0 ? 'gainer' : changePct < 0 ? 'loser' : 'flat',
    };
  }

  return selected;
}
