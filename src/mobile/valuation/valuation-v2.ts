/**
 * Types and pure helpers for the valuation v2 subscription payload
 * (`/v1/markets/<market>/valuation/v2/index.json` and `<SYMBOL>.json`).
 * The range is research context: never a price target or a recommendation.
 */
export const VALUATION_ZONES = ['deep_below', 'below', 'within', 'above', 'far_above'] as const;
export type ValuationZone = (typeof VALUATION_ZONES)[number];
export type ValuationConfidence = 'high' | 'medium' | 'low';
export type ValuationConditionId = 'below_range' | 'growing' | 'trend_intact' | 'data_confidence';

export interface ValuationRange { low: number; base: number; high: number }
export interface ValuationCondition { id: ValuationConditionId; met: boolean }
export interface ValuationFacts {
  gap_pct: number | null;
  revenue_yoy_pct: number | null;
  net_income_yoy_pct: number | null;
  earnings_surprise_pct: number | null;
  above_ma_200: boolean | null;
  ma_200_rising: boolean | null;
  anchor_count: number;
}
export interface ValuationIndexEntry {
  symbol: string;
  name: string;
  sector: string;
  status: 'ok' | 'insufficient_data' | 'not_applicable';
  current_price: number | null;
  range: ValuationRange | null;
  zone: ValuationZone | null;
  gap_pct: number | null;
  confidence: ValuationConfidence;
  zone_since: string | null;
  score: number | null;
  score_parts: Record<string, number> | null;
  conditions: ValuationCondition[];
  conditions_met: number;
  facts: ValuationFacts | null;
  warnings: string[];
}
export interface ValuationIndex {
  generatedAtUtc: string | null;
  asOfDate: string | null;
  modelVersion: string | null;
  entries: ValuationIndexEntry[];
}
export interface ValuationHistoryPoint { date: string; price: number; low: number; base: number; high: number; zone: ValuationZone }
export interface ValuationAnchor {
  name: string; weight: number; low: number; base: number; high: number;
  multiple: Record<string, number | null>; per_share: number; samples: number;
}
export interface ValuationEarningsQuarter {
  period_end: string; filed: string; revenue: number | null; net_income: number | null; eps_diluted: number | null;
  revenue_yoy_pct: number | null; net_income_yoy_pct: number | null;
}
export interface ValuationDetail extends ValuationIndexEntry {
  as_of_date: string | null;
  anchors: ValuationAnchor[];
  range_history: ValuationHistoryPoint[];
  multiples: {
    current: Record<string, number>;
    history: Array<{ date: string } & Record<string, number | string>>;
    peers: Array<{ symbol: string } & Record<string, number | string>>;
  };
  earnings_timeline: ValuationEarningsQuarter[];
  earnings_date_next: string | null;
}

const SYMBOL = /^[A-Z0-9][A-Z0-9.-]{0,9}$/;
const finite = (value: unknown): number | null => (typeof value === 'number' && Number.isFinite(value) ? value : null);
const text = (value: unknown): string | null => (typeof value === 'string' && value ? value : null);
const record = (value: unknown): Record<string, unknown> | null =>
  (value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null);

export function isValuationZone(value: unknown): value is ValuationZone {
  return typeof value === 'string' && (VALUATION_ZONES as readonly string[]).includes(value);
}
export function isBelowRange(zone: ValuationZone | null | undefined): boolean {
  return zone === 'below' || zone === 'deep_below';
}

function parseRange(value: unknown): ValuationRange | null {
  const raw = record(value);
  const low = finite(raw?.low); const base = finite(raw?.base); const high = finite(raw?.high);
  return low !== null && base !== null && high !== null && low > 0 && low < base && base < high ? { low, base, high } : null;
}

