/**
 * Personalization that stays on the phone (1.12.0 plan §3.5). Pure state
 * functions; each app persists the state under its own key, so the three
 * apps never share it. Nothing here is uploaded or used for ads.
 *
 * - searches and filters: recent + frequency, for 「最近搜尋」 and suggestion order;
 * - saved filters: 「我的篩選」, named, one tap to apply;
 * - views: per-stock popularity with a 14-day half-life;
 * - list state: last filter and scroll offset per list;
 * - add-to-favorites hint: 3+ views in 7 days, shown once, never again after dismiss.
 * Each category keeps at most 200 entries (oldest out).
 */

export const PERSONALIZATION_LIMIT = 200;
export const VIEW_HALF_LIFE_DAYS = 14;
export const SUGGEST_FAVORITE_VIEWS = 3;
export const SUGGEST_FAVORITE_WINDOW_DAYS = 7;
const DAY = 86_400_000;
/** View times kept per stock: enough for the 7-day rule and a stable score. */
const VIEW_TIMES_KEPT = 20;

export interface UsageEntry { key: string; count: number; last: number }
export interface SavedFilter<F = unknown> { id: string; name: string; filter: F; createdAt: number }
export interface ViewEntry { symbol: string; times: number[] }
export interface ListState<F = unknown> { filter: F; offset: number; at: number }

export interface PersonalizationState<F = unknown> {
  version: 1;
  enabled: boolean;
  searches: UsageEntry[];
  filters: UsageEntry[];
  saved: SavedFilter<F>[];
  views: ViewEntry[];
  lists: Record<string, ListState<F>>;
  /** Stocks whose add-to-favorites hint was shown (or dismissed): never shown again. */
  hinted: string[];
}

export function emptyPersonalization<F = unknown>(enabled = true): PersonalizationState<F> {
  return { version: 1, enabled, searches: [], filters: [], saved: [], views: [], lists: {}, hinted: [] };
}

/** Accept whatever was persisted; anything malformed falls back to empty pieces. */
export function migratePersonalization<F = unknown>(raw: unknown): PersonalizationState<F> {
  const base = emptyPersonalization<F>();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<PersonalizationState<F>>;
  const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
  return {
    version: 1,
    enabled: r.enabled !== false,
    searches: arr<UsageEntry>(r.searches).filter((e) => e && typeof e.key === 'string').slice(-PERSONALIZATION_LIMIT),
    filters: arr<UsageEntry>(r.filters).filter((e) => e && typeof e.key === 'string').slice(-PERSONALIZATION_LIMIT),
    saved: arr<SavedFilter<F>>(r.saved).filter((e) => e && typeof e.id === 'string').slice(-PERSONALIZATION_LIMIT),
    views: arr<ViewEntry>(r.views).filter((e) => e && typeof e.symbol === 'string' && Array.isArray(e.times)).slice(-PERSONALIZATION_LIMIT),
    lists: r.lists && typeof r.lists === 'object' ? (r.lists as Record<string, ListState<F>>) : {},
    hinted: arr<string>(r.hinted).filter((s) => typeof s === 'string').slice(-PERSONALIZATION_LIMIT),
  };
}

/** Keep the newest `limit` by `last`. */
function cap<T>(list: T[], last: (t: T) => number, limit = PERSONALIZATION_LIMIT): T[] {
  if (list.length <= limit) return list;
  return [...list].sort((a, b) => last(b) - last(a)).slice(0, limit);
}

function bump(list: UsageEntry[], key: string, now: number): UsageEntry[] {
  const k = key.trim();
  if (!k) return list;
  const hit = list.find((e) => e.key === k);
  const next = hit ? list.map((e) => (e === hit ? { key: k, count: e.count + 1, last: now } : e)) : [...list, { key: k, count: 1, last: now }];
  return cap(next, (e) => e.last);
}

export function recordSearch<F>(s: PersonalizationState<F>, term: string, now = Date.now()): PersonalizationState<F> {
  return s.enabled ? { ...s, searches: bump(s.searches, term, now) } : s;
}

export function recordFilterUse<F>(s: PersonalizationState<F>, filterKey: string, now = Date.now()): PersonalizationState<F> {
  return s.enabled ? { ...s, filters: bump(s.filters, filterKey, now) } : s;
}

/** Newest first. */
export function recentSearches(s: PersonalizationState, limit = 5): string[] {
  return [...s.searches].sort((a, b) => b.last - a.last).slice(0, limit).map((e) => e.key);
}

