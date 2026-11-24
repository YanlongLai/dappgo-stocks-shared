/**
 * 估值區間 list — one model for US, TW and Options.
 *
 * TW lists the whole market (~2,000 rows from the columnar `MARKET.json`);
 * US and Options list their covered universe from `index.json`. The screen
 * (search → overview → 自選 → zone tabs → chips → sort → rows) only reads
 * `ValuationListRow`. Pure logic, no React: filtering, sorting, counting and
 * grouping run here, memoised by `createValuationListSelector`.
 */
import { VALUATION_ZONES, isValuationZone, type ValuationIndex, type ValuationZone } from '../valuation/valuation-v2';

export type ValuationMarket = 'twse' | 'tpex';
export type ValuationRisk = 'disposition' | 'attention';

export interface ValuationListRow {
  symbol: string;
  name: string;
  market: ValuationMarket | null;
  industry: string | null;
  zone: ValuationZone | null;
  /** Price against the middle of the stock's own range, in percent (negative = below). */
  gapPct: number | null;
  price: number | null;
  pe: number | null;
  pb: number | null;
  /** Dividend yield in percent. */
  dividendYield: number | null;
  /** Where today's ratio sits in the stock's own five-year history (0–100). */
  pePct: number | null;
  pbPct: number | null;
  dividendYieldPct: number | null;
  revenueMonth: string | null;
  revenueYoyPct: number | null;
  range: { low: number; base: number; high: number } | null;
  risk: ValuationRisk | null;
  /** The stock has its own valuation page (per-symbol file). */
  covered: boolean;
  /** Date the zone was entered (index rows only). */
  zoneSince: string | null;
  /** Lower-case symbol + name without spaces, for search. */
  searchKey: string;
}

export interface ValuationMarketSummary {
  covered: number | null;
  total: number | null;
  peMedian: number | null;
  pbMedian: number | null;
  dividendYieldMedian: number | null;
}

export interface ValuationMarketTable {
  asOfDate: string | null;
  ratioDate: string | null;
  rows: ValuationListRow[];
  summary: ValuationMarketSummary;
}

const num = (value: unknown): number | null => (typeof value === 'number' && Number.isFinite(value) ? value : null);
const str = (value: unknown): string | null => (typeof value === 'string' && value.trim() ? value.trim() : null);
const searchKey = (symbol: string, name: string) => `${symbol} ${name}`.toLowerCase().replace(/\s+/g, '');

function row(partial: Partial<ValuationListRow> & { symbol: string; name: string }): ValuationListRow {
  return {
    market: null,
    industry: null,
    zone: null,
    gapPct: null,
    price: null,
    pe: null,
    pb: null,
    dividendYield: null,
    pePct: null,
    pbPct: null,
    dividendYieldPct: null,
    revenueMonth: null,
    revenueYoyPct: null,
    range: null,
    risk: null,
    covered: false,
    zoneSince: null,
    ...partial,
    searchKey: searchKey(partial.symbol, partial.name),
  };
}

/**
 * The TW market table (`MARKET.json`, `fields` + `rows` keyed by code). Returns
 * null for a preview or a malformed file. `covered` marks stocks that also
 * have their own valuation page.
 */
