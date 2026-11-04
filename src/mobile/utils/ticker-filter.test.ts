import { filterTickersForDashboard, type VerdictFilter } from './ticker-filter';

const make = (
  symbol: string,
  name: string | null,
  verdict: string | null | undefined,
) => ({
  symbol,
  name,
  signals: verdict !== undefined ? { verdict } : null,
});

const tickers = [
  make('AAPL', 'Apple Inc', 'BUY'),
  make('MSFT', 'Microsoft Corp', 'HOLD'),
  make('NVDA', 'NVIDIA Corp', 'WATCH'),
  make('AMZN', 'Amazon.com', 'AVOID'),
  make('TSLA', 'Tesla Inc', 'SELL'),
  make('META', 'Meta Platforms', null),
  make('GOOG', 'Alphabet Inc', undefined),
];

describe('filterTickersForDashboard', () => {
  it('search by symbol — case-insensitive', () => {
    const result = filterTickersForDashboard(tickers, { search: 'AA', verdict: 'ALL' });
    expect(result.map((t) => t.symbol)).toEqual(['AAPL']);
  });

  it('search by name — matches substring', () => {
    const result = filterTickersForDashboard(tickers, { search: 'corp', verdict: 'ALL' });
    expect(result.map((t) => t.symbol)).toEqual(['MSFT', 'NVDA']);
  });

  it('search is case-insensitive (ASCII)', () => {
    const result = filterTickersForDashboard(tickers, { search: 'apple', verdict: 'ALL' });
    expect(result.map((t) => t.symbol)).toEqual(['AAPL']);
  });

  it('empty search bypasses search check (returns all)', () => {
    const result = filterTickersForDashboard(tickers, { search: '', verdict: 'ALL' });
    expect(result).toHaveLength(tickers.length);
  });

  it('verdict ALL passes everything', () => {
    const result = filterTickersForDashboard(tickers, { search: '', verdict: 'ALL' });
    expect(result).toHaveLength(tickers.length);
  });

  it('verdict BUY filters to only BUY tickers', () => {
    const result = filterTickersForDashboard(tickers, { search: '', verdict: 'BUY' });
    expect(result.map((t) => t.symbol)).toEqual(['AAPL']);
  });

  it('combined filter: search + verdict both apply', () => {
    const items = [
      make('AAPL', 'Apple Inc', 'BUY'),
      make('AMD', 'Advanced Micro Devices', 'BUY'),
      make('AMZN', 'Amazon.com', 'HOLD'),
    ];
    // "A" matches all three, but verdict=BUY keeps only AAPL and AMD
    const result = filterTickersForDashboard(items, { search: 'A', verdict: 'BUY' });
    expect(result.map((t) => t.symbol)).toEqual(['AAPL', 'AMD']);
  });

  it('missing verdict excludes ticker when filter is active', () => {
    // META has verdict=null, GOOG has signals=null → both excluded for BUY
    const result = filterTickersForDashboard(tickers, { search: '', verdict: 'BUY' });
    expect(result.some((t) => t.symbol === 'META')).toBe(false);
    expect(result.some((t) => t.symbol === 'GOOG')).toBe(false);
  });
});
