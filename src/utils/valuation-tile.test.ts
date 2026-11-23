import { buildValuationTile, parseMarketValuationSummary, parseRiskNotices, percentileBand } from './valuation-tile';
import { findBannedValuationTerm } from '../mobile/valuation/valuation-v2';

const market = {
  covered: 1700, total: 1982,
  zone_counts: { deep_below: 100, below: 200, within: 900, above: 300, far_above: 200 },
  zone_counts_by_market: { twse: { deep_below: 50, below: 100, within: 500, above: 150, far_above: 100 }, tpex: { within: 400 } },
  pe_median: 17.1, pe_median_pct: 62, pb_median: 1.6, pb_median_pct: 81.5,
  dividend_yield_median: 3.2, dividend_yield_median_pct: 12,
  pe_median_history: [{ date: '2025-01-03', value: 15.2 }, { date: '2025-02-07', value: 'x' }, { date: '2025-03-07', value: 16 }],
};

describe('percentileBand', () => {
  it('splits at 30 and 70', () => {
    expect(percentileBand(0)).toBe('low');
    expect(percentileBand(30)).toBe('low');
    expect(percentileBand(50)).toBe('mid');
    expect(percentileBand(70)).toBe('high');
    expect(percentileBand(null)).toBeNull();
    expect(percentileBand(NaN)).toBeNull();
  });
});

describe('parseMarketValuationSummary', () => {
  it('reads medians, percentiles, markets and history', () => {
    const m = parseMarketValuationSummary(market)!;
    expect(m.pe).toEqual({ value: 17.1, pct: 62, band: 'mid' });
    expect(m.pb?.band).toBe('high');
    expect(m.dividendYield?.band).toBe('low');
    expect(m.zoneCountsByMarket.tpex).toEqual({ deep_below: 0, below: 0, within: 400, above: 0, far_above: 0 });
    expect(m.peHistory).toEqual([15.2, 16]);
    expect(m.total).toBe(1982);
  });
  it('drops non-positive ratios and returns null when nothing is usable', () => {
    expect(parseMarketValuationSummary({ pe_median: 0, pb_median: -1 })).toBeNull();
    expect(parseMarketValuationSummary(null)).toBeNull();
    expect(parseMarketValuationSummary([1, 2])).toBeNull();
    expect(parseMarketValuationSummary({ pe_median: 12 })!.pe).toEqual({ value: 12, pct: null, band: null });
  });
});

describe('buildValuationTile', () => {
  it('uses universe zone counts (US/Options)', () => {
    const t = buildValuationTile({ covered: 5, zone_counts: { deep_below: 1, below: 1, within: 1, above: 0, far_above: 2 } });
    expect(t).toMatchObject({ state: 'ready', below: 2, within: 1, above: 2, total: 5, belowShare: 40, market: null });
  });
  it('prefers market-wide counts (TW)', () => {
    const t = buildValuationTile({ zone_counts: { within: 3 }, market });
    expect(t.total).toBe(1700);
    expect(t.below).toBe(300);
    expect(t.market?.pe?.value).toBe(17.1);
  });
  it('is ready with medians even when every stock lacks a range', () => {
    const t = buildValuationTile({ zone_counts: { deep_below: 0, below: 0, within: 0 }, market: { pe_median: 15 } });
    expect(t.state).toBe('ready');
    expect(t.total).toBe(0);
    expect(t.belowShare).toBeNull();
  });
  it('is empty for missing or all-zero data', () => {
    expect(buildValuationTile(undefined).state).toBe('empty');
    expect(buildValuationTile({ zone_counts: { within: 0 } }).state).toBe('empty');
    expect(buildValuationTile({ zone_counts: 'bad' }).state).toBe('empty');
  });
});

describe('parseRiskNotices', () => {
  const raw = {
    schema_version: 1, as_of_date: '2026-11-24',
    counts: { disposition: 2, attention: 1, disposition_all: 3, attention_all: 1 },
    disposition: [
      { code: '6182', name: '合晶', market: 'tpex', kind: 'stock', end: '2026-12-05', in_universe: false },
      { code: '00940', name: 'ETF', market: 'twse', kind: 'etf', end: '2026-12-01' },
      { code: '2330', name: '台積電', market: 'twse', kind: 'stock', end: '2026-12-02', in_universe: true },
      { code: '2330', name: 'dup', kind: 'stock' },
    ],
    attention: [{ code: '3231', name: '緯創', market: 'twse', date: '2026-11-24' }],
  };
  it('keeps ordinary shares, covered stocks first, and uses the published counts', () => {
    const r = parseRiskNotices(raw)!;
    expect(r.disposition).toBe(2);
    expect(r.dispositionItems.map((i) => i.code)).toEqual(['2330', '6182']);
    expect(r.dispositionItems[0]).toMatchObject({ until: '2026-12-02', inUniverse: true });
    expect(r.attentionItems[0]).toMatchObject({ code: '3231', until: '2026-11-24' });
    expect(r.asOf).toBe('2026-11-24');
  });
  it('falls back to list length without counts and is null when absent', () => {
    expect(parseRiskNotices({ attention: [{ code: '1234' }] })!.attention).toBe(1);
    expect(parseRiskNotices(undefined)).toBeNull();
    expect(parseRiskNotices({})).toBeNull();
  });
});

describe('wording', () => {
  it('module copy carries no banned valuation terms', () => {
    expect(findBannedValuationTerm('below range · within · above')).toBeNull();
  });
});