function parseEntry(symbol: string, value: unknown): ValuationIndexEntry | null {
  const raw = record(value);
  if (!raw || !SYMBOL.test(symbol)) return null;
  const range = parseRange(raw.range);
  const zone = isValuationZone(raw.zone) ? raw.zone : null;
  const usable = raw.status === 'ok' && range !== null && zone !== null && finite(raw.current_price) !== null;
  const facts = record(raw.facts);
  const flag = (item: unknown) => (typeof item === 'boolean' ? item : null);
  return {
    symbol,
    name: text(raw.name) ?? symbol,
    sector: text(raw.sector) ?? '',
    // A file that claims "ok" without a usable range is shown as having no range.
    status: usable ? 'ok' : raw.status === 'not_applicable' ? 'not_applicable' : 'insufficient_data',
    current_price: finite(raw.current_price),
    range: usable ? range : null,
    zone: usable ? zone : null,
    gap_pct: usable ? finite(raw.gap_pct) : null,
    confidence: raw.confidence === 'high' || raw.confidence === 'medium' ? raw.confidence : 'low',
    zone_since: text(raw.zone_since),
    score: usable ? finite(raw.score) : null,
    score_parts: usable && record(raw.score_parts)
      ? Object.fromEntries(Object.entries(record(raw.score_parts)!).filter(([, part]) => finite(part) !== null)) as Record<string, number>
      : null,
    conditions: Array.isArray(raw.conditions)
      ? raw.conditions.flatMap(item => {
        const condition = record(item);
        return condition && typeof condition.id === 'string' && typeof condition.met === 'boolean'
          ? [{ id: condition.id as ValuationConditionId, met: condition.met }] : [];
      })
      : [],
    conditions_met: finite(raw.conditions_met) ?? 0,
    facts: facts ? {
      gap_pct: finite(facts.gap_pct), revenue_yoy_pct: finite(facts.revenue_yoy_pct),
      net_income_yoy_pct: finite(facts.net_income_yoy_pct), earnings_surprise_pct: finite(facts.earnings_surprise_pct),
      above_ma_200: flag(facts.above_ma_200), ma_200_rising: flag(facts.ma_200_rising), anchor_count: finite(facts.anchor_count) ?? 0,
    } : null,
    warnings: Array.isArray(raw.warnings) ? raw.warnings.filter((item): item is string => typeof item === 'string') : [],
  };
}

export function parseValuationIndex(raw: unknown): ValuationIndex | null {
  const document = record(raw);
  const symbols = record(document?.symbols);
  if (!document || !symbols) return null;
  return {
    generatedAtUtc: text(document.generated_at_utc),
    asOfDate: text(document.as_of_date),
    modelVersion: text(document.model_version),
    entries: Object.entries(symbols).flatMap(([symbol, value]) => {
      const entry = parseEntry(symbol, value);
      return entry ? [entry] : [];
    }),
  };
}

export function parseValuationDetail(raw: unknown): ValuationDetail | null {
  const document = record(raw);
  const symbol = text(document?.symbol);
  const entry = document && symbol ? parseEntry(symbol, document) : null;
  if (!document || !entry) return null;
  const list = (value: unknown) => (Array.isArray(value) ? value.flatMap(item => (record(item) ? [record(item)!] : [])) : []);
  const multiples = record(document.multiples);
  return {
    ...entry,
    as_of_date: text(document.as_of_date),
    anchors: list(document.anchors).flatMap(item => {
      const low = finite(item.low); const base = finite(item.base); const high = finite(item.high);
      if (typeof item.name !== 'string' || low === null || base === null || high === null) return [];
      return [{
        name: item.name, weight: finite(item.weight) ?? 0, low, base, high,
        multiple: Object.fromEntries(Object.entries(record(item.multiple) ?? {}).map(([key, value]) => [key, finite(value)])),
        per_share: finite(item.per_share) ?? 0, samples: finite(item.samples) ?? 0,
      }];
    }),
    range_history: list(document.range_history).flatMap(item => {
      const range = parseRange(item); const price = finite(item.price);
      return typeof item.date === 'string' && range && price !== null && isValuationZone(item.zone)
        ? [{ date: item.date, price, ...range, zone: item.zone }] : [];
    }),
    multiples: {
      current: Object.fromEntries(Object.entries(record(multiples?.current) ?? {}).filter(([, value]) => finite(value) !== null)) as Record<string, number>,
      history: list(multiples?.history).filter(item => typeof item.date === 'string') as ValuationDetail['multiples']['history'],
      peers: list(multiples?.peers).filter(item => typeof item.symbol === 'string') as ValuationDetail['multiples']['peers'],
    },
    earnings_timeline: list(document.earnings_timeline).flatMap(item => (typeof item.period_end === 'string' && typeof item.filed === 'string' ? [{
      period_end: item.period_end, filed: item.filed, revenue: finite(item.revenue), net_income: finite(item.net_income),
      eps_diluted: finite(item.eps_diluted), revenue_yoy_pct: finite(item.revenue_yoy_pct), net_income_yoy_pct: finite(item.net_income_yoy_pct),
    }] : [])),
    earnings_date_next: text(document.earnings_date_next),
  };
}

export type ValuationSort = 'score' | 'gap' | 'recent';
export interface ValuationFilter { sector?: string | null; zones?: readonly ValuationZone[] | null; symbols?: readonly string[] | null; sort?: ValuationSort }

