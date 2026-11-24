import {
  addChip, emptyFilter, filterItems, filterKey, groupItems, isFiltered, removeChip, segmentCounts, sortItems, suggestChips,
  toggleSegment, type ListConfig, type ListItem,
} from './model';
import { matchesZhuyin, zhuyinInitials } from './zhuyin';

const item = (symbol: string, name: string, zone: string | null, industry: string, yieldPct: number | null, change: number, favorite = false, edge: number | null = null): ListItem => ({
  symbol, name, facets: { zone, industry }, numbers: { yield: yieldPct, change, edge }, favorite,
});

// A slice of TW, 2026-11-24.
const items: ListItem[] = [
  item('2330', '台積電', 'within', '半導體', 0.8, 9.85, true, 0.04),
  item('2454', '聯發科', 'above', '半導體', 1.6, 9.91, true, 0.12),
  item('2303', '聯電', 'below', '半導體', 5.2, 9.7, false, 0.02),
  item('2618', '長榮航', 'below', '航運', 6.1, 9.9, false, 0.3),
  item('2603', '長榮', 'below', '航運', 7.4, 9.8, false, 0.01),
  item('2882', '國泰金', 'within', '金融', 3.4, 1.2, false, 0.2),
  item('6505', '台塑化', 'above', '塑化', 1.1, -1.7, false, null),
];

const ZONE: Record<string, string> = { below: '偏低', within: '合理', above: '偏高' };
const cfg: ListConfig = {
  segmentOf: (it) => (it.facets.zone as string) ?? null,
  segments: ['below', 'within', 'above'],
  facets: [
    { dim: 'zone', label: (v) => ZONE[v] ?? v, keywords: ['估值', '區間'] },
    { dim: 'industry', label: (v) => v },
  ],
  thresholds: [{ key: 'yield', values: [3, 5], label: (v) => `殖利率 ≥${v}%`, keywords: ['殖利率', '股息', 'yield'] }],
  sorts: { edge: { key: 'edge', dir: 'asc' }, change: { key: 'change', dir: 'desc' }, yield: { key: 'yield', dir: 'desc' }, symbol: { key: 'symbol', dir: 'asc' } },
  zhuyin: true,
};

describe('zhuyin', () => {
  it('ㄊㄐㄉ finds 台積電; partial runs and 多音字 work', () => {
    expect(matchesZhuyin('台積電', 'ㄊㄐㄉ')).toBe(true);
    expect(matchesZhuyin('台積電', 'ㄐㄉ')).toBe(true);
    expect(matchesZhuyin('台積電', 'ㄉㄐ')).toBe(false);
    expect(zhuyinInitials('長').has('ㄔ')).toBe(true);
    expect(zhuyinInitials('長').has('ㄓ')).toBe(true);
    expect(matchesZhuyin('長榮', 'ㄔㄖ')).toBe(true);
    expect(matchesZhuyin('國泰金', 'ㄍㄊㄐ')).toBe(true);
  });
});

describe('filterItems', () => {
  it('query: code, name and (TW) zhuyin', () => {
    const f = (q: string) => filterItems(items, { ...emptyFilter('change'), query: q }, cfg).map((i) => i.symbol);
    expect(f('23')).toEqual(['2330', '2303']);
    expect(f('長榮')).toEqual(['2618', '2603']);
    expect(f('ㄊㄐㄉ')).toEqual(['2330']);
    expect(filterItems(items, { ...emptyFilter('change'), query: 'ㄊㄐㄉ' }, { ...cfg, zhuyin: false })).toEqual([]);
  });

  it('chips: same facet OR, different facets AND; thresholds', () => {
    let f = addChip(emptyFilter('change'), { dim: 'industry', value: '航運' });
    f = addChip(f, { dim: 'industry', value: '金融' });
    expect(filterItems(items, f, cfg).map((i) => i.symbol)).toEqual(['2618', '2603', '2882']);
    f = addChip(f, { dim: 'min:yield', value: '5' });
    expect(filterItems(items, f, cfg).map((i) => i.symbol)).toEqual(['2618', '2603']);
    expect(filterItems(items, removeChip(f, { dim: 'min:yield', value: '5' }), cfg)).toHaveLength(3);
  });

  it('自選 and segment', () => {
    expect(filterItems(items, { ...emptyFilter('change'), favoritesOnly: true }, cfg).map((i) => i.symbol)).toEqual(['2330', '2454']);
    const below = toggleSegment(emptyFilter('change'), 'below');
    expect(filterItems(items, below, cfg)).toHaveLength(3);
    expect(toggleSegment(below, 'below').segment).toBeNull();
  });
});

