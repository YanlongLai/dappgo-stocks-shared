/**
 * Long price-history files (price-history-v1, 2.0.0).
 *
 *   https://data.dappgo.com/v1/markets/{tw|us|options}/history/{SYMBOL}.json
 *
 * Up to 756 daily bars (old → new) with the engine's own MA20/60/200, computed
 * with ~4 years of look-back, so the first bar of the window already has MA200.
 * The app never recomputes them. Columns are read by name from `fields`.
 *
 * Loading is lazy (stock page only) and cached: fresh for `max-age` (900 s),
 * then revalidated with If-None-Match (ETag = SHA-256 of the body, 304 when
 * unchanged). A 404 or any failure falls back to the dashboard's 90-day
 * `price_history`; the chart then shows its 「歷史資料不足」 hint.
 */
import type { ChartBarInput, MaKey, MovingAverages } from './price-chart';

export const PRICE_HISTORY_SCHEMA = 'price-history-v1';
export const PRICE_HISTORY_BASE = 'https://data.dappgo.com/v1/markets';
/** Cache-Control max-age the files are served with; used when the header is missing. */
export const PRICE_HISTORY_MAX_AGE_S = 900;
export const PRICE_HISTORY_TIMEOUT_MS = 8000;

export type HistoryMarket = 'tw' | 'us' | 'options';

export interface PriceHistory {
  market: string;
  symbol: string;
  asOf: string;
  bars: ChartBarInput[];
  /** Aligned to `bars`. */
  ma: Record<MaKey, (number | null)[]>;
}

export function priceHistoryUrl(market: HistoryMarket, symbol: string, base = PRICE_HISTORY_BASE): string {
  return `${base}/${market}/history/${encodeURIComponent(symbol)}.json`;
}

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/**
 * Parses a price-history-v1 body. Anything else (other schema, no usable
 * bars, missing date/close columns) is ignored: returns null.
 */
export function parsePriceHistory(json: unknown): PriceHistory | null {
  if (!json || typeof json !== 'object') return null;
  const d = json as Record<string, unknown>;
  if (d.schema_version !== PRICE_HISTORY_SCHEMA) return null;
  const fields = Array.isArray(d.fields) ? (d.fields as unknown[]) : [];
  const col = (name: string) => fields.indexOf(name);
  const iDate = col('date');
  const iClose = col('close');
  if (iDate < 0 || iClose < 0 || !Array.isArray(d.bars)) return null;
  const iOpen = col('open'); const iHigh = col('high'); const iLow = col('low'); const iVol = col('volume');
  const iMa: Record<MaKey, number> = { ma20: col('ma20'), ma60: col('ma60'), ma200: col('ma200') };
  const bars: ChartBarInput[] = [];
  const ma: Record<MaKey, (number | null)[]> = { ma20: [], ma60: [], ma200: [] };
  for (const row of d.bars as unknown[]) {
    if (!Array.isArray(row)) continue;
    const date = row[iDate];
    const close = num(row[iClose]);
    if (typeof date !== 'string' || close == null || close <= 0) continue;
    const at = (i: number) => (i >= 0 ? num(row[i]) : null);
    const open = at(iOpen); const high = at(iHigh); const low = at(iLow); const volume = at(iVol);
    bars.push({
      date,
      close,
      ...(open != null ? { open } : {}),
      ...(high != null ? { high } : {}),
      ...(low != null ? { low } : {}),
      ...(volume != null ? { volume } : {}),
    });
    (Object.keys(iMa) as MaKey[]).forEach((k) => { ma[k].push(at(iMa[k])); });
  }
  if (bars.length < 2) return null;
  return {
    market: typeof d.market === 'string' ? d.market : '',
    symbol: typeof d.symbol === 'string' ? d.symbol : '',
    asOf: typeof d.as_of === 'string' ? d.as_of : bars[bars.length - 1].date ?? '',
    bars,
    ma,
  };
}

const dayOf = (b: ChartBarInput) => (typeof b?.date === 'string' ? b.date.slice(0, 10) : '');
// Same filter as normalizeBars, so the MA series stays aligned with the drawn bars.
const usable = (b: ChartBarInput) => !!dayOf(b) && typeof b.close === 'number' && Number.isFinite(b.close);

