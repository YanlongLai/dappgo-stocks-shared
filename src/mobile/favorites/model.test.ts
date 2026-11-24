import { sinceLastVisit } from './history';
import {
  buildFavoriteViews,
  daysHeld,
  pcHeaviness,
  sortFavorites,
  todayEntries,
  visitSnapshot,
  type FavoriteInput,
} from './model';

const NOW = new Date('2026-11-24T12:00:00Z');
const input = (symbol: string, fields: Partial<FavoriteInput> = {}): FavoriteInput => ({
  symbol, name: `${symbol} Inc`, price: 100, changePct: 0, addedAt: '2026-11-01T09:00:00Z', priceAtAdd: 80,
  tone: 'neutral', zone: 'within', risk: null, pcRatio: null, newsCount: 0, headline: null, ...fields,
});

describe('favorites model', () => {
  it('counts days held and the change since added', () => {
    expect(daysHeld('2026-11-01T23:59:00Z', NOW)).toBe(23);
    expect(daysHeld('2026-11-24T01:00:00Z', NOW)).toBe(0);
    expect(daysHeld(null, NOW)).toBeNull();
    expect(daysHeld('nonsense', NOW)).toBeNull();
    const [view] = buildFavoriteViews([input('AAPL')], [], NOW);
    expect(view.sinceAddedPct).toBeCloseTo(25);
    expect(buildFavoriteViews([input('X', { priceAtAdd: null })], [], NOW)[0].sinceAddedPct).toBeNull();
  });

  it('reads put/call heaviness', () => {
    expect(pcHeaviness(1.5)).toBe('put');
    expect(pcHeaviness(0.5)).toBe('call');
    expect(pcHeaviness(1)).toBeNull();
    expect(pcHeaviness(null)).toBeNull();
  });

  it('puts stocks that changed first, then the biggest moves', () => {
    const items = [input('AAA', { changePct: 1 }), input('BBB', { changePct: 9 }), input('CCC', { changePct: -2, zone: 'below' })];
    const before = visitSnapshot([input('CCC'), input('AAA'), input('BBB')]);
    const events = sinceLastVisit(['AAA', 'BBB', 'CCC'], { at: '2026-11-23T00:00:00Z', snapshot: before }, todayEntries(items));
    const views = buildFavoriteViews(items, events, NOW);
    expect(sortFavorites(views).map((v) => v.symbol)).toEqual(['CCC', 'BBB', 'AAA']);
    expect(views.find((v) => v.symbol === 'CCC')!.events.map((e) => e.kind)).toEqual(['valuation']);
    expect(views.find((v) => v.symbol === 'BBB')!.events.map((e) => e.kind)).toEqual(['bigMove']);
  });

  it('sorts by change since added (unknown last), today and symbol', () => {
    const views = buildFavoriteViews([
      input('B', { priceAtAdd: 50, changePct: -3 }),
      input('A', { priceAtAdd: null, changePct: 1 }),
      input('C', { priceAtAdd: 120, changePct: 5 }),
    ], [], NOW);
    expect(sortFavorites(views, 'sinceAdded').map((v) => v.symbol)).toEqual(['B', 'C', 'A']);
    expect(sortFavorites(views, 'today').map((v) => v.symbol)).toEqual(['C', 'B', 'A']);
    expect(sortFavorites(views, 'symbol').map((v) => v.symbol)).toEqual(['A', 'B', 'C']);
  });

  it('turns a P/C swing into a flag event on the next visit', () => {
    const before = visitSnapshot([input('NVDA', { pcRatio: 0.5 })]);
    const events = sinceLastVisit(['NVDA'], { at: 'x', snapshot: before }, todayEntries([input('NVDA', { pcRatio: 1.4 })]));
    expect(events).toEqual([{ symbol: 'NVDA', kind: 'pcFlag', from: 'call', to: 'put' }]);
  });
});
