import {
  loadPriceHistory, maxAgeOf, mergePriceHistory, parsePriceHistory, priceHistoryCacheKey, priceHistoryUrl,
  type CachedHistory, type HistoryCache,
} from './price-history';

const FIELDS = ['date', 'open', 'high', 'low', 'close', 'volume', 'ma20', 'ma60', 'ma200'];
function file(over: Record<string, unknown> = {}) {
  return {
    schema_version: 'price-history-v1', market: 'tw', symbol: '2330', as_of: '2026-11-24', bar_count: 3,
    fields: FIELDS,
    moving_averages: { type: 'simple', source: 'close', periods: [20, 60, 200] },
    bars: [
      ['2026-11-20', 10, 11, 9, 10.5, 1000, 10.1, 9.9, 9.5],
      ['2026-11-21', null, null, null, 10.8, null, 10.2, null, 9.6],
      ['2026-11-24', 10.8, 11.2, 10.6, 11, 1200, 10.3, 10.0, 9.7],
    ],
    content_hash: 'x',
    ...over,
  };
}

describe('parsePriceHistory', () => {
  it('reads columns by name, keeps nulls as missing', () => {
    const h = parsePriceHistory(file())!;
    expect(h.bars).toHaveLength(3);
    expect(h.bars[1]).toEqual({ date: '2026-11-21', close: 10.8 });
    expect(h.ma.ma60).toEqual([9.9, null, 10.0]);
    expect(h.ma.ma200[0]).toBe(9.5);
    expect(h.asOf).toBe('2026-11-24');
  });
  it('does not depend on column order', () => {
    const order = ['close', 'date', 'ma200', 'ma20', 'ma60'];
    const h = parsePriceHistory(file({ fields: order, bars: [[5, '2026-01-01', 4, 4.5, 4.8], [6, '2026-01-02', 4.1, 4.6, 4.9]] }))!;
    expect(h.bars.map((b) => [b.date, b.close])).toEqual([['2026-01-01', 5], ['2026-01-02', 6]]);
    expect(h.ma.ma20).toEqual([4.5, 4.6]);
    expect(h.ma.ma200).toEqual([4, 4.1]);
  });
  it('ignores other schemas and unusable files', () => {
    expect(parsePriceHistory(file({ schema_version: 'price-history-v2' }))).toBeNull();
    expect(parsePriceHistory(file({ fields: ['date', 'open'] }))).toBeNull();
    expect(parsePriceHistory(file({ bars: [['2026-01-01', 1, 1, 1, 0, 1, null, null, null]] }))).toBeNull();
    expect(parsePriceHistory(null)).toBeNull();
    expect(parsePriceHistory('x')).toBeNull();
  });
  it('builds the URL from the dashboard ticker key', () => {
    expect(priceHistoryUrl('tw', '2330')).toBe('https://data.dappgo.com/v1/markets/tw/history/2330.json');
    expect(priceHistoryUrl('us', 'BRK.B')).toBe('https://data.dappgo.com/v1/markets/us/history/BRK.B.json');
  });
});

describe('mergePriceHistory', () => {
  const h = parsePriceHistory(file())!;
  it('dashboard wins on shared days, adds newer days, MA only from the file', () => {
    const dash = [
      { date: '2026-11-24', close: 11.1, open: 10.9, high: 11.3, low: 10.7, volume: 5 },
      { date: '2026-11-25', close: 11.4 },
    ];
    const m = mergePriceHistory(h, dash);
    expect(m.bars.map((b) => b.date)).toEqual(['2026-11-20', '2026-11-21', '2026-11-24', '2026-11-25']);
    expect(m.bars[2].close).toBe(11.1);
    expect(m.movingAverages!.ma20).toEqual([10.1, 10.2, 10.3, null]);
    expect(m.movingAverages!.ma200).toHaveLength(4);
  });
  it('without a file returns the dashboard bars and no MA', () => {
    const m = mergePriceHistory(null, [{ date: '2026-11-25', close: 1 }]);
    expect(m.bars).toHaveLength(1);
    expect(m.movingAverages).toBeUndefined();
  });
  it('drops dashboard bars the chart would drop, so MA stays aligned', () => {
    const m = mergePriceHistory(h, [{ date: '', close: 1 }, { date: '2026-11-26', close: Number.NaN }]);
    expect(m.bars).toHaveLength(3);
  });
});

