import { nextWatchlist } from './watchlist-toggle';

describe('nextWatchlist', () => {
  it('adds a symbol that is not yet in the list', () => {
    const result = nextWatchlist(['AAPL', 'MSFT'], 'NVDA');
    expect(result.action).toBe('added');
    expect(result.next).toEqual(['AAPL', 'MSFT', 'NVDA']);
  });

  it('removes a symbol that is already in the list', () => {
    const result = nextWatchlist(['AAPL', 'MSFT', 'NVDA'], 'MSFT');
    expect(result.action).toBe('removed');
    expect(result.next).toEqual(['AAPL', 'NVDA']);
  });

  it('does not mutate the original array', () => {
    const original = ['AAPL', 'TSLA'];
    nextWatchlist(original, 'TSLA');
    expect(original).toEqual(['AAPL', 'TSLA']);
  });

  it('adds correctly to an empty list', () => {
    const result = nextWatchlist([], 'GOOG');
    expect(result.action).toBe('added');
    expect(result.next).toEqual(['GOOG']);
  });
});
