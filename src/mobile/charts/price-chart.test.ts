import {
  areaPath, coverageDays, dateTickIndexes, defaultModeForFrame, frameStates, fullMaSeries,
  maAvailable, modeLayers, normalizeBars, periodChangePct, priceDomain, type ChartFrame,
} from './price-chart';

const frames: ChartFrame[] = [
  { key: '1M', label: '1M', bars: 20 },
  { key: '3M', label: '3M', bars: 60 },
  { key: '6M', label: '6M', bars: 125 },
  { key: '1Y', label: '1Y', bars: 250 },
  { key: '3Y', label: '3Y', bars: 750 },
];

function days(n: number, start = '2026-08-26') {
  const t0 = Date.parse(`${start}T00:00:00Z`);
  const out = [];
  for (let i = 0, d = 0; out.length < n; d++) {
    const date = new Date(t0 + d * 86_400_000);
    if (date.getUTCDay() === 0 || date.getUTCDay() === 6) continue;
    out.push({ date: date.toISOString().slice(0, 10), close: 100 + i++, open: 99 + i, high: 102 + i, low: 98 + i, volume: 1000 });
  }
  return out;
}

describe('price chart model', () => {
  it('line mode draws only the line; area keeps the fill; candle has bodies and volume', () => {
    expect(modeLayers('line')).toEqual({ line: true, fill: false, candles: false, volume: false });
    expect(modeLayers('area')).toEqual({ line: true, fill: true, candles: false, volume: false });
    expect(modeLayers('candle')).toEqual({ line: false, fill: false, candles: true, volume: true });
  });

  it('90 calendar days (~62 bars): MA20 drawable, MA60 and MA200 not (a 3-point stub is not a line)', () => {
    const bars = normalizeBars(days(62));
    const ma = fullMaSeries(bars);
    expect(maAvailable(ma.ma20)).toBe(true);
    expect(maAvailable(ma.ma20.slice(62 - 20))).toBe(true);
    expect(maAvailable(ma.ma60)).toBe(false); // 3 values
    expect(maAvailable(ma.ma60.slice(62 - 20))).toBe(false); // same 3 values on 1M
    expect(maAvailable(ma.ma200)).toBe(false);
    const long = normalizeBars(days(300));
    expect(maAvailable(fullMaSeries(long).ma60)).toBe(true);
    expect(maAvailable(fullMaSeries(long).ma200)).toBe(true); // 101 of 300
  });

  it('prefers a provided daily MA series aligned to the bars', () => {
    const bars = normalizeBars(days(30));
    const provided = bars.map((_, i) => (i > 5 ? 50 : null));
    const ma = fullMaSeries(bars, { ma60: provided });
    expect(ma.ma60).toBe(provided);
    expect(maAvailable(ma.ma60)).toBe(true);
    // misaligned series is ignored
    expect(fullMaSeries(bars, { ma60: [1, 2] }).ma60).not.toEqual([1, 2]);
  });

  it('only the first range past the history is selectable; longer ones are unavailable', () => {
    expect(frameStates(frames, 62)).toEqual({ '1M': 'full', '3M': 'full', '6M': 'partial', '1Y': 'unavailable', '3Y': 'unavailable' });
    expect(frameStates(frames, 800)['3Y']).toBe('full');
    expect(frameStates(frames, 1)['1M']).toBe('unavailable');
  });

  it('reports calendar coverage, not bar count', () => {
    const bars = normalizeBars(days(62));
    expect(coverageDays(bars)).toBeGreaterThanOrEqual(86);
    expect(coverageDays(bars)).toBeLessThanOrEqual(90);
    expect(coverageDays([])).toBe(0);
  });

  it('normalises: sorts, de-duplicates by day, fills missing OHLC from close', () => {
    const out = normalizeBars([
      { date: '2026-11-02', close: 11 },
      { date: '2026-11-01', close: 10, volume: null },
      { date: '2026-11-02T00:00:00Z', close: 12 },
      { date: '', close: 1 },
      { date: '2026-11-03', close: Number.NaN },
    ]);
    expect(out.map((b) => [b.time, b.close])).toEqual([['2026-11-01', 10], ['2026-11-02', 12]]);
    expect(out[0]).toMatchObject({ open: 10, high: 10, low: 10, volume: 0 });
  });

  it('defaults, domain, ticks and change', () => {
    expect(defaultModeForFrame('1M')).toBe('line');
    expect(defaultModeForFrame('3M')).toBe('candle');
    expect(defaultModeForFrame('1Y')).toBe('area');
    const bars = normalizeBars(days(10));
    const d = priceDomain(bars, 'candle');
    expect(d.min).toBeLessThan(99);
    expect(d.max).toBeGreaterThan(111);
    expect(dateTickIndexes(10, 4)).toEqual([0, 3, 6, 9]);
    expect(periodChangePct(bars)).toBeCloseTo(9, 5);
    expect(areaPath('M0,0 L1,1', [{ x: 0 }, { x: 1 }], 5)).toBe('M0,0 L1,1 L1,5 L0,5 Z');
  });
});

describe('nice price ticks', () => {
  it('uses 1/2/2.5/5 × 10^n steps inside the domain', () => {
    const { nicePriceTicks, niceStep } = require('./price-chart');
    expect(niceStep(32, 4)).toBe(10);
    expect(niceStep(9.1, 4)).toBe(2.5);
    expect(niceStep(0.37, 4)).toBe(0.1);
    const t = nicePriceTicks(83.1, 117.4, 200, 0, 4).map((x: { price: number }) => x.price);
    expect(t).toEqual([90, 100, 110]);
    for (const v of nicePriceTicks(2010.3, 2441.9, 200, 0, 4).map((x: { price: number }) => x.price)) expect(v % 100).toBe(0);
  });
});