function memCache(initial?: CachedHistory): HistoryCache & { store: Map<string, CachedHistory> } {
  const store = new Map<string, CachedHistory>();
  if (initial) store.set(priceHistoryCacheKey('tw', '2330'), initial);
  return { store, load: async (k) => store.get(k) ?? null, save: async (k, v) => { store.set(k, v); } };
}
function res(status: number, body?: unknown, headers: Record<string, string> = {}) {
  const h = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  return { status, ok: status >= 200 && status < 300, headers: { get: (n: string) => h[n.toLowerCase()] ?? null }, json: async () => body };
}

describe('loadPriceHistory', () => {
  const T0 = 1_000_000_000_000;
  it('fetches, caches with ETag and max-age, then serves from cache while fresh', async () => {
    const cache = memCache();
    const fetchImpl = jest.fn(async () => res(200, file(), { ETag: '"abc"', 'Cache-Control': 'public, max-age=900' }));
    const a = await loadPriceHistory({ market: 'tw', symbol: '2330', fetchImpl, cache, now: () => T0 });
    expect(a?.bars).toHaveLength(3);
    expect(cache.store.get('price-history-v1:tw:2330')).toMatchObject({ etag: '"abc"', maxAgeS: 900, checkedAt: T0 });
    const b = await loadPriceHistory({ market: 'tw', symbol: '2330', fetchImpl, cache, now: () => T0 + 899_000 });
    expect(b?.bars).toHaveLength(3);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
  it('revalidates with If-None-Match after max-age; 304 keeps the cached copy', async () => {
    const cache = memCache({ etag: '"abc"', checkedAt: T0, maxAgeS: 900, body: file() });
    const fetchImpl = jest.fn(async (_u: string, init?: { headers?: Record<string, string> }) => {
      expect(init?.headers?.['If-None-Match']).toBe('"abc"');
      return res(304, undefined, { 'Cache-Control': 'max-age=900' });
    });
    const h = await loadPriceHistory({ market: 'tw', symbol: '2330', fetchImpl, cache, now: () => T0 + 901_000 });
    expect(h?.bars).toHaveLength(3);
    expect(cache.store.get('price-history-v1:tw:2330')!.checkedAt).toBe(T0 + 901_000);
  });
  it('404 → null (dashboard fallback); network error → cached copy or null', async () => {
    expect(await loadPriceHistory({ market: 'tw', symbol: '2330', fetchImpl: async () => res(404), cache: memCache() })).toBeNull();
    const stale = memCache({ etag: '"abc"', checkedAt: T0, maxAgeS: 900, body: file() });
    const boom = async () => { throw new Error('offline'); };
    expect((await loadPriceHistory({ market: 'tw', symbol: '2330', fetchImpl: boom, cache: stale, now: () => T0 + 10_000_000 }))?.bars).toHaveLength(3);
    expect(await loadPriceHistory({ market: 'tw', symbol: '2330', fetchImpl: boom, cache: memCache() })).toBeNull();
    expect(await loadPriceHistory({ market: 'tw', symbol: '2330', fetchImpl: async () => res(500), cache: null })).toBeNull();
  });
  it('ignores a 200 with another schema', async () => {
    const cache = memCache();
    const h = await loadPriceHistory({ market: 'tw', symbol: '2330', fetchImpl: async () => res(200, file({ schema_version: 'v9' })), cache });
    expect(h).toBeNull();
    expect(cache.store.size).toBe(0);
  });
  it('reads max-age from Cache-Control', () => {
    expect(maxAgeOf('public, max-age=900')).toBe(900);
    expect(maxAgeOf(null)).toBe(900);
    expect(maxAgeOf('max-age=60')).toBe(60);
  });
});
