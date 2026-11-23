import { pickWatchlistStrip } from './watchlist-strip';

const quotes = {
  AAPL: { price: 190.5, changePercent: 1.2, name: 'Apple' },
  msft: { price: 410, changePercent: -0.4 },
  NVDA: { price: 120, changePercent: null },
  TSLA: { price: null, changePercent: 2 },
  AMZN: { price: 180, changePercent: 0.1 },
};

describe('pickWatchlistStrip', () => {
  it('keeps watchlist order and skips symbols without a price', () => {
    const strip = pickWatchlistStrip(['TSLA', 'MSFT', 'aapl', 'NVDA', 'AMZN'], quotes);
    expect(strip.kind).toBe('watchlist');
    if (strip.kind !== 'watchlist') return;
    expect(strip.items.map((i) => i.symbol)).toEqual(['MSFT', 'AAPL', 'NVDA']);
    expect(strip.items[2].changePercent).toBeNull();
    expect(strip.total).toBe(5);
  });

  it('returns an empty watchlist strip when no stock has a quote yet', () => {
    const strip = pickWatchlistStrip(['ZZZZ'], quotes, ['AAPL']);
    expect(strip).toEqual({ kind: 'watchlist', items: [], total: 1 });
  });

  it('de-duplicates watchlist symbols', () => {
    const strip = pickWatchlistStrip(['AAPL', 'aapl', ' AAPL '], quotes);
    expect(strip.kind === 'watchlist' && strip.total).toBe(1);
  });

  it('suggests popular stocks when the watchlist is empty', () => {
    expect(pickWatchlistStrip([], quotes, ['nvda', 'NVDA', 'AAPL', 'MSFT', 'AMZN'])).toEqual({
      kind: 'suggestions',
      symbols: ['NVDA', 'AAPL', 'MSFT'],
    });
  });

  it('is empty with no watchlist and no popular list', () => {
    expect(pickWatchlistStrip([], quotes, [])).toEqual({ kind: 'empty' });
  });

  it('honours a custom limit', () => {
    const strip = pickWatchlistStrip(['AAPL', 'MSFT', 'AMZN'], quotes, [], 2);
    expect(strip.kind === 'watchlist' && strip.items.length).toBe(2);
  });
});
