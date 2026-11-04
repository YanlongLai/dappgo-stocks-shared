import { simulateBuyBack } from './buy-back-simulator';
import type { PriceBar } from './buy-back-simulator';

/** Generate n bars with a constant daily growth rate */
function makeBars(n: number, startPrice: number, dailyGrowth = 0): PriceBar[] {
  const bars: PriceBar[] = [];
  for (let i = 0; i < n; i++) {
    bars.push({
      date: `2020-01-${String(i + 1).padStart(2, '0')}`,
      close: startPrice * Math.pow(1 + dailyGrowth, i),
    });
  }
  return bars;
}

describe('simulateBuyBack', () => {
  it('typical 1Y growth — positive total and annualised return', () => {
    const bars = makeBars(300, 100, 0.001);
    const result = simulateBuyBack(bars, 1);
    expect(result).not.toBeNull();
    expect(result!.totalReturnPct).toBeGreaterThan(0);
    expect(result!.annualizedReturnPct).toBeGreaterThan(0);
    expect(result!.hypothetical1000).toBeGreaterThan(1000);
    expect(result!.bestDayPct).toBeGreaterThanOrEqual(result!.worstDayPct);
  });

  it('typical 3Y growth — 3Y total return higher than 1Y', () => {
    const bars = makeBars(800, 50, 0.0005);
    const r1 = simulateBuyBack(bars, 1);
    const r3 = simulateBuyBack(bars, 3);
    expect(r1).not.toBeNull();
    expect(r3).not.toBeNull();
    expect(r3!.totalReturnPct).toBeGreaterThan(r1!.totalReturnPct);
    expect(r3!.hypothetical1000).toBeGreaterThan(r1!.hypothetical1000);
  });

  it('negative return — totalReturnPct < 0, hypothetical1000 < 1000', () => {
    const bars = makeBars(300, 200, -0.0005);
    const result = simulateBuyBack(bars, 1);
    expect(result).not.toBeNull();
    expect(result!.totalReturnPct).toBeLessThan(0);
    expect(result!.hypothetical1000).toBeLessThan(1000);
    expect(result!.annualizedReturnPct).toBeLessThan(0);
  });

  it('insufficient history (< 252 bars) — returns null', () => {
    const bars = makeBars(200, 100);
    expect(simulateBuyBack(bars, 1)).toBeNull();
  });

  it('single-bar history — returns null', () => {
    const bars = makeBars(1, 100);
    expect(simulateBuyBack(bars, 1)).toBeNull();
  });

  it('zero entry price edge case — returns null', () => {
    const bars = makeBars(300, 100);
    bars[47] = { date: bars[47].date, close: 0 };
    expect(simulateBuyBack(bars, 1)).toBeNull();
  });
});
