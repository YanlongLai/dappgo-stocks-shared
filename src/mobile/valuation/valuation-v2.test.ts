import indexFixture from '../__fixtures__/valuation-v2/index.json';
import detailFixture from '../__fixtures__/valuation-v2/NFLX.json';
import {
  detectValuationAlerts, findBannedValuationTerm, isBelowRange, parseValuationDetail, parseValuationIndex, rankValuations,
  zoneCounts, type ValuationIndex, type ValuationTracking,
} from './valuation-v2';

const index = parseValuationIndex(indexFixture)!;

test('parses the engine index and keeps stocks without a range as such', () => {
  expect(index.asOfDate).toBe('2026-11-19');
  expect(index.modelVersion).toBe('dappgo_composite_v2');
  expect(index.entries).toHaveLength(10);
  const bySymbol = Object.fromEntries(index.entries.map(entry => [entry.symbol, entry]));
  expect(bySymbol.SPY).toMatchObject({ status: 'not_applicable', range: null, zone: null, score: null });
  expect(bySymbol.V).toMatchObject({ status: 'insufficient_data', range: null, zone: null });
  expect(bySymbol.NFLX.status).toBe('ok');
  expect(bySymbol.NFLX.range!.low).toBeLessThan(bySymbol.NFLX.range!.high);
  expect(bySymbol.NFLX.conditions.map(item => item.id)).toEqual(['below_range', 'growing', 'trend_intact', 'data_confidence']);
});

test('rejects documents that are not an index and drops malformed entries', () => {
  for (const raw of [null, [], 'x', {}, { symbols: [] }]) expect(parseValuationIndex(raw)).toBeNull();
  const parsed = parseValuationIndex({
    symbols: {
      'bad symbol': { status: 'ok' },
      NOPE: 'text',
      // "ok" without a usable range must not be ranked.
      HALF: { status: 'ok', zone: 'below', current_price: 10, range: { low: 5, base: 4, high: 9 }, score: 90, gap_pct: -50 },
      NANS: { status: 'ok', zone: 'sideways', current_price: 10, range: { low: 1, base: 2, high: 3 } },
    },
  })!;
  expect(parsed.entries.map(entry => [entry.symbol, entry.status, entry.score])).toEqual([
    ['HALF', 'insufficient_data', null], ['NANS', 'insufficient_data', null],
  ]);
  expect(rankValuations(parsed)).toEqual([]);
});

test('ranks by research score and filters by sector, zone and tracked symbols', () => {
  const ranked = rankValuations(index);
  expect(ranked.every(entry => entry.status === 'ok')).toBe(true);
  expect(ranked.map(entry => entry.score)).toEqual([...ranked.map(entry => entry.score)].sort((a, b) => b! - a!));
  expect(ranked.map(entry => entry.symbol)).not.toContain('SPY');
  expect(rankValuations(index, { sector: 'Technology' }).map(entry => entry.sector)).toEqual(expect.arrayContaining(['Technology']));
  expect(rankValuations(index, { sector: 'Technology' }).every(entry => entry.sector === 'Technology')).toBe(true);
  expect(rankValuations(index, { zones: ['deep_below', 'below'] }).every(entry => isBelowRange(entry.zone))).toBe(true);
  expect(rankValuations(index, { symbols: ['KO', 'AAPL', 'SPY'] }).map(entry => entry.symbol).sort()).toEqual(['AAPL', 'KO']);
  const byGap = rankValuations(index, { sort: 'gap' }).map(entry => entry.gap_pct!);
  expect(byGap).toEqual([...byGap].sort((a, b) => a - b));
  const recent = rankValuations(index, { sort: 'recent' }).map(entry => entry.zone_since!);
  expect(recent).toEqual([...recent].sort().reverse());
});

test('counts zones only for stocks with a range', () => {
  const counts = zoneCounts(index);
  expect(Object.values(counts).reduce((sum, count) => sum + count, 0)).toBe(8);
});

