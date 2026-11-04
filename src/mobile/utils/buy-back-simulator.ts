export interface PriceBar {
  date: string;
  close: number;
  [k: string]: any;
}

export interface BuyBackResult {
  entryDate: string;
  entryPrice: number;
  latestDate: string;
  latestPrice: number;
  totalReturnPct: number;
  annualizedReturnPct: number;
  dailyReturnAvg: number;
  bestDayPct: number;
  worstDayPct: number;
  hypothetical1000: number;
}

const TRADING_DAYS_PER_YEAR = 252;

/**
 * Simulate a buy-and-hold position entered ~yearsBack years ago.
 * Uses trading-day count (252/yr) to find the entry bar.
 * Returns null when history is insufficient.
 */
export function simulateBuyBack(
  history: PriceBar[],
  yearsBack: number,
): BuyBackResult | null {
  if (!history || history.length < TRADING_DAYS_PER_YEAR) return null;

  const targetDaysBack = Math.round(yearsBack * TRADING_DAYS_PER_YEAR);
  if (history.length <= targetDaysBack) return null;

  const entryIdx = history.length - 1 - targetDaysBack;
  const entry = history[entryIdx];
  const latest = history[history.length - 1];

  if (!entry || !latest) return null;
  if (entry.close === 0) return null;

  const totalReturnPct = ((latest.close - entry.close) / entry.close) * 100;
  const ratio = latest.close / entry.close;
  const annualizedReturnPct = (Math.pow(ratio, 1 / yearsBack) - 1) * 100;

  // Daily returns for the slice from entry to latest
  const slice = history.slice(entryIdx);
  let sumDailyReturn = 0;
  let bestDayPct = -Infinity;
  let worstDayPct = Infinity;
  let count = 0;

  for (let i = 1; i < slice.length; i++) {
    const prev = slice[i - 1].close;
    if (prev === 0) continue;
    const dayRet = ((slice[i].close - prev) / prev) * 100;
    sumDailyReturn += dayRet;
    if (dayRet > bestDayPct) bestDayPct = dayRet;
    if (dayRet < worstDayPct) worstDayPct = dayRet;
    count++;
  }

  const dailyReturnAvg = count > 0 ? sumDailyReturn / count : 0;
  if (!isFinite(bestDayPct)) bestDayPct = 0;
  if (!isFinite(worstDayPct)) worstDayPct = 0;

  const hypothetical1000 = 1000 * ratio;

  return {
    entryDate: entry.date,
    entryPrice: entry.close,
    latestDate: latest.date,
    latestPrice: latest.close,
    totalReturnPct,
    annualizedReturnPct,
    dailyReturnAvg,
    bestDayPct,
    worstDayPct,
    hypothetical1000,
  };
}
