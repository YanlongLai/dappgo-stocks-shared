import { matchesZhuyin, isZhuyinQuery } from './zhuyin';

/**
 * One filter state for a big list (1.12.0 plan §3.3–3.4): the distribution
 * bar segment, condition chips, the search text, 「自選」 and the sort. The
 * bar and the smart search bar read and write the same state, and every count
 * the UI shows (bar segments, the live result count, each suggestion's
 * 「加入後 N 筆」) comes from the one filterItems function below.
 */

export interface ListItem {
  symbol: string;
  name: string;
  /** Categorical facets, e.g. { zone: 'below', industry: '半導體', tone: 'bullish', market: 'twse' }. */
  facets: Record<string, string | null | undefined>;
  /** Numbers for threshold chips and sorting, e.g. { change: -1.2, yield: 4.1, edge: 0.03 }. */
  numbers: Record<string, number | null | undefined>;
  favorite?: boolean;
}

/** A facet chip (dim = facet name) or a threshold chip (dim = 'min:<number>', value = the threshold). */
export interface FilterChip { dim: string; value: string }

export type SortKey = string;

export interface ListFilter {
  segment: string | null;
  chips: FilterChip[];
  query: string;
  favoritesOnly: boolean;
  sort: SortKey;
}

export interface FacetSpec {
  dim: string;
  /** Display label of a value, e.g. zone 'below' → 「偏低」. */
  label: (value: string) => string;
  /** Extra words that should suggest this facet's values, e.g. ['估值','區間'] for zone. */
  keywords?: readonly string[];
}

export interface ThresholdSpec {
  /** Number key in ListItem.numbers, e.g. 'yield'. */
  key: string;
  values: readonly number[];
  label: (value: number) => string;
  keywords: readonly string[];
}

export interface SortSpec { key: SortKey; dir: 'asc' | 'desc'; abs?: boolean }

export interface ListConfig {
  /** Distribution bar: which segment an item belongs to (null = none), and the segments in bar order. */
  segmentOf: (item: ListItem) => string | null;
  segments: readonly string[];
  facets: readonly FacetSpec[];
  thresholds?: readonly ThresholdSpec[];
  sorts: Record<SortKey, SortSpec>;
  /** TW: also match 注音首字 against names. */
  zhuyin?: boolean;
}

export function emptyFilter(sort: SortKey, segment: string | null = null): ListFilter {
  return { segment, chips: [], query: '', favoritesOnly: false, sort };
}

export const chipKey = (c: FilterChip): string => `${c.dim}:${c.value}`;
const sameChip = (a: FilterChip, b: FilterChip) => a.dim === b.dim && a.value === b.value;

export function matchesQuery(item: ListItem, query: string, zhuyin = false): boolean {
  const q = query.trim();
  if (!q) return true;
  const lower = q.toLowerCase();
  if (item.symbol.toLowerCase().includes(lower) || item.name.toLowerCase().includes(lower)) return true;
  return zhuyin && isZhuyinQuery(q) && matchesZhuyin(item.name, q);
}

function matchesChip(item: ListItem, chip: FilterChip): boolean {
  if (chip.dim.startsWith('min:')) {
    const v = item.numbers[chip.dim.slice(4)];
    return typeof v === 'number' && Number.isFinite(v) && v >= Number(chip.value);
  }
  return item.facets[chip.dim] === chip.value;
}

/**
 * Items that pass the filter. Chips of the same facet are OR-ed (偏低 or 合理),
 * different facets AND-ed. `ignoreSegment` is used to count the bar's segments.
 */
export function filterItems(items: readonly ListItem[], filter: ListFilter, cfg: ListConfig, opts: { ignoreSegment?: boolean } = {}): ListItem[] {
  const byDim = new Map<string, FilterChip[]>();
  for (const c of filter.chips) byDim.set(c.dim, [...(byDim.get(c.dim) ?? []), c]);
  return items.filter((item) => {
    if (filter.favoritesOnly && !item.favorite) return false;
    if (!opts.ignoreSegment && filter.segment !== null && cfg.segmentOf(item) !== filter.segment) return false;
    for (const chips of byDim.values()) if (!chips.some((c) => matchesChip(item, c))) return false;
    return matchesQuery(item, filter.query, cfg.zhuyin);
  });
}

/** Segment counts for the bar, under every other condition (so the bar always adds up to the result). */
export function segmentCounts(items: readonly ListItem[], filter: ListFilter, cfg: ListConfig): { segment: string; count: number }[] {
  const base = filterItems(items, filter, cfg, { ignoreSegment: true });
  const counts = new Map<string, number>();
  for (const it of base) {
    const s = cfg.segmentOf(it);
    if (s !== null) counts.set(s, (counts.get(s) ?? 0) + 1);
  }
  return cfg.segments.map((segment) => ({ segment, count: counts.get(segment) ?? 0 }));
}

export function favoriteCount(items: readonly ListItem[]): number {
  return items.reduce((n, it) => n + (it.favorite ? 1 : 0), 0);
}

/** Tap a segment: show only it; tap it again: back to all. */
export function toggleSegment(filter: ListFilter, segment: string): ListFilter {
  return { ...filter, segment: filter.segment === segment ? null : segment };
}

export function addChip(filter: ListFilter, chip: FilterChip): ListFilter {
  if (filter.chips.some((c) => sameChip(c, chip))) return filter;
  return { ...filter, chips: [...filter.chips, chip], query: '' };
}

