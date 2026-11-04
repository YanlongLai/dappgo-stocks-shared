import {
  normalizeStockDetailReturnPath,
  resolveStockDetailBackAction,
  stockDetailHref,
} from './stock-navigation';

describe('stock detail navigation', () => {
  it('builds the canonical detail route with its source', () => {
    expect(stockDetailHref('AAPL', '/(tabs)/signals')).toEqual({
      pathname: '/stock/[symbol]',
      params: { symbol: 'AAPL', returnTo: '/(tabs)/signals' },
    });
  });

  it('replaces the detail route with the source after repeated visits', () => {
    const firstBack = resolveStockDetailBackAction('/(tabs)/signals', true);
    const secondBack = resolveStockDetailBackAction('/(tabs)/signals', true);

    expect(firstBack).toEqual({ type: 'replace', href: '/(tabs)/signals' });
    expect(secondBack).toEqual({ type: 'replace', href: '/(tabs)/signals' });
  });

  it('falls back safely for a cold-start detail link', () => {
    expect(resolveStockDetailBackAction(undefined, false)).toEqual({
      type: 'replace',
      href: '/(tabs)/dashboard',
    });
    expect(normalizeStockDetailReturnPath('https://example.com')).toBeNull();
  });
});