export function parseMarketTable(raw: unknown, covered: ReadonlySet<string> = new Set()): ValuationMarketTable | null {
  if (!raw || typeof raw !== 'object') return null;
  const doc = raw as { fields?: unknown; rows?: unknown; summary?: unknown; as_of_date?: unknown; ratio_date?: unknown; access?: unknown };
  if (doc.access === 'preview' || !Array.isArray(doc.fields) || !doc.rows || typeof doc.rows !== 'object') return null;
  const at = new Map<string, number>();
  doc.fields.forEach((field, index) => {
    if (typeof field === 'string') at.set(field, index);
  });
  const get = (values: unknown[], field: string): unknown => {
    const index = at.get(field);
    return index === undefined ? undefined : values[index];
  };
  const rows: ValuationListRow[] = [];
  for (const [symbol, values] of Object.entries(doc.rows as Record<string, unknown>)) {
    if (!Array.isArray(values) || !symbol) continue;
    const name = str(get(values, 'name')) ?? symbol;
    const market = get(values, 'market');
    const zone = get(values, 'zone');
    const risk = get(values, 'risk');
    const low = num(get(values, 'low'));
    const base = num(get(values, 'base'));
    const high = num(get(values, 'high'));
    rows.push(row({
      symbol,
      name,
      market: market === 'twse' || market === 'tpex' ? market : null,
      industry: str(get(values, 'industry')),
      zone: isValuationZone(zone) ? zone : null,
      gapPct: num(get(values, 'gap_pct')),
      price: num(get(values, 'price')),
      pe: num(get(values, 'pe')),
      pb: num(get(values, 'pb')),
      dividendYield: num(get(values, 'dividend_yield')),
      pePct: num(get(values, 'pe_pct')),
      pbPct: num(get(values, 'pb_pct')),
      dividendYieldPct: num(get(values, 'dividend_yield_pct')),
      revenueMonth: str(get(values, 'revenue_month')),
      revenueYoyPct: num(get(values, 'revenue_yoy_pct')),
      range: low !== null && base !== null && high !== null && high > low ? { low, base, high } : null,
      risk: risk === 'disposition' || risk === 'attention' ? risk : null,
      covered: covered.has(symbol),
    }));
  }
  if (!rows.length) return null;
  const summary = (doc.summary && typeof doc.summary === 'object' ? doc.summary : {}) as Record<string, unknown>;
  return {
    asOfDate: str(doc.as_of_date),
    ratioDate: str(doc.ratio_date),
    rows,
    summary: {
      covered: num(summary.covered),
      total: num(summary.total),
      peMedian: num(summary.pe_median),
      pbMedian: num(summary.pb_median),
      dividendYieldMedian: num(summary.dividend_yield_median),
    },
  };
}

/** US / Options (and TW's covered set): rows from the subscriber `index.json`. */
export function rowsFromIndex(index: Pick<ValuationIndex, 'entries'>): ValuationListRow[] {
  return index.entries
    .filter((entry) => entry.status === 'ok')
    .map((entry) => row({
      symbol: entry.symbol,
      name: entry.name || entry.symbol,
      industry: entry.sector || null,
      zone: entry.zone,
      gapPct: entry.gap_pct,
      price: entry.current_price,
      range: entry.range,
      revenueYoyPct: entry.facts?.revenue_yoy_pct ?? null,
      covered: true,
      zoneSince: entry.zone_since,
    }));
}

export type ZoneTab = 'all' | 'below' | 'within' | 'above';
export const ZONE_TABS: readonly ZoneTab[] = ['all', 'below', 'within', 'above'];
const TAB_ZONES: Record<Exclude<ZoneTab, 'all'>, readonly ValuationZone[]> = {
  below: ['deep_below', 'below'],
  within: ['within'],
  above: ['above', 'far_above'],
};

export type ValuationListSort = 'gap' | 'yield' | 'pe' | 'symbol' | 'recent';

export interface ValuationListQuery {
  query?: string;
  tab?: ZoneTab;
  market?: ValuationMarket | null;
  industry?: string | null;
  /** Minimum dividend yield in percent (3, 5). */
  minYield?: number | null;
  /** Only 處置 / 注意 stocks. */
  risk?: boolean;
  sort?: ValuationListSort;
}

export function normalizeQuery(query: string | null | undefined): string {
  return (query ?? '').trim().toLowerCase().replace(/\s+/g, '');
}

export function matchesValuationQuery(item: ValuationListRow, normalized: string): boolean {
  if (!normalized) return true;
  return item.symbol.toLowerCase().startsWith(normalized) || item.searchKey.includes(normalized);
}

export function inZoneTab(item: ValuationListRow, tab: ZoneTab): boolean {
  return tab === 'all' || (item.zone !== null && TAB_ZONES[tab].includes(item.zone));
}

/** Every filter except the zone tab (the tabs show counts under these). */
function passesFilters(item: ValuationListRow, q: ValuationListQuery, normalized: string): boolean {
  if (q.market && item.market !== q.market) return false;
  if (q.industry && item.industry !== q.industry) return false;
  if (q.minYield != null && !(item.dividendYield !== null && item.dividendYield >= q.minYield)) return false;
  if (q.risk && !item.risk) return false;
  return matchesValuationQuery(item, normalized);
}