/** Stocks with a range, ordered for the hub. Ties fall back to the symbol so the order is stable. */
export function rankValuations(index: ValuationIndex, filter: ValuationFilter = {}): ValuationIndexEntry[] {
  const wanted = filter.symbols ? new Set(filter.symbols) : null;
  const rows = index.entries.filter(entry => entry.status === 'ok'
    && (!filter.sector || entry.sector === filter.sector)
    && (!filter.zones?.length || (entry.zone !== null && filter.zones.includes(entry.zone)))
    && (!wanted || wanted.has(entry.symbol)));
  const key: Record<ValuationSort, (entry: ValuationIndexEntry) => number | string> = {
    score: entry => -(entry.score ?? 0),
    gap: entry => entry.gap_pct ?? 0,
    recent: entry => entry.zone_since ?? '',
  };
  const sort = filter.sort ?? 'score';
  return [...rows].sort((a, b) => {
    const left = key[sort](a); const right = key[sort](b);
    const order = sort === 'recent' ? (left === right ? 0 : left < right ? 1 : -1) : (left as number) - (right as number);
    return order || a.symbol.localeCompare(b.symbol);
  });
}

export function zoneCounts(index: ValuationIndex): Record<ValuationZone, number> {
  const counts = Object.fromEntries(VALUATION_ZONES.map(zone => [zone, 0])) as Record<ValuationZone, number>;
  for (const entry of index.entries) if (entry.status === 'ok' && entry.zone) counts[entry.zone] += 1;
  return counts;
}

export type ValuationAlertCondition = 'enter_below' | 'enter_deep_below' | 'return_within' | 'gap_below';
export interface ValuationTracking {
  /** Zone the user last saw (or was notified of); null before the first check. */
  lastZone: ValuationZone | null;
  conditions: readonly ValuationAlertCondition[];
  /** For `gap_below`: notify when the gap to the median is at or under this (for example -15). */
  gapThresholdPct?: number | null;
  lastGapPct?: number | null;
}
export interface ValuationAlert { symbol: string; condition: ValuationAlertCondition; from: ValuationZone | null; to: ValuationZone; gapPct: number | null }

/**
 * Alerts for tracked stocks whose zone crossed since the last check. The first
 * check of a stock only records its zone: nothing fires without a crossing.
 */
export function detectValuationAlerts(tracking: Readonly<Record<string, ValuationTracking>>, index: ValuationIndex): ValuationAlert[] {
  const alerts: ValuationAlert[] = [];
  for (const entry of index.entries) {
    const tracked = tracking[entry.symbol];
    if (!tracked || entry.status !== 'ok' || !entry.zone) continue;
    const from = tracked.lastZone; const to = entry.zone;
    const fire = (condition: ValuationAlertCondition) => {
      if (tracked.conditions.includes(condition)) alerts.push({ symbol: entry.symbol, condition, from, to, gapPct: entry.gap_pct });
    };
    if (from !== null && from !== to) {
      if (to === 'deep_below') fire('enter_deep_below');
      if (isBelowRange(to) && !isBelowRange(from)) fire('enter_below');
      if (to === 'within') fire('return_within');
    }
    const threshold = tracked.gapThresholdPct; const gap = entry.gap_pct; const before = tracked.lastGapPct;
    if (typeof threshold === 'number' && gap !== null && typeof before === 'number' && gap <= threshold && before > threshold) fire('gap_below');
  }
  return alerts;
}

/**
 * Wording the valuation page must not use in any locale: it reads as personal
 * advice. Apps test their own strings and engine text against this list.
 */
export const VALUATION_BANNED_TERMS: readonly RegExp[] = [
  /\bbuy\b/i, /\bsell\b/i, /\bundervalued\b/i, /\bovervalued\b/i, /\btarget price\b/i, /\bprice target\b/i, /\bupside\b/i,
  /\brecommend(?:ed|ation|s)?\b/i, /\bguarantee/i,
  /買進|買入|賣出|值得買|目標價|被低估|被高估|推薦|保證獲利|最佳買點/,
  /买进|买入|卖出|值得买|目标价|被低估|被高估|推荐|保证/,
  /買い時|売り時|買い推奨|割安|割高|目標株価/, /매수|매도|목표주가|저평가|고평가|추천/,
  /\bkaufen\b|\bverkaufen\b|\bkursziel\b|\bunterbewertet\b|\büberbewertet\b/i,
  /\bacheter\b|\bvendre\b|\bsous-évalué|\bsurévalué|\bobjectif de cours\b/i,
  /\bcomprar\b|\bvender\b|\binfravalorad|\bsobrevalorad|\bprecio objetivo\b|\bsubvalorizad|\bsobrevalorizad|\bpreço-alvo\b/i,
];
export function findBannedValuationTerm(value: string): string | null {
  for (const pattern of VALUATION_BANNED_TERMS) {
    const match = pattern.exec(value);
    if (match) return match[0];
  }
  return null;
}