/**
 * Order for suggestions: the user's own frequency, with recent use counting
 * more (14-day half-life), so a habit outweighs a one-off.
 */
export function usageScore(e: UsageEntry | undefined, now = Date.now()): number {
  if (!e) return 0;
  return e.count * Math.pow(0.5, (now - e.last) / (VIEW_HALF_LIFE_DAYS * DAY));
}

/** The user's most used filter keys (for the 3 「常用條件」 before typing). */
export function topFilters(s: PersonalizationState, limit = 3, now = Date.now()): string[] {
  return [...s.filters].sort((a, b) => usageScore(b, now) - usageScore(a, now)).slice(0, limit).map((e) => e.key);
}

export function saveFilter<F>(s: PersonalizationState<F>, name: string, filter: F, now = Date.now()): PersonalizationState<F> {
  const n = name.trim().slice(0, 40);
  if (!n || !s.enabled) return s;
  const saved = [...s.saved.filter((x) => x.name !== n), { id: `${now.toString(36)}-${s.saved.length}`, name: n, filter, createdAt: now }];
  return { ...s, saved: cap(saved, (x) => x.createdAt) };
}

export function deleteSavedFilter<F>(s: PersonalizationState<F>, id: string): PersonalizationState<F> {
  return { ...s, saved: s.saved.filter((x) => x.id !== id) };
}

export function recordView<F>(s: PersonalizationState<F>, symbol: string, now = Date.now()): PersonalizationState<F> {
  if (!s.enabled || !symbol) return s;
  const hit = s.views.find((v) => v.symbol === symbol);
  const views = hit
    ? s.views.map((v) => (v === hit ? { symbol, times: [...v.times, now].slice(-VIEW_TIMES_KEPT) } : v))
    : [...s.views, { symbol, times: [now] }];
  return { ...s, views: cap(views, (v) => v.times[v.times.length - 1] ?? 0) };
}

/** Popularity: each view counts 1, halving every 14 days. */
export function viewScore(v: ViewEntry | undefined, now = Date.now()): number {
  if (!v) return 0;
  return v.times.reduce((sum, t) => sum + Math.pow(0.5, Math.max(0, now - t) / (VIEW_HALF_LIFE_DAYS * DAY)), 0);
}

export function topViewed(s: PersonalizationState, limit = 10, now = Date.now()): string[] {
  return [...s.views]
    .map((v) => ({ symbol: v.symbol, score: viewScore(v, now) }))
    .filter((x) => x.score > 0.05)
    .sort((a, b) => b.score - a.score || a.symbol.localeCompare(b.symbol))
    .slice(0, limit)
    .map((x) => x.symbol);
}

export function setListState<F>(s: PersonalizationState<F>, listId: string, filter: F, offset: number, now = Date.now()): PersonalizationState<F> {
  if (!s.enabled) return s;
  const lists = { ...s.lists, [listId]: { filter, offset: Math.max(0, Math.round(offset)), at: now } };
  const keys = Object.keys(lists);
  if (keys.length > PERSONALIZATION_LIMIT) {
    const oldest = keys.sort((a, b) => lists[a].at - lists[b].at)[0];
    delete lists[oldest];
  }
  return { ...s, lists };
}

export function getListState<F>(s: PersonalizationState<F>, listId: string): ListState<F> | null {
  return s.enabled ? s.lists[listId] ?? null : null;
}

/** 「加入自選？」: 3+ views in the last 7 days, not a favorite, never hinted before. */
export function shouldSuggestFavorite(s: PersonalizationState, symbol: string, favorites: ReadonlySet<string>, now = Date.now()): boolean {
  if (!s.enabled || favorites.has(symbol) || s.hinted.includes(symbol)) return false;
  const v = s.views.find((x) => x.symbol === symbol);
  const recent = (v?.times ?? []).filter((t) => now - t <= SUGGEST_FAVORITE_WINDOW_DAYS * DAY).length;
  return recent >= SUGGEST_FAVORITE_VIEWS;
}

/** The hint was shown (or dismissed): it does not come back for this stock. */
export function markFavoriteHinted<F>(s: PersonalizationState<F>, symbol: string): PersonalizationState<F> {
  return s.hinted.includes(symbol) ? s : { ...s, hinted: [...s.hinted, symbol].slice(-PERSONALIZATION_LIMIT) };
}

