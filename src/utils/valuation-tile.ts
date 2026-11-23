/**
 * Model for the dashboard valuation tile (all three apps) and the TW risk
 * tile. Pure parsing of free payload fields; missing or malformed input
 * yields an `empty` model so the tile can show a quiet placeholder.
 *
 * Wording note: the tile reports where prices and ratios sit against their
 * own history. It never says cheap/expensive (see VALUATION_BANNED_TERMS).
 */

export const VALUATION_TILE_ZONES = ['deep_below', 'below', 'within', 'above', 'far_above'] as const;
export type ValuationTileZone = (typeof VALUATION_TILE_ZONES)[number];
export type ZoneCounts = Record<ValuationTileZone, number>;

/** Position of a five-year percentile: low (≤30), mid, high (≥70). */
export type PercentileBand = 'low' | 'mid' | 'high';

export interface RatioReading {
  value: number;
  /** 0 = lowest in five years, 100 = highest; null with too little history. */
  pct: number | null;
  band: PercentileBand | null;
}

export interface MarketValuationSummary {
  covered: number | null;
  total: number | null;
  zoneCounts: ZoneCounts | null;
  zoneCountsByMarket: Record<string, ZoneCounts>;
  pe: RatioReading | null;
  pb: RatioReading | null;
  dividendYield: RatioReading | null;
  /** Median P/E history values, oldest first (for a sparkline). */
  peHistory: number[];
}

export interface ValuationTileModel {
  state: 'ready' | 'empty';
  below: number;
  within: number;
  above: number;
  total: number;
  /** Share of covered stocks below their range, 0–100 (rounded). */
  belowShare: number | null;
  market: MarketValuationSummary | null;
}

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const rec = (v: unknown): Record<string, unknown> | null =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;

export function percentileBand(pct: number | null | undefined): PercentileBand | null {
  const p = num(pct);
  if (p === null) return null;
  if (p <= 30) return 'low';
  if (p >= 70) return 'high';
  return 'mid';
}

/** Zone counts with every zone present; null when nothing usable is there. */
export function parseZoneCounts(raw: unknown): ZoneCounts | null {
  const r = rec(raw);
  if (!r) return null;
  let any = false;
  const out = {} as ZoneCounts;
  for (const zone of VALUATION_TILE_ZONES) {
    const v = num(r[zone]);
    if (v !== null && v >= 0) any = true;
    out[zone] = v !== null && v >= 0 ? Math.round(v) : 0;
  }
  return any ? out : null;
}

function reading(value: unknown, pct: unknown): RatioReading | null {
  const v = num(value);
  if (v === null || v <= 0) return null;
  const p = num(pct);
  const clamped = p === null ? null : Math.max(0, Math.min(100, p));
  return { value: v, pct: clamped, band: percentileBand(clamped) };
}

/** Parse `valuation_summary.market` (TW `dappgo_tw_market_v1`). */
export function parseMarketValuationSummary(raw: unknown): MarketValuationSummary | null {
  const r = rec(raw);
  if (!r) return null;
  const byMarket: Record<string, ZoneCounts> = {};
  for (const [key, value] of Object.entries(rec(r.zone_counts_by_market) ?? {})) {
    const counts = parseZoneCounts(value);
    if (counts) byMarket[key] = counts;
  }
  const history = Array.isArray(r.pe_median_history)
    ? (r.pe_median_history as unknown[])
        .map((p) => num(rec(p)?.value))
        .filter((v): v is number => v !== null && v > 0)
    : [];
  const out: MarketValuationSummary = {
    covered: num(r.covered),
    total: num(r.total),
    zoneCounts: parseZoneCounts(r.zone_counts),
    zoneCountsByMarket: byMarket,
    pe: reading(r.pe_median, r.pe_median_pct),
    pb: reading(r.pb_median, r.pb_median_pct),
    dividendYield: reading(r.dividend_yield_median, r.dividend_yield_median_pct),
    peHistory: history,
  };
  const hasAny = out.zoneCounts || out.pe || out.pb || out.dividendYield;
  return hasAny ? out : null;
}

/**
 * Build the tile from the free `valuation_summary` ({zone_counts, market?}).
 * Market-wide counts (TW) win over the report-universe counts when present.
 */
export function buildValuationTile(summary: unknown): ValuationTileModel {
  const r = rec(summary);
  const market = parseMarketValuationSummary(r?.market);
  const counts = market?.zoneCounts ?? parseZoneCounts(r?.zone_counts);
  const empty: ValuationTileModel = { state: 'empty', below: 0, within: 0, above: 0, total: 0, belowShare: null, market };
  if (!counts) return market ? { ...empty, state: 'ready' } : empty;
  const below = counts.deep_below + counts.below;
  const above = counts.above + counts.far_above;
  const total = below + counts.within + above;
  if (total <= 0) return market ? { ...empty, state: 'ready' } : empty;
  return {
    state: 'ready',
    below,
    within: counts.within,
    above,
    total,
    belowShare: Math.round((below / total) * 100),
    market,
  };
}

// --- TW risk notices (disposition / attention lists) ----------------------

export interface RiskNoticeItem {
  code: string;
  name: string;
  market: string | null;
  /** Disposition end date (ISO) or attention date. */
  until: string | null;
  inUniverse: boolean;
}

export interface RiskNotices {
  asOf: string | null;
  disposition: number;
  attention: number;
  dispositionItems: RiskNoticeItem[];
  attentionItems: RiskNoticeItem[];
}

const ORDINARY_SHARE = /^\d{4}[A-Z]?$/;

function items(raw: unknown, untilKey: 'end' | 'date'): RiskNoticeItem[] {
  if (!Array.isArray(raw)) return [];
  const out: RiskNoticeItem[] = [];
  const seen = new Set<string>();
  for (const value of raw) {
    const r = rec(value);
    const code = typeof r?.code === 'string' ? r.code.trim() : '';
    if (!code || seen.has(code)) continue;
    const kind = typeof r?.kind === 'string' ? r.kind : null;
    if (kind ? kind !== 'stock' : !ORDINARY_SHARE.test(code)) continue;
    seen.add(code);
    out.push({
      code,
      name: typeof r?.name === 'string' ? r.name : code,
      market: typeof r?.market === 'string' ? r.market : null,
      until: typeof r?.[untilKey] === 'string' ? (r[untilKey] as string) : null,
      inUniverse: r?.in_universe === true,
    });
  }
  return out;
}

/** Parse `risk_notices`; null when absent or unusable. */
export function parseRiskNotices(raw: unknown): RiskNotices | null {
  const r = rec(raw);
  if (!r) return null;
  const counts = rec(r.counts);
  const dispositionItems = items(r.disposition, 'end');
  const attentionItems = items(r.attention, 'date');
  const disposition = num(counts?.disposition) ?? dispositionItems.length;
  const attention = num(counts?.attention) ?? attentionItems.length;
  if (!counts && dispositionItems.length === 0 && attentionItems.length === 0) return null;
  return {
    asOf: typeof r.as_of_date === 'string' ? r.as_of_date : null,
    disposition: Math.max(0, Math.round(disposition)),
    attention: Math.max(0, Math.round(attention)),
    // Stocks the app covers first, then by code.
    dispositionItems: dispositionItems.sort((a, b) => Number(b.inUniverse) - Number(a.inUniverse) || a.code.localeCompare(b.code)),
    attentionItems: attentionItems.sort((a, b) => Number(b.inUniverse) - Number(a.inUniverse) || a.code.localeCompare(b.code)),
  };
}
