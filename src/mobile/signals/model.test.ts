import { filterCounts, matchesQuery, selectSignals, summarizeSignals, type SignalItem } from './model';

const item = (symbol: string, over: Partial<SignalItem> = {}): SignalItem => ({
  symbol, name: `${symbol} Corp`, price: 10, changePct: 0, spark: [], tone: 'neutral', changedFrom: null, valuationZone: null, ...over,
});

const list: SignalItem[] = [
  item('AAPL', { name: 'Apple Inc.', changePct: 2.5, tone: 'mildBullish', changedFrom: 'neutral', valuationZone: 'above' }),
  item('NVDA', { name: 'NVIDIA', changePct: 31.5, favorite: true }),
  item('SHEL', { name: 'Shell plc', changePct: -0.7, tone: 'bearish', valuationZone: 'below' }),
  item('2330', { name: '台積電', changePct: 1.5, tone: 'bullish', tags: ['foreign_buy'] }),
  item('SOXL', { name: 'Direxion Semi 3x', changePct: null, tone: null, score: 64.5, badge: 'CP 64.5' }),
];

describe('summarizeSignals', () => {
  it('counts tones, up/down, today changes and the top mover and score', () => {
    const s = summarizeSignals(list);
    expect(s.total).toBe(5);
    expect(s.counts).toEqual({ bullish: 1, mildBullish: 1, neutral: 1, mildBearish: 0, bearish: 1 });
    expect([s.up, s.down]).toEqual([3, 1]);
    expect(s.changedToday).toBe(1);
    expect(s.topMover).toEqual({ symbol: 'NVDA', changePct: 31.5 });
    expect(s.topScore).toEqual({ symbol: 'SOXL', score: 64.5 });
  });
});

describe('search', () => {
  it('matches symbol prefix and name parts, ignoring case and spaces', () => {
    expect(matchesQuery(list[0], 'aa')).toBe(true);
    expect(matchesQuery(list[0], 'apple inc')).toBe(true);
    expect(matchesQuery(list[3], '台積')).toBe(true);
    expect(matchesQuery(list[0], 'shell')).toBe(false);
    expect(matchesQuery(list[2], 'shell')).toBe(true);
    expect(matchesQuery(list[1], 'vda')).toBe(false);
  });
});

describe('selectSignals', () => {
  it('puts today changes first, then tone, then the larger move', () => {
    expect(selectSignals(list).map((i) => i.symbol)).toEqual(['AAPL', '2330', 'NVDA', 'SHEL', 'SOXL']);
  });
  it('filters by tone, change, favorites, valuation and tags', () => {
    expect(selectSignals(list, { filter: { kind: 'tone', tones: ['bullish', 'mildBullish'] } }).map((i) => i.symbol)).toEqual(['AAPL', '2330']);
    expect(selectSignals(list, { filter: { kind: 'changed' } }).map((i) => i.symbol)).toEqual(['AAPL']);
    expect(selectSignals(list, { filter: { kind: 'favorites' } }).map((i) => i.symbol)).toEqual(['NVDA']);
    expect(selectSignals(list, { filter: { kind: 'belowRange' } }).map((i) => i.symbol)).toEqual(['SHEL']);
    expect(selectSignals(list, { filter: { kind: 'tag', tag: 'foreign_buy' } }).map((i) => i.symbol)).toEqual(['2330']);
  });
  it('sorts by change, move, symbol and score', () => {
    expect(selectSignals(list, { sort: 'change' }).map((i) => i.symbol)).toEqual(['NVDA', 'AAPL', '2330', 'SHEL', 'SOXL']);
    expect(selectSignals(list, { sort: 'move' })[0].symbol).toBe('NVDA');
    expect(selectSignals(list, { sort: 'symbol' })[0].symbol).toBe('2330');
    expect(selectSignals(list, { sort: 'score' })[0].symbol).toBe('SOXL');
  });
  it('combines search with a filter', () => {
    expect(selectSignals(list, { query: 'n', filter: { kind: 'favorites' } }).map((i) => i.symbol)).toEqual(['NVDA']);
  });
});

describe('filterCounts', () => {
  it('counts each chip', () => {
    expect(filterCounts(list, [{ kind: 'all' }, { kind: 'changed' }, { kind: 'tone', tones: ['bearish'] }])).toEqual([5, 1, 1]);
  });
});
