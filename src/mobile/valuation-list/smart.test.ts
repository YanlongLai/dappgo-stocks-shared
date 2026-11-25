import { filterItems, emptyFilter, sortItems, suggestChips } from '../list-filter/model';
import { edgeDistancePct, valuationSegment, valuationSmartConfig, valuationSmartItems } from './smart';

const row = (symbol: string, name: string, zone: any, price: number, low: number, high: number, industry: string, y: number | null) => ({
  symbol, name, market: 'twse' as const, industry, zone, gapPct: 0, price, pe: 10, pb: 1, dividendYield: y, pePct: null, pbPct: null, dividendYieldPct: null,
  revenueMonth: null, revenueYoyPct: null, range: { low, base: (low + high) / 2, high }, risk: null, covered: true, zoneSince: null, searchKey: '',
});

const labels = {
  zone: (s: string) => ({ below: '偏低', within: '合理', above: '偏高' } as Record<string, string>)[s],
  market: (m: string) => (m === 'twse' ? '上市' : '上櫃'),
  risk: (r: string) => r, yieldAtLeast: (p: number) => `殖利率 ≥${p}%`,
  keywords: { zone: ['估值'], yield: ['殖利率'], risk: ['處置'] },
};

describe('valuation smart list', () => {
  const rows = [
    row('2330', '台積電', 'within', 2230, 1800, 2300, '半導體', 0.8),
    row('2303', '聯電', 'deep_below', 50, 60, 80, '半導體', 5.2),
    row('2603', '長榮', 'far_above', 300, 150, 250, '航運', 7.4),
  ];
  const items = valuationSmartItems(rows, new Set(['2330']));
  const cfg = valuationSmartConfig(labels, { zhuyin: true, yieldChips: true });

  it('folds deep/far zones into three segments; edge distance', () => {
    expect(valuationSegment('deep_below')).toBe('below');
    expect(valuationSegment(null)).toBeNull();
    expect(edgeDistancePct({ price: 2230, range: { low: 1800, base: 0, high: 2300 } })).toBeCloseTo(3.14, 1);
    expect(items.map((i) => i.facets.zone)).toEqual(['within', 'below', 'above']);
  });

  it('default sort is nearest an edge; 注音 and chips work', () => {
    expect(sortItems(items, 'edge', cfg).map((i) => i.symbol)).toEqual(['2330', '2603', '2303']);
    expect(filterItems(items, { ...emptyFilter('edge'), query: 'ㄊㄐㄉ' }, cfg).map((i) => i.symbol)).toEqual(['2330']);
    expect(suggestChips(items, emptyFilter('edge'), cfg, '殖利率').map((s) => [s.label, s.count])).toEqual([['殖利率 ≥3%', 2], ['殖利率 ≥5%', 2]]);
    expect(filterItems(items, { ...emptyFilter('edge'), favoritesOnly: true }, cfg)).toHaveLength(1);
  });
});

describe('valuationSmartConfig industry label', () => {
  it('uses the app label for industries when given', () => {
    const base = { zone: (s: string) => s, market: (m: string) => m, risk: (r: string) => r, yieldAtLeast: (p: number) => `${p}`, keywords: { zone: [], yield: [], risk: [] } };
    const cfg = valuationSmartConfig({ ...base, industry: (v) => (v === '半導體業' ? 'Semiconductors' : v) } as never);
    expect(cfg.facets.find((f) => f.dim === 'industry')!.label('半導體業')).toBe('Semiconductors');
    expect(valuationSmartConfig(base as never).facets.find((f) => f.dim === 'industry')!.label('半導體業')).toBe('半導體業');
  });
});

describe('valuation bar adds up', () => {
  it('stocks without a range form the 無區間 segment', () => {
    const base = { zone: (s: string) => s, market: (m: string) => m, risk: (r: string) => r, yieldAtLeast: (p: number) => `${p}`, keywords: { zone: [], yield: [], risk: [] } };
    const cfg = valuationSmartConfig(base as never);
    expect(cfg.segments).toEqual(['below', 'within', 'above', 'none']);
    expect(cfg.segmentOf({ symbol: 'X', facets: { zone: null }, numbers: {} } as never)).toBe('none');
    expect(cfg.segmentOf({ symbol: 'Y', facets: { zone: 'below' }, numbers: {} } as never)).toBe('below');
  });
});
