import { pickMoversFor } from './top-movers-board';
import type { TopMoversData } from './top-movers-board';

const gainers5d: TopMoversData = {
  gainers: [
    { symbol: 'NVDA', name: 'NVIDIA', return_pct: 15.4, current_close: 900 },
    { symbol: 'AAPL', name: 'Apple', return_pct: 6.2, current_close: 185 },
  ],
  losers: [
    { symbol: 'META', name: 'Meta', return_pct: -4.8, current_close: 480 },
  ],
};

const gainers30d: TopMoversData = {
  gainers: [
    { symbol: 'TSLA', name: 'Tesla', return_pct: 30.1, current_close: 250 },
  ],
  losers: [
    { symbol: 'INTC', name: 'Intel', return_pct: -18.3, current_close: 22 },
  ],
};

describe('pickMoversFor', () => {
  it('returns 5d data when period is 5d', () => {
    const result = pickMoversFor({ top_movers_5d: gainers5d, top_movers_30d: gainers30d }, '5d');
    expect(result.gainers).toHaveLength(2);
    expect(result.gainers![0].symbol).toBe('NVDA');
    expect(result.losers![0].return_pct).toBe(-4.8);
  });

  it('returns 30d data when period is 30d', () => {
    const result = pickMoversFor({ top_movers_5d: gainers5d, top_movers_30d: gainers30d }, '30d');
    expect(result.gainers![0].symbol).toBe('TSLA');
    expect(result.losers![0].return_pct).toBe(-18.3);
  });

  it('returns empty arrays when requested period is missing', () => {
    const result = pickMoversFor({ top_movers_5d: gainers5d }, '30d');
    expect(result.gainers).toEqual([]);
    expect(result.losers).toEqual([]);
  });

  it('returns empty arrays when both periods are null/undefined', () => {
    const result = pickMoversFor({}, '5d');
    expect(result.gainers).toEqual([]);
    expect(result.losers).toEqual([]);
  });
});