/**
 * One daily series for the chart. The long file supplies the past; the
 * dashboard's bars win on any day both have (so 1W/1M/3M keep showing the
 * dashboard's data) and add days newer than the file. MA comes from the file
 * only, aligned by date; a day the file does not have gets no MA value.
 */
export function mergePriceHistory(
  history: PriceHistory | null,
  dashboardBars: readonly ChartBarInput[] | null | undefined,
): { bars: ChartBarInput[]; movingAverages?: MovingAverages } {
  const dash = (dashboardBars ?? []).filter(usable);
  if (!history) return { bars: [...dash] };
  const byDay = new Map<string, { bar: ChartBarInput; i: number | null }>();
  history.bars.forEach((bar, i) => byDay.set(dayOf(bar), { bar, i }));
  for (const bar of dash) {
    const day = dayOf(bar);
    const prev = byDay.get(day);
    byDay.set(day, { bar, i: prev ? prev.i : null });
  }
  const days = [...byDay.keys()].sort();
  const bars: ChartBarInput[] = [];
  const ma: Record<MaKey, (number | null)[]> = { ma20: [], ma60: [], ma200: [] };
  for (const day of days) {
    const { bar, i } = byDay.get(day)!;
    bars.push(bar);
    (Object.keys(ma) as MaKey[]).forEach((k) => { ma[k].push(i == null ? null : history.ma[k][i] ?? null); });
  }
  return { bars, movingAverages: ma };
}

// ── Loading with ETag / max-age ──

export interface CachedHistory {
  etag: string | null;
  /** ms epoch of the last 200 or 304. */
  checkedAt: number;
  maxAgeS: number;
  body: unknown;
}

export interface HistoryCache {
  load: (key: string) => Promise<CachedHistory | null>;
  save: (key: string, value: CachedHistory) => Promise<void>;
}

type FetchLike = (url: string, init?: { headers?: Record<string, string>; signal?: AbortSignal }) => Promise<{
  status: number;
  ok: boolean;
  headers: { get: (name: string) => string | null };
  json: () => Promise<unknown>;
}>;

export function maxAgeOf(cacheControl: string | null | undefined): number {
  const m = /max-age=(\d+)/i.exec(cacheControl ?? '');
  return m ? Number(m[1]) : PRICE_HISTORY_MAX_AGE_S;
}

export function priceHistoryCacheKey(market: HistoryMarket, symbol: string): string {
  return `price-history-v1:${market}:${symbol}`;
}

/**
 * Loads one symbol's long history. Never throws: null means "use the
 * dashboard's 90 days". A cached copy is served while fresh and after a 304;
 * a 404 means the file is gone (null); a network error keeps the cached copy.
 */
export async function loadPriceHistory({ market, symbol, fetchImpl, cache, now = Date.now, base, timeoutMs = PRICE_HISTORY_TIMEOUT_MS }: {
  market: HistoryMarket;
  symbol: string;
  fetchImpl: FetchLike;
  cache?: HistoryCache | null;
  now?: () => number;
  base?: string;
  timeoutMs?: number;
}): Promise<PriceHistory | null> {
  const key = priceHistoryCacheKey(market, symbol);
  let cached: CachedHistory | null = null;
  try { cached = (await cache?.load(key)) ?? null; } catch { cached = null; }
  const cachedParsed = cached ? parsePriceHistory(cached.body) : null;
  if (cached && cachedParsed && now() - cached.checkedAt < cached.maxAgeS * 1000) return cachedParsed;

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (cached?.etag && cachedParsed) headers['If-None-Match'] = cached.etag;
    const res = await fetchImpl(priceHistoryUrl(market, symbol, base), { headers, ...(controller ? { signal: controller.signal } : {}) });
    const maxAgeS = maxAgeOf(res.headers.get('cache-control'));
    if (res.status === 304 && cached && cachedParsed) {
      await cache?.save(key, { ...cached, checkedAt: now(), maxAgeS }).catch(() => undefined);
      return cachedParsed;
    }
    if (res.status === 404) return null;
    if (!res.ok) return cachedParsed;
    const body = await res.json();
    const parsed = parsePriceHistory(body);
    if (!parsed) return null;
    await cache?.save(key, { etag: res.headers.get('etag'), checkedAt: now(), maxAgeS, body }).catch(() => undefined);
    return parsed;
  } catch {
    return cachedParsed;
  } finally {
    if (timer) clearTimeout(timer);
  }
}
