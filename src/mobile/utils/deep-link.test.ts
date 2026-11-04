import { buildStockDeepLink, parseStockDeepLink } from './deep-link';

describe('buildStockDeepLink', () => {
  it('builds a valid deep link with a scheme', () => {
    expect(buildStockDeepLink('dappgousstocks', 'AAPL')).toBe(
      'dappgousstocks://stock/AAPL',
    );
  });

  it('returns null when scheme is null', () => {
    expect(buildStockDeepLink(null, 'AAPL')).toBeNull();
  });

  it('returns null when scheme is undefined', () => {
    expect(buildStockDeepLink(undefined, 'AAPL')).toBeNull();
  });
});

describe('parseStockDeepLink', () => {
  it('parses a valid stock deep link', () => {
    expect(parseStockDeepLink('dappgousstocks://stock/AAPL')).toEqual({
      symbol: 'AAPL',
    });
  });

  it('returns null for an unrelated URL', () => {
    expect(parseStockDeepLink('https://example.com')).toBeNull();
  });

  it('returns null for a URL without /stock/ segment', () => {
    expect(parseStockDeepLink('dappgousstocks://report/AAPL')).toBeNull();
  });

  it('is case-insensitive on the scheme part', () => {
    expect(parseStockDeepLink('DAPPGOUSSTOCKS://stock/MSFT')).toEqual({
      symbol: 'MSFT',
    });
  });
});
