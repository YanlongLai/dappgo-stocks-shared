import { parsePromoEnds, presentAdFreePrice } from './ad-free-price';

const pkg = (priceString?: string, price?: number) => ({ identifier: 'x', product: { identifier: 'p', priceString, price } });
const NOW = new Date(2026, 10, 9, 12, 0, 0);

describe('presentAdFreePrice', () => {
  test('promotion active: regular exists, differs and is higher', () => {
    expect(presentAdFreePrice({ selling: pkg('$4.99', 4.99), regular: pkg('$9.99', 9.99), now: NOW })).toEqual({
      price: '$4.99', regularPrice: '$9.99', promoActive: true, promoEnds: null,
    });
  });
  test('promo_ends in the future is returned only while the promotion is active', () => {
    const r = presentAdFreePrice({ selling: pkg('$4.99', 4.99), regular: pkg('$9.99', 9.99), metadata: { promo_ends: '2026-12-31' }, now: NOW });
    expect(r.promoEnds).toEqual({ iso: '2026-12-31', month: 12, day: 31 });
    const same = presentAdFreePrice({ selling: pkg('$9.99', 9.99), regular: pkg('$9.99', 9.99), metadata: { promo_ends: '2026-12-31' }, now: NOW });
    expect(same).toEqual({ price: '$9.99', regularPrice: null, promoActive: false, promoEnds: null });
  });
  test('no regular package: selling price only', () => {
    expect(presentAdFreePrice({ selling: pkg('$4.99', 4.99), regular: null })).toEqual({ price: '$4.99', regularPrice: null, promoActive: false, promoEnds: null });
    expect(presentAdFreePrice({ selling: pkg('$4.99', 4.99), regular: undefined })).toMatchObject({ promoActive: false });
  });
  test('identical price strings: no promotion', () => {
    expect(presentAdFreePrice({ selling: pkg('$4.99', 4.99), regular: pkg('$4.99', 4.99) }).promoActive).toBe(false);
  });
  test('regular not numerically higher: no promotion', () => {
    expect(presentAdFreePrice({ selling: pkg('$9.99', 9.99), regular: pkg('$4.99', 4.99) }).promoActive).toBe(false);
    expect(presentAdFreePrice({ selling: pkg('A', 5), regular: pkg('B', 5) }).promoActive).toBe(false);
  });
  test('missing numeric price on either side: no promotion', () => {
    expect(presentAdFreePrice({ selling: pkg('$4.99'), regular: pkg('$9.99', 9.99) }).promoActive).toBe(false);
    expect(presentAdFreePrice({ selling: pkg('$4.99', 4.99), regular: pkg('$9.99') }).promoActive).toBe(false);
    expect(presentAdFreePrice({ selling: pkg('$4.99', Number.NaN), regular: pkg('$9.99', 9.99) }).promoActive).toBe(false);
  });
  test('missing or empty price strings', () => {
    expect(presentAdFreePrice({ selling: null, regular: pkg('$9.99', 9.99) })).toEqual({ price: null, regularPrice: null, promoActive: false, promoEnds: null });
    expect(presentAdFreePrice({ selling: pkg('', 1), regular: pkg('$9.99', 9.99) }).price).toBeNull();
    expect(presentAdFreePrice({ selling: pkg('$4.99', 4.99), regular: pkg('  ', 9.99) }).promoActive).toBe(false);
  });
});

describe('parsePromoEnds', () => {
  test.each([[undefined], [null], [''], ['   '], ['not-a-date'], [20261231], ['2026-02-31'], ['2026-13-01'], ['2026-11-08'], ['2026-11-09T11:59:59']])('ignores %p', raw => {
    expect(parsePromoEnds(raw, NOW)).toBeNull();
  });
  test('date-only is valid through the end of that day', () => {
    expect(parsePromoEnds('2026-11-09', NOW)).toEqual({ iso: '2026-11-09', month: 11, day: 9 });
  });
  test('future date-time is accepted', () => {
    const r = parsePromoEnds('2026-12-01T00:00:00Z', NOW);
    expect(r?.iso).toBe('2026-12-01T00:00:00.000Z');
    expect(r?.month).toBeGreaterThanOrEqual(11);
  });
});