export function removeChip(filter: ListFilter, chip: FilterChip): ListFilter {
  return { ...filter, chips: filter.chips.filter((c) => !sameChip(c, chip)) };
}

export interface ChipSuggestion { chip: FilterChip; label: string; count: number }

/**
 * While typing: condition chips whose label or keywords contain the text,
 * each with the result count after adding it (the text is consumed by the chip).
 * `rank` lets the app order by the user's own usage (personalization).
 */
export function suggestChips(
  items: readonly ListItem[],
  filter: ListFilter,
  cfg: ListConfig,
  query: string,
  opts: { limit?: number; rank?: (chip: FilterChip) => number } = {},
): ChipSuggestion[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const out: ChipSuggestion[] = [];
  const seen = new Set<string>();
  const consider = (chip: FilterChip, label: string, words: readonly string[]) => {
    const key = chipKey(chip);
    if (seen.has(key) || filter.chips.some((c) => sameChip(c, chip))) return;
    if (!label.toLowerCase().includes(q) && !words.some((w) => w.toLowerCase().includes(q) || q.includes(w.toLowerCase()))) return;
    const count = filterItems(items, addChip({ ...filter, query: '' }, chip), cfg).length;
    if (count === 0) return;
    seen.add(key);
    out.push({ chip, label, count });
  };
  for (const f of cfg.facets) {
    const values = new Set<string>();
    for (const it of items) { const v = it.facets[f.dim]; if (typeof v === 'string' && v) values.add(v); }
    for (const v of values) consider({ dim: f.dim, value: v }, f.label(v), f.keywords ?? []);
  }
  for (const t of cfg.thresholds ?? []) {
    for (const v of t.values) consider({ dim: `min:${t.key}`, value: String(v) }, t.label(v), t.keywords);
  }
  const rank = opts.rank ?? (() => 0);
  return out
    .sort((a, b) => rank(b.chip) - rank(a.chip) || b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, opts.limit ?? 6);
}

/** Label for any chip the list knows (for the chip row and saved filters). */
export function chipLabel(chip: FilterChip, cfg: ListConfig): string {
  if (chip.dim.startsWith('min:')) {
    const t = cfg.thresholds?.find((x) => `min:${x.key}` === chip.dim);
    return t ? t.label(Number(chip.value)) : chip.value;
  }
  return cfg.facets.find((f) => f.dim === chip.dim)?.label(chip.value) ?? chip.value;
}

/** Sort: missing numbers last; ties by symbol. */
export function sortItems(items: readonly ListItem[], sort: SortKey, cfg: ListConfig): ListItem[] {
  const spec = cfg.sorts[sort];
  if (!spec || spec.key === 'symbol') return [...items].sort((a, b) => a.symbol.localeCompare(b.symbol, undefined, { numeric: true }));
  const val = (it: ListItem) => {
    const v = it.numbers[spec.key];
    if (typeof v !== 'number' || !Number.isFinite(v)) return null;
    return spec.abs ? Math.abs(v) : v;
  };
  return [...items].sort((a, b) => {
    const x = val(a); const y = val(b);
    if (x === null && y === null) return a.symbol.localeCompare(b.symbol, undefined, { numeric: true });
    if (x === null) return 1;
    if (y === null) return -1;
    return (spec.dir === 'asc' ? x - y : y - x) || a.symbol.localeCompare(b.symbol, undefined, { numeric: true });
  });
}

export interface GroupSection { key: string; title: string; items: ListItem[]; total: number; hidden: number }

/**
 * Industry sections (A4): one section per value of `dim`, largest first; each
 * shows `perGroup` items plus 「再看 N 檔」 unless expanded. Items without a
 * value go to a last 「其他」 section.
 */
export function groupItems(items: readonly ListItem[], dim: string, opts: { perGroup?: number; expanded?: ReadonlySet<string>; otherTitle: string; title?: (v: string) => string }): GroupSection[] {
  const per = opts.perGroup ?? 5;
  const map = new Map<string, ListItem[]>();
  const OTHER = '\u0000other';
  for (const it of items) {
    const v = it.facets[dim];
    const k = typeof v === 'string' && v ? v : OTHER;
    map.set(k, [...(map.get(k) ?? []), it]);
  }
  return [...map.entries()]
    .sort(([a, x], [b, y]) => Number(a === OTHER) - Number(b === OTHER) || y.length - x.length || a.localeCompare(b))
    .map(([k, list]) => {
      const open = opts.expanded?.has(k) ?? false;
      const shown = open ? list : list.slice(0, per);
      return { key: k, title: k === OTHER ? opts.otherTitle : opts.title?.(k) ?? k, items: shown, total: list.length, hidden: list.length - shown.length };
    });
}

/** Whether a filter does anything (for 「清除篩選」 and the compact bar). */
export function isFiltered(filter: ListFilter): boolean {
  return filter.segment !== null || filter.chips.length > 0 || filter.query.trim() !== '' || filter.favoritesOnly;
}

/** Stable string for personalization (usage counts, saved filters). */
export function filterKey(filter: ListFilter): string {
  return [filter.segment ? `seg:${filter.segment}` : '', ...filter.chips.map(chipKey).sort(), filter.favoritesOnly ? 'fav' : ''].filter(Boolean).join('|');
}