test('parses a detail file with history, anchors, multiples and earnings', () => {
  const detail = parseValuationDetail(detailFixture)!;
  expect(detail.symbol).toBe('NFLX');
  expect(detail.range_history).toHaveLength(60);
  expect(detail.range_history.at(-1)!.date).toBe('2026-11-16');
  expect(detail.anchors.reduce((sum, anchor) => sum + anchor.weight, 0)).toBeCloseTo(1, 2);
  expect(detail.multiples.current.pe).toBeGreaterThan(0);
  expect(detail.multiples.peers.length).toBeGreaterThan(0);
  expect(detail.earnings_timeline).toHaveLength(8);
  expect(parseValuationDetail({ ...detailFixture, range_history: [{ date: 'x', price: 'NaN' }], anchors: 'none' })).toMatchObject({
    range_history: [], anchors: [],
  });
  expect(parseValuationDetail({})).toBeNull();
});

const stub = (symbol: string, zone: string, gap: number): ValuationIndex => parseValuationIndex({
  symbols: { [symbol]: { status: 'ok', zone, gap_pct: gap, current_price: 10, range: { low: 8, base: 10, high: 12 } } },
})!;
const all: ValuationTracking['conditions'] = ['enter_below', 'enter_deep_below', 'return_within', 'gap_below'];

test('alerts fire on a zone crossing for tracked stocks only', () => {
  const tracked = (lastZone: ValuationTracking['lastZone']): Record<string, ValuationTracking> => ({ AAA: { lastZone, conditions: all } });
  expect(detectValuationAlerts(tracked('within'), stub('AAA', 'below', -15)).map(alert => alert.condition)).toEqual(['enter_below']);
  expect(detectValuationAlerts(tracked('within'), stub('AAA', 'deep_below', -30)).map(alert => alert.condition)).toEqual(['enter_deep_below', 'enter_below']);
  expect(detectValuationAlerts(tracked('below'), stub('AAA', 'deep_below', -30)).map(alert => alert.condition)).toEqual(['enter_deep_below']);
  expect(detectValuationAlerts(tracked('below'), stub('AAA', 'within', -5)).map(alert => alert.condition)).toEqual(['return_within']);
  expect(detectValuationAlerts(tracked('above'), stub('AAA', 'within', 5))[0]).toEqual({ symbol: 'AAA', condition: 'return_within', from: 'above', to: 'within', gapPct: 5 });
  // No crossing, first sighting, untracked stock, or a condition the user did not choose: nothing.
  expect(detectValuationAlerts(tracked('below'), stub('AAA', 'below', -15))).toEqual([]);
  expect(detectValuationAlerts(tracked(null), stub('AAA', 'deep_below', -30))).toEqual([]);
  expect(detectValuationAlerts(tracked('within'), stub('BBB', 'below', -15))).toEqual([]);
  expect(detectValuationAlerts({ AAA: { lastZone: 'within', conditions: ['return_within'] } }, stub('AAA', 'below', -15))).toEqual([]);
  expect(detectValuationAlerts(tracked('within'), stub('AAA', 'above', 20))).toEqual([]);
});

test('the gap alert fires once when the gap passes the chosen level', () => {
  const tracked = (lastGapPct: number | null): Record<string, ValuationTracking> => ({
    AAA: { lastZone: 'within', conditions: ['gap_below'], gapThresholdPct: -10, lastGapPct },
  });
  expect(detectValuationAlerts(tracked(-8), stub('AAA', 'within', -10)).map(alert => alert.condition)).toEqual(['gap_below']);
  expect(detectValuationAlerts(tracked(-12), stub('AAA', 'within', -14))).toEqual([]);
  expect(detectValuationAlerts(tracked(null), stub('AAA', 'within', -14))).toEqual([]);
  expect(detectValuationAlerts(tracked(-8), stub('AAA', 'within', -9))).toEqual([]);
});

test('advice wording is caught in every supported language', () => {
  for (const text of ['Best stocks to buy now', 'SELL signal', 'price target $200', '值得買的股票', '目标价 200', '買い時です', '매수 추천', 'Jetzt kaufen', 'à acheter', 'precio objetivo']) {
    expect(findBannedValuationTerm(text)).not.toBeNull();
  }
  for (const text of ['Below model range', '22% below the model median', '低於估值區間', '估值折價最大', 'Largest discounts to model range', 'Buyback activity', '位於估值區間內']) {
    expect(findBannedValuationTerm(text)).toBeNull();
  }
});
