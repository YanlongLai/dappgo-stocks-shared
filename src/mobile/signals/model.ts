/**
 * 個股訊號 (Signals) — one model for US, TW and Options.
 *
 * Each app maps its own data.json rows to `SignalItem` with a small adapter;
 * the screen (search → overview tiles → one filter row → compact list) only
 * reads this shape. Pure logic, no React.
 */

export type SignalTone = 'bullish' | 'mildBullish' | 'neutral' | 'mildBearish' | 'bearish';
export const SIGNAL_TONES: readonly SignalTone[] = ['bullish', 'mildBullish', 'neutral', 'mildBearish', 'bearish'];

/** US/TW engine verdicts → tones. */
export const VERDICT_TONE: Readonly<Record<string, SignalTone>> = {
  BUY: 'bullish',
  HOLD: 'mildBullish',
  WATCH: 'neutral',
  AVOID: 'mildBearish',
  SELL: 'bearish',
};

export type ValuationZoneLike = 'deep_below' | 'below' | 'within' | 'above' | 'far_above';

export interface SignalItem {
  symbol: string;
  name: string;
  price: number | null;
  changePct: number | null;
  spark: number[];
  /** Engine verdict tone (US/TW). Options has none and uses `badge`. */
  tone: SignalTone | null;
  /** Previous tone when it changed today (今日變化). */
  changedFrom: SignalTone | null;
  valuationZone: ValuationZoneLike | null;
  /** Right-side badge text when the app has no verdict (Options: "CP 64.5"). */
  badge?: string | null;
  /** Free-form keys an app's extra filters can match (e.g. 'put_heavy', 'high_cp'). */
  tags?: readonly string[];
  /** Number used by the 'score' sort (Options CP, else absent). */
  score?: number | null;
  /** True when the user follows it. */
  favorite?: boolean;
}

export interface SignalsOverview {
  total: number;
  counts: Record<SignalTone, number>;
  up: number;
  down: number;
  changedToday: number;
  topMover: { symbol: string; changePct: number } | null;
  topScore: { symbol: string; score: number } | null;
}

const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

export function summarizeSignals(items: readonly SignalItem[]): SignalsOverview {
  const counts = { bullish: 0, mildBullish: 0, neutral: 0, mildBearish: 0, bearish: 0 } as Record<SignalTone, number>;
  let up = 0;
  let down = 0;
  let changedToday = 0;
  let topMover: SignalsOverview['topMover'] = null;
  let topScore: SignalsOverview['topScore'] = null;
  for (const it of items) {
    if (it.tone) counts[it.tone] += 1;
    if (it.changedFrom && it.tone && it.changedFrom !== it.tone) changedToday += 1;
    if (finite(it.changePct)) {
      if (it.changePct > 0) up += 1;
      else if (it.changePct < 0) down += 1;
      if (!topMover || Math.abs(it.changePct) > Math.abs(topMover.changePct)) topMover = { symbol: it.symbol, changePct: it.changePct };
    }
    if (finite(it.score) && (!topScore || it.score > topScore.score)) topScore = { symbol: it.symbol, score: it.score };
  }
  return { total: items.length, counts, up, down, changedToday, topMover, topScore };
}

export type SignalFilter =
  | { kind: 'all' }
  | { kind: 'tone'; tones: readonly SignalTone[] }
  | { kind: 'changed' }
  | { kind: 'favorites' }
  | { kind: 'belowRange' }
  | { kind: 'tag'; tag: string };

export type SignalSort = 'default' | 'change' | 'move' | 'symbol' | 'score';

const TONE_RANK: Record<SignalTone, number> = { bullish: 0, mildBullish: 1, neutral: 2, mildBearish: 3, bearish: 4 };

/** Search matches symbol prefix or any part of the name, ignoring case and spacing. */
export function matchesQuery(item: SignalItem, query: string): boolean {
  const q = query.trim().toLowerCase().replace(/\s+/g, '');
  if (!q) return true;
  return item.symbol.toLowerCase().startsWith(q) || item.name.toLowerCase().replace(/\s+/g, '').includes(q);
}

export function applySignalFilter(item: SignalItem, filter: SignalFilter): boolean {
  switch (filter.kind) {
    case 'all': return true;
    case 'tone': return item.tone != null && filter.tones.includes(item.tone);
    case 'changed': return !!item.changedFrom && item.changedFrom !== item.tone;
    case 'favorites': return !!item.favorite;
    case 'belowRange': return item.valuationZone === 'below' || item.valuationZone === 'deep_below';
    case 'tag': return (item.tags ?? []).includes(filter.tag);
    default: return true;
  }
}

const absMove = (v: number | null) => (finite(v) ? Math.abs(v) : -1);
const num = (v: number | null | undefined) => (finite(v) ? v : Number.NEGATIVE_INFINITY);

export function sortSignals(items: readonly SignalItem[], sort: SignalSort): SignalItem[] {
  const list = [...items];
  const bySymbol = (a: SignalItem, b: SignalItem) => a.symbol.localeCompare(b.symbol);
  switch (sort) {
    case 'change': return list.sort((a, b) => num(b.changePct) - num(a.changePct) || bySymbol(a, b));
    case 'move': return list.sort((a, b) => absMove(b.changePct) - absMove(a.changePct) || bySymbol(a, b));
    case 'symbol': return list.sort(bySymbol);
    case 'score': return list.sort((a, b) => num(b.score) - num(a.score) || bySymbol(a, b));
    default:
      // Today's changes first, then by tone (bullish → bearish), then the larger move.
      return list.sort((a, b) =>
        Number(applySignalFilter(b, { kind: 'changed' })) - Number(applySignalFilter(a, { kind: 'changed' }))
        || (a.tone ? TONE_RANK[a.tone] : 9) - (b.tone ? TONE_RANK[b.tone] : 9)
        || absMove(b.changePct) - absMove(a.changePct)
        || bySymbol(a, b));
  }
}

export function selectSignals(items: readonly SignalItem[], opts: { query?: string; filter?: SignalFilter; sort?: SignalSort } = {}): SignalItem[] {
  const filter = opts.filter ?? { kind: 'all' };
  return sortSignals(items.filter((it) => matchesQuery(it, opts.query ?? '') && applySignalFilter(it, filter)), opts.sort ?? 'default');
}

/** Counts shown on each filter chip (e.g. 「偏多 8」). */
export function filterCounts(items: readonly SignalItem[], filters: readonly SignalFilter[]): number[] {
  return filters.map((f) => items.filter((it) => applySignalFilter(it, f)).length);
}
