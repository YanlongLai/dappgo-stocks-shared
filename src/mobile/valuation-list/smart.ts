import type { ListConfig, ListItem } from '../list-filter/model';
import type { ValuationListRow } from './model';
import type { ValuationZone } from '../valuation/valuation-v2';

/** Distribution bar groups for valuation: deep_below/below → below, far_above/above → above. */
export type ValuationSegment = 'below' | 'within' | 'above';
/** Bar segment for stocks without a model range (2.0.0). */
export const VALUATION_NO_RANGE = 'none';
export function valuationSegment(zone: ValuationZone | null): ValuationSegment | null {
  if (zone === 'deep_below' || zone === 'below') return 'below';
  if (zone === 'within') return 'within';
  if (zone === 'above' || zone === 'far_above') return 'above';
  return null;
}

/** Distance from today's price to the nearest edge of the stock's own range, in % of price. */
export function edgeDistancePct(row: Pick<ValuationListRow, 'price' | 'range'>): number | null {
  if (!row.range || typeof row.price !== 'number' || !(row.price > 0)) return null;
  return (Math.min(Math.abs(row.price - row.range.low), Math.abs(row.price - row.range.high)) / row.price) * 100;
}

/** Valuation rows as list items for SmartList (plan §3.3). */
export function valuationSmartItems(rows: readonly ValuationListRow[], favorites: ReadonlySet<string>): ListItem[] {
  return rows.map((r) => ({
    symbol: r.symbol,
    name: r.name,
    facets: { zone: valuationSegment(r.zone), industry: r.industry, market: r.market, risk: r.risk },
    numbers: { edge: edgeDistancePct(r), gap: r.gapPct, yield: r.dividendYield, pe: r.pe, recent: r.zoneSince ? Date.parse(r.zoneSince) || null : null },
    favorite: favorites.has(r.symbol),
  }));
}

export interface ValuationSmartLabels {
  zone: (s: ValuationSegment) => string;
  market: (m: string) => string;
  /** Display name of an industry (e.g. English for TW's Chinese names). */
  industry?: (v: string) => string;
  risk: (r: string) => string;
  yieldAtLeast: (pct: number) => string;
  keywords: { zone: readonly string[]; yield: readonly string[]; risk: readonly string[] };
}

/** Facets, threshold chips and sorts; default sort: nearest a range edge (plan §3.3). */
export function valuationSmartConfig(l: ValuationSmartLabels, opts: { zhuyin?: boolean; yieldChips?: boolean } = {}): ListConfig {
  return {
    // Stocks without a range get their own grey segment so the bar adds up to the result count.
    segmentOf: (it) => (it.facets.zone as string | null) ?? VALUATION_NO_RANGE,
    segments: ['below', 'within', 'above', VALUATION_NO_RANGE],
    facets: [
      { dim: 'zone', label: (v) => l.zone(v as ValuationSegment), keywords: l.keywords.zone },
      { dim: 'industry', label: (v) => l.industry?.(v) ?? v },
      { dim: 'market', label: (v) => l.market(v) },
      { dim: 'risk', label: (v) => l.risk(v), keywords: l.keywords.risk },
    ],
    thresholds: opts.yieldChips ? [{ key: 'yield', values: [3, 5], label: l.yieldAtLeast, keywords: l.keywords.yield }] : [],
    sorts: {
      edge: { key: 'edge', dir: 'asc' },
      gap: { key: 'gap', dir: 'asc' },
      yield: { key: 'yield', dir: 'desc' },
      pe: { key: 'pe', dir: 'asc' },
      recent: { key: 'recent', dir: 'desc' },
      symbol: { key: 'symbol', dir: 'asc' },
    },
    zhuyin: opts.zhuyin,
  };
}