export type ForYouReason = 'favorite' | 'often_viewed';
export type ForYouChange = 'zone' | 'signal' | 'flow';
export interface ForYouCandidate {
  symbol: string;
  change: ForYouChange | null;
  magnitude?: number;
  /** Previous and current zone / signal (for 「訊號 偏多 → 中性」). */
  from?: string | null;
  to?: string | null;
  /** Today's mark (price, range edges, P/C) for the concrete line. */
  mark?: StockMark;
}
export interface ForYouItem { symbol: string; reason: ForYouReason; change: ForYouChange; from?: string | null; to?: string | null; mark?: StockMark }

/**
 * 「為你帶出」: up to 3 stocks from the user's favorites and most-viewed that
 * changed today (crossed a valuation zone, signal changed, unusual flow).
 * Favorites come first; each item says why it is here.
 */
export function forYou(s: PersonalizationState, candidates: readonly ForYouCandidate[], favorites: ReadonlySet<string>, limit = 3, now = Date.now()): ForYouItem[] {
  if (!s.enabled) return [];
  const often = new Set(topViewed(s, 20, now));
  const rank: Record<ForYouChange, number> = { zone: 0, signal: 1, flow: 2 };
  return candidates
    .filter((c): c is ForYouCandidate & { change: ForYouChange } => c.change !== null && (favorites.has(c.symbol) || often.has(c.symbol)))
    .map((c) => ({ ...c, reason: (favorites.has(c.symbol) ? 'favorite' : 'often_viewed') as ForYouReason }))
    .sort((a, b) => Number(a.reason !== 'favorite') - Number(b.reason !== 'favorite') || rank[a.change] - rank[b.change] || (b.magnitude ?? 0) - (a.magnitude ?? 0))
    .slice(0, limit)
    .map(({ symbol, reason, change, from, to, mark }) => ({ symbol, reason, change, from, to, mark }));
}

/** 「清除使用紀錄」 and 「刪除我的資料」: everything goes; the on/off switch stays as the user set it. */
export function clearPersonalization<F>(s: PersonalizationState<F>): PersonalizationState<F> {
  return emptyPersonalization<F>(s.enabled);
}

/** Turning personalization off also clears what was recorded. */
export function setPersonalizationEnabled<F>(s: PersonalizationState<F>, enabled: boolean): PersonalizationState<F> {
  return enabled ? { ...s, enabled: true } : emptyPersonalization<F>(false);
}

/**
 * Baseline for 「今天有變化」: zone and signal of the user's stocks per report
 * date, kept on the phone. When a new report date arrives the current
 * snapshot becomes the previous one.
 */
export interface StockMark {
  zone: string | null;
  signal: string | null;
  flowFlag?: string | null;
  /** Optional numbers for the alert line. */
  price?: number | null;
  low?: number | null;
  high?: number | null;
  /** Put/Call volume ratio today. */
  pc?: number | null;
}

/** Flow flags that count as a change worth an alert ('neutral' / 'unknown' do not). */
export const ALERT_FLOW_FLAGS: ReadonlySet<string> = new Set(['unusual_put', 'unusual_call', 'unusual_volume', 'bullish_oi', 'bearish_oi']);
export interface DailyMarks { date: string; marks: Record<string, StockMark> }
export interface MarksHistory { prev: DailyMarks | null; cur: DailyMarks | null }

export function rollMarks(history: MarksHistory | null | undefined, date: string, marks: Record<string, StockMark>): MarksHistory {
  const h = history ?? { prev: null, cur: null };
  if (h.cur && h.cur.date === date) return { prev: h.prev, cur: { date, marks: { ...h.cur.marks, ...marks } } };
  return { prev: h.cur, cur: { date, marks } };
}

/**
 * Candidates for 今日提醒: zone crossed or signal changed since the previous
 * report day, or unusual flow today. Nothing until a previous day exists
 * (first use on this phone): there is no baseline to compare against.
 */
export function changesSince(history: MarksHistory): ForYouCandidate[] {
  if (!history.prev || !history.cur) return [];
  const cur = history.cur.marks;
  const prev = history.prev.marks;
  return Object.entries(cur).map(([symbol, m]) => {
    const p = prev[symbol];
    if (p && p.zone && m.zone && p.zone !== m.zone) return { symbol, change: 'zone' as const, from: p.zone, to: m.zone, mark: m };
    if (p && p.signal && m.signal && p.signal !== m.signal) return { symbol, change: 'signal' as const, from: p.signal, to: m.signal, mark: m };
    if (m.flowFlag && ALERT_FLOW_FLAGS.has(m.flowFlag)) return { symbol, change: 'flow' as const, magnitude: m.pc ?? 0, mark: m };
    return { symbol, change: null };
  });
}
