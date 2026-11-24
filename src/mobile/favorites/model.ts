/**
 * 我的最愛 view model — one shape for US, TW and Options.
 *
 * Each app maps its own data.json rows to `FavoriteInput`; this module adds
 * the user's own record (days held, change since added) and today's
 * "since last visit" events, and sorts so the stocks that changed come first.
 * Pure logic, no React or storage.
 */
import { changeSinceAdded, type FavoriteEvent, type FavoriteEventKind } from './history';

export type FavoriteTone = 'bullish' | 'mildBullish' | 'neutral' | 'mildBearish' | 'bearish';
export type FavoriteZone = 'deep_below' | 'below' | 'within' | 'above' | 'far_above';

export interface FavoriteInput {
  symbol: string;
  name: string;
  price: number | null;
  /** Today's change in percent. */
  changePct: number | null;
  addedAt: string | null;
  priceAtAdd: number | null;
  tone: FavoriteTone | null;
  zone: FavoriteZone | null;
  /** TW 處置 / 注意. */
  risk: 'disposition' | 'attention' | null;
  /** Put/call ratio (volume when published, else open interest). */
  pcRatio: number | null;
  newsCount: number;
  headline: string | null;
}

export interface FavoriteView extends FavoriteInput {
  sinceAddedPct: number | null;
  daysHeld: number | null;
  /** Today's events for this stock, most consequential first. */
  events: FavoriteEvent[];
}

export type FavoriteSort = 'changed' | 'sinceAdded' | 'today' | 'symbol';
export const FAVORITE_SORTS: readonly FavoriteSort[] = ['changed', 'sinceAdded', 'today', 'symbol'];

/** Put/call above this reads as put-heavy, below the second as call-heavy. */
export const PC_HEAVY = { put: 1.1, call: 0.9 } as const;

export function pcHeaviness(ratio: number | null | undefined): 'put' | 'call' | null {
  if (typeof ratio !== 'number' || !Number.isFinite(ratio)) return null;
  if (ratio >= PC_HEAVY.put) return 'put';
  if (ratio <= PC_HEAVY.call) return 'call';
  return null;
}

/** Whole calendar days since the favorite was added (0 on the day itself). */
export function daysHeld(addedAt: string | null | undefined, now: Date): number | null {
  if (!addedAt) return null;
  const t = Date.parse(addedAt);
  if (!Number.isFinite(t)) return null;
  const day = (ms: number) => Math.floor(ms / 86_400_000);
  return Math.max(0, day(now.getTime()) - day(t));
}

const KIND_RANK: Record<FavoriteEventKind, number> = { signal: 0, valuation: 1, risk: 2, pcFlag: 3, bigMove: 4 };

export function buildFavoriteViews(inputs: readonly FavoriteInput[], events: readonly FavoriteEvent[], now: Date): FavoriteView[] {
  const bySymbol = new Map<string, FavoriteEvent[]>();
  for (const event of events) {
    const list = bySymbol.get(event.symbol);
    if (list) list.push(event);
    else bySymbol.set(event.symbol, [event]);
  }
  return inputs.map((input) => ({
    ...input,
    sinceAddedPct: changeSinceAdded(input.priceAtAdd, input.price),
    daysHeld: daysHeld(input.addedAt, now),
    events: (bySymbol.get(input.symbol) ?? []).slice().sort((a, b) => KIND_RANK[a.kind] - KIND_RANK[b.kind]),
  }));
}

const abs = (v: number | null) => (v === null ? -1 : Math.abs(v));
function bySymbol(a: FavoriteView, b: FavoriteView) {
  return a.symbol.localeCompare(b.symbol, 'en', { numeric: true });
}

/**
 * 最近有變化 (default): stocks with an event first (by their top event), then
 * by today's move size. 加入後漲跌: best first, unknown last. 今日漲跌: biggest
 * move first. 代號: A→Z.
 */
export function sortFavorites(items: readonly FavoriteView[], sort: FavoriteSort = 'changed'): FavoriteView[] {
  const out = [...items];
  switch (sort) {
    case 'sinceAdded':
      return out.sort((a, b) => {
        if (a.sinceAddedPct === null && b.sinceAddedPct === null) return bySymbol(a, b);
        if (a.sinceAddedPct === null) return 1;
        if (b.sinceAddedPct === null) return -1;
        return b.sinceAddedPct - a.sinceAddedPct || bySymbol(a, b);
      });
    case 'today':
      return out.sort((a, b) => abs(b.changePct) - abs(a.changePct) || bySymbol(a, b));
    case 'symbol':
      return out.sort(bySymbol);
    default:
      return out.sort((a, b) => {
        const ra = a.events.length ? KIND_RANK[a.events[0].kind] : 99;
        const rb = b.events.length ? KIND_RANK[b.events[0].kind] : 99;
        return ra - rb || abs(b.changePct) - abs(a.changePct) || bySymbol(a, b);
      });
  }
}

/** Snapshot to compare against on the next visit. */
export function visitSnapshot(items: readonly FavoriteInput[]): Record<string, { tone: string | null; zone: string | null; risk: string | null; pcFlag: string | null; price: number | null }> {
  const out: Record<string, { tone: string | null; zone: string | null; risk: string | null; pcFlag: string | null; price: number | null }> = {};
  for (const item of items) {
    out[item.symbol] = { tone: item.tone, zone: item.zone, risk: item.risk, pcFlag: pcHeaviness(item.pcRatio), price: item.price };
  }
  return out;
}

/** Today's side of `sinceLastVisit`. */
export function todayEntries(items: readonly FavoriteInput[]): Record<string, { tone: string | null; zone: string | null; risk: string | null; pcFlag: string | null; price: number | null; changePct: number | null }> {
  const snap = visitSnapshot(items);
  const out: Record<string, { tone: string | null; zone: string | null; risk: string | null; pcFlag: string | null; price: number | null; changePct: number | null }> = {};
  for (const item of items) out[item.symbol] = { ...snap[item.symbol], changePct: item.changePct };
  return out;
}
