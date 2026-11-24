/**
 * 我的最愛 — the user's own record, kept on the device only.
 *
 * v3 adds to each favorite the price when it was added, and keeps one
 * "last visit" snapshot plus a short "recently viewed" list. Nothing here
 * leaves the device; "delete my data" clears it with the favorites.
 * Pure logic, no storage or React.
 */

export interface FavoriteRecord {
  symbol: string;
  addedAt: string;
  /** Close when added; null for old favorites beyond the backfill window. */
  priceAtAdd: number | null;
}

export interface VisitSnapshotEntry {
  tone?: string | null;
  zone?: string | null;
  risk?: string | null;
  pcFlag?: string | null;
  price?: number | null;
}

export interface FavoritesHistory {
  version: 3;
  lastVisit: { at: string; snapshot: Record<string, VisitSnapshotEntry> } | null;
  recent: { symbol: string; viewedAt: string }[];
}

export const EMPTY_HISTORY: FavoritesHistory = { version: 3, lastVisit: null, recent: [] };
export const RECENT_LIMIT = 20;
export const RECENT_DAYS = 30;
/** Single-day move that counts as an event. */
export const BIG_MOVE_PCT = 5;

const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/**
 * Price on or just before the day a favorite was added, from the daily
 * history the payload carries (≈60 trading days). Beyond it: null (shown 「—」).
 */
export function backfillPriceAtAdd(addedAt: string, history: readonly { date: string; close: number }[] | null | undefined): number | null {
  const day = addedAt.slice(0, 10);
  const bars = (history ?? []).filter((b) => typeof b?.date === 'string' && finite(b.close)).sort((a, b) => a.date.localeCompare(b.date));
  if (bars.length === 0 || day < bars[0].date.slice(0, 10)) return null;
  let price: number | null = null;
  for (const b of bars) {
    if (b.date.slice(0, 10) <= day) price = b.close;
    else break;
  }
  return price;
}

/** Change since the favorite was added, in percent. */
export function changeSinceAdded(priceAtAdd: number | null | undefined, price: number | null | undefined): number | null {
  return finite(priceAtAdd) && priceAtAdd > 0 && finite(price) ? (price / priceAtAdd - 1) * 100 : null;
}

export function recordView(history: FavoritesHistory, symbol: string, now: Date): FavoritesHistory {
  const cutoff = new Date(now.getTime() - RECENT_DAYS * 86_400_000).toISOString();
  const recent = [{ symbol, viewedAt: now.toISOString() }, ...history.recent.filter((r) => r.symbol !== symbol && r.viewedAt >= cutoff)].slice(0, RECENT_LIMIT);
  return { ...history, recent };
}

export function recordVisit(history: FavoritesHistory, snapshot: Record<string, VisitSnapshotEntry>, now: Date): FavoritesHistory {
  return { ...history, lastVisit: { at: now.toISOString(), snapshot } };
}

/** Parse whatever is stored (older shapes, corrupt JSON) into v3. */
export function migrateHistory(raw: unknown): FavoritesHistory {
  const r = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : null;
  if (!r) return EMPTY_HISTORY;
  const lastVisit = r.lastVisit && typeof r.lastVisit === 'object' && typeof (r.lastVisit as { at?: unknown }).at === 'string'
    ? (r.lastVisit as FavoritesHistory['lastVisit'])
    : null;
  const recent = Array.isArray(r.recent)
    ? (r.recent as unknown[]).filter((x): x is { symbol: string; viewedAt: string } =>
      !!x && typeof (x as { symbol?: unknown }).symbol === 'string' && typeof (x as { viewedAt?: unknown }).viewedAt === 'string').slice(0, RECENT_LIMIT)
    : [];
  return { version: 3, lastVisit, recent };
}

export type FavoriteEventKind = 'signal' | 'valuation' | 'risk' | 'pcFlag' | 'bigMove';
export interface FavoriteEvent {
  symbol: string;
  kind: FavoriteEventKind;
  from: string | number | null;
  to: string | number | null;
}

/** Order in which events surface: the most consequential first. */
const KIND_RANK: Record<FavoriteEventKind, number> = { signal: 0, valuation: 1, risk: 2, pcFlag: 3, bigMove: 4 };

/**
 * What changed for the user's favorites since the last visit. A stock with no
 * earlier snapshot only reports a big move (nothing to compare yet).
 */
export function sinceLastVisit(
  favorites: readonly string[],
  last: FavoritesHistory['lastVisit'],
  today: Record<string, VisitSnapshotEntry & { changePct?: number | null }>,
): FavoriteEvent[] {
  const events: FavoriteEvent[] = [];
  for (const symbol of favorites) {
    const now = today[symbol];
    if (!now) continue;
    const before = last?.snapshot?.[symbol];
    if (before) {
      if (before.tone && now.tone && before.tone !== now.tone) events.push({ symbol, kind: 'signal', from: before.tone, to: now.tone });
      if (before.zone && now.zone && before.zone !== now.zone) events.push({ symbol, kind: 'valuation', from: before.zone, to: now.zone });
      if ((now.risk ?? null) !== (before.risk ?? null) && now.risk) events.push({ symbol, kind: 'risk', from: before.risk ?? null, to: now.risk });
      if (now.pcFlag && now.pcFlag !== (before.pcFlag ?? null)) events.push({ symbol, kind: 'pcFlag', from: before.pcFlag ?? null, to: now.pcFlag });
    }
    if (finite(now.changePct) && Math.abs(now.changePct) >= BIG_MOVE_PCT) events.push({ symbol, kind: 'bigMove', from: null, to: now.changePct });
  }
  return events.sort((a, b) => KIND_RANK[a.kind] - KIND_RANK[b.kind] || a.symbol.localeCompare(b.symbol));
}
