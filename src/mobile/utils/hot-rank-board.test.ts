import { pickHotRankBoard } from './hot-rank-board';
import type { HotRankInput } from './hot-rank-board';

const makeItem = (
  symbol: string,
  score: number | null,
  tier = 'hot',
  pct = 1.5,
): HotRankInput => ({
  symbol,
  name: `${symbol} Corp`,
  hot_rank: score !== null ? { score, tier, drivers: ['volume'] } : null,
  price_change_pct: pct,
  signals: { verdict: 'BUY' },
});

describe('pickHotRankBoard', () => {
  it('returns top 5 sorted by score desc', () => {
    const items = [
      makeItem('AAPL', 75),
      makeItem('MSFT', 90),
      makeItem('NVDA', 62),
      makeItem('TSLA', 85),
      makeItem('META', 70),
      makeItem('GOOG', 95),
    ];
    const result = pickHotRankBoard(items);
    expect(result).toHaveLength(5);
    expect(result.map((r) => r.symbol)).toEqual(['GOOG', 'MSFT', 'TSLA', 'AAPL', 'META']);
  });

  it('all-hot tier: includes all items above threshold', () => {
    const items = [
      makeItem('X', 100, 'hot'),
      makeItem('Y', 80, 'hot'),
      makeItem('Z', 61, 'hot'),
    ];
    const result = pickHotRankBoard(items);
    expect(result).toHaveLength(3);
    expect(result[0].tier).toBe('hot');
  });

  it('all-cold: filters out items with score < 60', () => {
    const items = [
      makeItem('A', 59),
      makeItem('B', 0),
      makeItem('C', null),
      makeItem('D', 40),
    ];
    const result = pickHotRankBoard(items);
    expect(result).toHaveLength(0);
  });

  it('custom limit is respected', () => {
    const items = [
      makeItem('AAPL', 99),
      makeItem('MSFT', 88),
      makeItem('NVDA', 77),
      makeItem('TSLA', 66),
    ];
    const result = pickHotRankBoard(items, 2);
    expect(result).toHaveLength(2);
    expect(result[0].symbol).toBe('AAPL');
    expect(result[1].symbol).toBe('MSFT');
  });

  it('handles missing fields gracefully', () => {
    const items: HotRankInput[] = [
      { symbol: 'BARE', name: 'Bare Co', hot_rank: { score: 70 } },
    ];
    const result = pickHotRankBoard(items);
    expect(result).toHaveLength(1);
    expect(result[0].tier).toBe('warm');
    expect(result[0].drivers).toEqual([]);
    expect(result[0].priceChangePct).toBeNull();
    expect(result[0].verdict).toBeNull();
  });
});