describe('segmentCounts', () => {
  it('counts every segment under the other conditions, ignoring the selected segment', () => {
    const f = addChip(toggleSegment(emptyFilter('edge'), 'below'), { dim: 'industry', value: '半導體' });
    expect(segmentCounts(items, f, cfg)).toEqual([{ segment: 'below', count: 1 }, { segment: 'within', count: 1 }, { segment: 'above', count: 1 }]);
    const total = segmentCounts(items, emptyFilter('edge'), cfg).reduce((n, s) => n + s.count, 0);
    expect(total).toBe(items.length);
  });
});

describe('suggestChips', () => {
  it('「半導體」 suggests the industry chip with the count after adding', () => {
    expect(suggestChips(items, emptyFilter('change'), cfg, '半導體')).toEqual([{ chip: { dim: 'industry', value: '半導體' }, label: '半導體', count: 3 }]);
  });
  it('「偏低」 and 「殖利率」 suggest chips; counts respect current chips', () => {
    expect(suggestChips(items, emptyFilter('change'), cfg, '偏低')[0]).toMatchObject({ label: '偏低', count: 3 });
    const shipping = addChip(emptyFilter('change'), { dim: 'industry', value: '航運' });
    expect(suggestChips(items, shipping, cfg, '殖利率').map((s) => [s.label, s.count])).toEqual([['殖利率 ≥3%', 2], ['殖利率 ≥5%', 2]]);
  });
  it('drops chips already applied or with no results; rank puts the user’s habits first', () => {
    const f = addChip(emptyFilter('change'), { dim: 'zone', value: 'below' });
    expect(suggestChips(items, f, cfg, '偏低')).toEqual([]);
    const ranked = suggestChips(items, emptyFilter('change'), cfg, '殖利率', { rank: (c) => (c.value === '5' ? 10 : 0) });
    expect(ranked[0].label).toBe('殖利率 ≥5%');
  });
});

describe('sort, groups, keys', () => {
  it('edge ascending with missing values last; change descending', () => {
    expect(sortItems(items, 'edge', cfg).map((i) => i.symbol)).toEqual(['2603', '2303', '2330', '2454', '2882', '2618', '6505']);
    expect(sortItems(items, 'change', cfg)[0].symbol).toBe('2454');
  });

  it('industry sections: largest first, 5 shown, 「再看 N 檔」, expandable, 其他 last', () => {
    const many = [...items, ...Array.from({ length: 4 }, (_, i) => item(`9${i}`, `半導體${i}`, 'within', '半導體', 1, 1)), item('0000', '無產業', 'within', '', 1, 1)];
    const sections = groupItems(many, 'industry', { otherTitle: '其他' });
    expect(sections.map((s) => [s.title, s.items.length, s.hidden])).toEqual([['半導體', 5, 2], ['航運', 2, 0], ['塑化', 1, 0], ['金融', 1, 0], ['其他', 1, 0]]);
    expect(groupItems(many, 'industry', { otherTitle: '其他', expanded: new Set(['半導體']) })[0].items).toHaveLength(7);
  });

  it('filter keys and isFiltered', () => {
    const f = addChip(toggleSegment(emptyFilter('edge'), 'below'), { dim: 'industry', value: '航運' });
    expect(filterKey(f)).toBe('seg:below|industry:航運');
    expect(isFiltered(f)).toBe(true);
    expect(isFiltered(emptyFilter('edge'))).toBe(false);
  });
});