const bySymbol = (a: ValuationListRow, b: ValuationListRow) => a.symbol.localeCompare(b.symbol, 'en', { numeric: true });
/** Missing values always sort last, whatever the direction. */
function byValue(get: (item: ValuationListRow) => number | null, direction: 1 | -1) {
  return (a: ValuationListRow, b: ValuationListRow) => {
    const x = get(a);
    const y = get(b);
    if (x === null && y === null) return bySymbol(a, b);
    if (x === null) return 1;
    if (y === null) return -1;
    return (x - y) * direction || bySymbol(a, b);
  };
}
const positivePe = (item: ValuationListRow) => (item.pe !== null && item.pe > 0 ? item.pe : null);
const sinceTime = (item: ValuationListRow) => (item.zoneSince ? Date.parse(item.zoneSince) || null : null);

/**
 * 偏離幅度 (default): the 高於 tab puts the furthest above first; every other
 * tab puts the furthest below first. 殖利率 high first, 本益比 low first
 * (losses last), 近期 newest zone change first.
 */
export function sortValuationRows(items: readonly ValuationListRow[], sort: ValuationListSort = 'gap', tab: ZoneTab = 'all'): ValuationListRow[] {
  const out = [...items];
  switch (sort) {
    case 'yield': return out.sort(byValue((item) => item.dividendYield, -1));
    case 'pe': return out.sort(byValue(positivePe, 1));
    case 'symbol': return out.sort(bySymbol);
    case 'recent': return out.sort(byValue(sinceTime, -1));
    default: return out.sort(byValue((item) => item.gapPct, tab === 'above' ? -1 : 1));
  }
}

export function selectValuationRows(items: readonly ValuationListRow[], q: ValuationListQuery = {}): ValuationListRow[] {
  const normalized = normalizeQuery(q.query);
  const tab = q.tab ?? 'all';
  return sortValuationRows(items.filter((item) => inZoneTab(item, tab) && passesFilters(item, q, normalized)), q.sort, tab);
}

/** How many rows each tab would show under the other filters (one pass). */
export function zoneTabCounts(items: readonly ValuationListRow[], q: ValuationListQuery = {}): Record<ZoneTab, number> {
  const normalized = normalizeQuery(q.query);
  const counts: Record<ZoneTab, number> = { all: 0, below: 0, within: 0, above: 0 };
  for (const item of items) {
    if (!passesFilters(item, q, normalized)) continue;
    counts.all += 1;
    for (const tab of ['below', 'within', 'above'] as const) if (inZoneTab(item, tab)) counts[tab] += 1;
  }
  return counts;
}

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export interface ValuationListOverview {
  total: number;
  /** Rows with a zone. */
  rated: number;
  counts: Record<ValuationZone, number>;
  peMedian: number | null;
  pbMedian: number | null;
  dividendYieldMedian: number | null;
}

/** Zone distribution and P/E, P/B, yield medians (positive P/E only). */
export function summarizeValuationRows(items: readonly ValuationListRow[]): ValuationListOverview {
  const counts = Object.fromEntries(VALUATION_ZONES.map((zone) => [zone, 0])) as Record<ValuationZone, number>;
  const pe: number[] = [];
  const pb: number[] = [];
  const dy: number[] = [];
  for (const item of items) {
    if (item.zone) counts[item.zone] += 1;
    if (item.pe !== null && item.pe > 0) pe.push(item.pe);
    if (item.pb !== null && item.pb > 0) pb.push(item.pb);
    if (item.dividendYield !== null) dy.push(item.dividendYield);
  }
  const rated = VALUATION_ZONES.reduce((sum, zone) => sum + counts[zone], 0);
  return { total: items.length, rated, counts, peMedian: median(pe), pbMedian: median(pb), dividendYieldMedian: median(dy) };
}

