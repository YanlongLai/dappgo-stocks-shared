import { trendInsights } from './trend-insights';

// QQQ 11-10 … 11-23 closes and volumes from the 11-23 US report.
const qqq = [
  ['11-10', 674.76, 38845158], ['11-11', 690.38, 44871768], ['11-12', 688.17, 37219462], ['11-13', 679.89, 42098628],
  ['11-16', 661.75, 43576955], ['11-17', 656.95, 55693846], ['11-18', 659.51, 45145655], ['11-19', 645.04, 71465406],
  ['11-20', 608.45, 134753507], ['11-23', 651.03, 83338714],
].map(([d, c, v]) => ({ date: `2026-${d}`, close: c as number, volume: v as number }));

describe('trendInsights', () => {
  it('finds change, high, low, range position and the biggest one-day move', () => {
    const r = trendInsights(qqq, 30, 5);
    expect(r.bars).toHaveLength(10);
    expect(r.changePct).toBeCloseTo((651.03 / 674.76 - 1) * 100, 6);
    expect(r.high).toEqual({ value: 690.38, date: '2026-11-11', index: 1 });
    expect(r.low).toEqual({ value: 608.45, date: '2026-11-20', index: 8 });
    expect(r.rangePositionPct).toBe(52);
    expect(r.biggestMove?.date).toBe('2026-11-23');
    expect(r.biggestMove?.pct).toBeCloseTo(7.0, 1);
  });

  it('uses earlier bars for the moving average and the first move', () => {
    const r = trendInsights(qqq, 5, 5);
    expect(r.bars[0].date).toBe('2026-11-17');
    // 5-day average on 11-17 uses 11-11 … 11-17, four of them before the charted window.
    expect(r.ma[0]).toBeCloseTo((690.38 + 688.17 + 679.89 + 661.75 + 656.95) / 5, 6);
    expect(r.ma.every((v) => v !== null)).toBe(true);
    expect(r.biggestMove?.date).toBe('2026-11-23');
  });

  it('marks volume spikes relative to the window median', () => {
    const r = trendInsights(qqq, 30, 20);
    const spike = r.volumeRatio![8]!;
    expect(spike).toBeGreaterThan(2.5);
    expect(r.ma.every((v) => v === null)).toBe(true);
  });

  it('is empty-safe', () => {
    expect(trendInsights([]).changePct).toBeNull();
    expect(trendInsights([{ date: '2026-01-01', close: 1 }]).high).toBeNull();
    const flat = trendInsights([{ date: 'a', close: 5 }, { date: 'b', close: 5 }]);
    expect(flat.rangePositionPct).toBeNull();
    expect(flat.volumeRatio).toBeNull();
  });
});
