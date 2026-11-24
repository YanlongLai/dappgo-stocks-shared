import fixture from '../__fixtures__/tw-market-valuation.json';
import type { ValuationIndexEntry } from '../valuation/valuation-v2';
import {
  createValuationListSelector,
  favoriteValuationRows,
  parseMarketTable,
  rowsFromIndex,
  selectValuationRows,
  sortValuationRows,
  summarizeValuationRows,
  valuationIndustries,
  valuationItemOffsets,
  valuationListItems,
  zoneTabCounts,
  type ValuationListRow,
} from './model';

const table = parseMarketTable(fixture, new Set(['2330']))!;
const rows = table.rows;
const bySymbol = (symbol: string) => rows.find((row) => row.symbol === symbol)!;

describe('parseMarketTable', () => {
  it('reads the columnar TW table', () => {
    expect(rows.length).toBe(Object.keys(fixture.rows).length);
    expect(table.asOfDate).toBe(fixture.as_of_date);
    expect(table.summary.peMedian).toBe(14.64);
    const tsmc = bySymbol('2330');
    expect(tsmc).toMatchObject({ name: '台積電', market: 'twse', industry: '半導體業', zone: 'within', gapPct: -0.9, covered: true });
    expect(tsmc.range).toEqual({ low: 1511.74, base: 2048.45, high: 2435.06 });
    expect(bySymbol('1101').covered).toBe(false);
  });

  it('keeps rows without a zone and reads risk flags', () => {
    expect(bySymbol('1295').zone).toBeNull();
    expect(bySymbol('1569').risk).toBe('disposition');
  });

  it('refuses a preview or a malformed file', () => {
    expect(parseMarketTable({ access: 'preview', as_of_date: '2026-11-24' })).toBeNull();
    expect(parseMarketTable({ fields: ['name'], rows: {} })).toBeNull();
    expect(parseMarketTable(null)).toBeNull();
  });

  it('reads fields by name, whatever their order', () => {
    const parsed = parseMarketTable({ fields: ['zone', 'name', 'gap_pct'], rows: { '9999': ['below', '測試', -12] } })!;
    expect(parsed.rows[0]).toMatchObject({ symbol: '9999', name: '測試', zone: 'below', gapPct: -12, pe: null });
  });
});

describe('rowsFromIndex', () => {
  it('maps covered index entries and drops unrated ones', () => {
    const entry = (symbol: string, status: ValuationIndexEntry['status']): ValuationIndexEntry => ({
      symbol, name: `${symbol} Inc`, sector: 'Tech', status, current_price: 10, range: { low: 8, base: 10, high: 12 },
      zone: 'below', gap_pct: -20, confidence: 'high', zone_since: '2026-11-01', score: null, score_parts: null,
      conditions: [], conditions_met: 0, facts: null, warnings: [],
    });
    const out = rowsFromIndex({ entries: [entry('AAPL', 'ok'), entry('SPY', 'not_applicable')] });
    expect(out.map((row) => row.symbol)).toEqual(['AAPL']);
    expect(out[0]).toMatchObject({ industry: 'Tech', covered: true, zoneSince: '2026-11-01', market: null });
  });
});

describe('select and count', () => {
  it('searches by code prefix or name', () => {
    expect(selectValuationRows(rows, { query: '233' }).map((row) => row.symbol)).toEqual(['2330']);
    expect(selectValuationRows(rows, { query: '台 積' }).map((row) => row.symbol)).toEqual(['2330']);
  });

  it('filters by tab, market, industry, yield and risk', () => {
    expect(selectValuationRows(rows, { tab: 'below' }).every((row) => row.zone === 'below' || row.zone === 'deep_below')).toBe(true);
    expect(selectValuationRows(rows, { market: 'tpex' }).every((row) => row.market === 'tpex')).toBe(true);
    expect(selectValuationRows(rows, { industry: '半導體業' }).every((row) => row.industry === '半導體業')).toBe(true);
    expect(selectValuationRows(rows, { minYield: 5 }).every((row) => (row.dividendYield ?? 0) >= 5)).toBe(true);
    expect(selectValuationRows(rows, { risk: true }).map((row) => row.symbol).sort()).toEqual(['1569', '2305', '2466', '3081']);
  });

  it('counts each tab under the other filters', () => {
    const counts = zoneTabCounts(rows, { market: 'twse' });
    const twse = rows.filter((row) => row.market === 'twse');
    expect(counts.all).toBe(twse.length);
    expect(counts.below).toBe(twse.filter((row) => row.zone === 'below' || row.zone === 'deep_below').length);
    expect(counts.below + counts.within + counts.above).toBeLessThanOrEqual(counts.all);
  });
});