/** The user's 自選 in their own order; symbols the table does not list are returned apart. */
export function favoriteValuationRows(
  items: readonly ValuationListRow[],
  symbols: readonly string[],
): { rows: ValuationListRow[]; missing: string[] } {
  const bySym = new Map(items.map((item) => [item.symbol, item]));
  const rows: ValuationListRow[] = [];
  const missing: string[] = [];
  for (const symbol of new Set(symbols)) {
    const found = bySym.get(symbol);
    if (found) rows.push(found);
    else missing.push(symbol);
  }
  return { rows, missing };
}

/** Industries by number of rows (most first), for the 產業 chips. */
export function valuationIndustries(items: readonly ValuationListRow[]): Array<{ industry: string; count: number }> {
  const counts = new Map<string, number>();
  for (const item of items) if (item.industry) counts.set(item.industry, (counts.get(item.industry) ?? 0) + 1);
  return [...counts].map(([industry, count]) => ({ industry, count })).sort((a, b) => b.count - a.count || a.industry.localeCompare(b.industry));
}

export type ValuationListItem =
  | { type: 'group'; key: string; industry: string; count: number; collapsed: boolean }
  | { type: 'row'; key: string; row: ValuationListRow };

/**
 * Flat list items for the virtualized list. `groupBy: 'industry'` adds one
 * header per industry (most rows first, sorted rows inside); collapsed groups
 * keep their header only.
 */
export function valuationListItems(
  rows: readonly ValuationListRow[],
  opts: { groupBy?: 'industry' | null; collapsed?: ReadonlySet<string> } = {},
): ValuationListItem[] {
  if (opts.groupBy !== 'industry') return rows.map((item) => ({ type: 'row', key: item.symbol, row: item }));
  const groups = new Map<string, ValuationListRow[]>();
  for (const item of rows) {
    const industry = item.industry ?? '';
    const list = groups.get(industry);
    if (list) list.push(item);
    else groups.set(industry, [item]);
  }
  const ordered = [...groups].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
  const out: ValuationListItem[] = [];
  for (const [industry, list] of ordered) {
    const collapsed = opts.collapsed?.has(industry) ?? false;
    out.push({ type: 'group', key: `group:${industry}`, industry, count: list.length, collapsed });
    if (!collapsed) for (const item of list) out.push({ type: 'row', key: item.symbol, row: item });
  }
  return out;
}

/** Offsets for `getItemLayout`: every row and every group header has a fixed height. */
export function valuationItemOffsets(items: readonly ValuationListItem[], rowHeight: number, groupHeight: number): number[] {
  const offsets = new Array<number>(items.length + 1);
  offsets[0] = 0;
  for (let i = 0; i < items.length; i += 1) offsets[i + 1] = offsets[i] + (items[i].type === 'row' ? rowHeight : groupHeight);
  return offsets;
}

export interface ValuationListSelection {
  rows: ValuationListRow[];
  counts: Record<ZoneTab, number>;
}

/**
 * Memoised select + count. Re-runs only when the rows array or a query field
 * changes; the last few results are kept so switching tabs back is instant.
 */
export function createValuationListSelector(limit = 8): (items: readonly ValuationListRow[], q: ValuationListQuery) => ValuationListSelection {
  let source: readonly ValuationListRow[] | null = null;
  const cache = new Map<string, ValuationListSelection>();
  const countCache = new Map<string, Record<ZoneTab, number>>();
  return (items, q) => {
    if (items !== source) {
      source = items;
      cache.clear();
      countCache.clear();
    }
    const filterKey = [normalizeQuery(q.query), q.market ?? '', q.industry ?? '', q.minYield ?? '', q.risk ? 1 : 0].join('|');
    const key = `${filterKey}|${q.tab ?? 'all'}|${q.sort ?? 'gap'}`;
    const hit = cache.get(key);
    if (hit) {
      cache.delete(key);
      cache.set(key, hit);
      return hit;
    }
    let counts = countCache.get(filterKey);
    if (!counts) {
      counts = zoneTabCounts(items, q);
      countCache.set(filterKey, counts);
      if (countCache.size > limit) countCache.delete(countCache.keys().next().value as string);
    }
    const result = { rows: selectValuationRows(items, q), counts };
    cache.set(key, result);
    if (cache.size > limit) cache.delete(cache.keys().next().value as string);
    return result;
  };
}