describe('sortValuationRows', () => {
  const make = (symbol: string, fields: Partial<ValuationListRow>): ValuationListRow => ({
    ...bySymbol('2330'), symbol, searchKey: symbol, ...fields,
  });
  const sample = [
    make('A', { gapPct: -10, dividendYield: 2, pe: 15 }),
    make('B', { gapPct: 30, dividendYield: 6, pe: -3 }),
    make('C', { gapPct: null, dividendYield: null, pe: null }),
    make('D', { gapPct: -40, dividendYield: 4, pe: 8 }),
  ];
  const order = (sorted: ValuationListRow[]) => sorted.map((row) => row.symbol).join('');

  it('puts the furthest below first, or the furthest above on the 高於 tab; nulls last', () => {
    expect(order(sortValuationRows(sample, 'gap'))).toBe('DABC');
    expect(order(sortValuationRows(sample, 'gap', 'above'))).toBe('BADC');
  });
  it('sorts yield high first and P/E low first with losses last', () => {
    expect(order(sortValuationRows(sample, 'yield'))).toBe('BDAC');
    expect(order(sortValuationRows(sample, 'pe'))).toBe('DABC');
    expect(order(sortValuationRows(sample, 'symbol'))).toBe('ABCD');
  });
});

describe('overview, favourites and groups', () => {
  it('summarises zones and medians', () => {
    const overview = summarizeValuationRows(rows);
    expect(overview.total).toBe(rows.length);
    expect(overview.rated).toBe(rows.filter((row) => row.zone).length);
    expect(overview.peMedian).not.toBeNull();
  });

  it('keeps the favourites order and reports symbols the table lacks', () => {
    expect(favoriteValuationRows(rows, ['2454', '2330', 'XXXX', '2330'])).toEqual({
      rows: [bySymbol('2454'), bySymbol('2330')],
      missing: ['XXXX'],
    });
  });

  it('groups by industry with collapsible headers and fixed offsets', () => {
    const industries = valuationIndustries(rows);
    expect(industries[0].count).toBeGreaterThanOrEqual(industries[industries.length - 1].count);
    const open = valuationListItems(rows, { groupBy: 'industry' });
    expect(open.filter((item) => item.type === 'row')).toHaveLength(rows.length);
    const first = industries[0].industry;
    const closed = valuationListItems(rows, { groupBy: 'industry', collapsed: new Set([first]) });
    expect(closed.length).toBe(open.length - industries[0].count);
    const offsets = valuationItemOffsets(closed, 60, 40);
    expect(offsets[1]).toBe(40);
    expect(offsets[closed.length]).toBe(40 * industries.length + 60 * (rows.length - industries[0].count));
    expect(valuationListItems(rows).every((item) => item.type === 'row')).toBe(true);
  });
});

describe('createValuationListSelector', () => {
  it('returns the same result for the same rows and query', () => {
    const select = createValuationListSelector();
    const first = select(rows, { tab: 'below', query: '' });
    expect(select(rows, { tab: 'below', query: ' ' })).toBe(first);
    expect(select([...rows], { tab: 'below' })).not.toBe(first);
  });

  it('selects 2,000 rows quickly', () => {
    const big: ValuationListRow[] = [];
    for (let i = 0; i < 2000; i += 1) {
      const base = rows[i % rows.length];
      big.push({ ...base, symbol: String(1000 + i), searchKey: `${1000 + i}${base.name}` });
    }
    const select = createValuationListSelector();
    const start = Date.now();
    for (const tab of ['all', 'below', 'within', 'above'] as const) select(big, { tab, sort: 'gap', minYield: 3 });
    select(big, { query: '台' });
    expect(Date.now() - start).toBeLessThan(200);
  });
});
