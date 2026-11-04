import type { AppProfile } from '../app-profile';

/** One cache per app composition root; this module never persists to storage. */
export function createMemoryCache(profile: AppProfile) {

  interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
  }

  const memoryCache = new Map<string, CacheEntry<unknown>>();

  function getCached<T>(key: string): T | null {
    const entry = memoryCache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (entry.ttl !== Infinity && Date.now() - entry.timestamp > entry.ttl) {
      memoryCache.delete(key);
      return null;
    }
    return entry.data;
  }

  function setCache<T>(key: string, data: T, ttl: number = profile.cache.dashboardTtlMs): void {
    memoryCache.set(key, { data, timestamp: Date.now(), ttl });
  }

  function clearCache(): void {
    memoryCache.clear();
    inflightRequests.clear();
  }

  function getCacheSize(): number {
    return memoryCache.size;
  }

  // Inflight request deduplication registry.
  // Concurrent callers that miss the cache all share one in-flight Promise
  // instead of each firing their own fetch.
  const inflightRequests = new Map<string, Promise<unknown>>();

  function dedupe<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const existing = inflightRequests.get(key);
    if (existing) return existing as Promise<T>;
    const p = fn().finally(() => inflightRequests.delete(key));
    inflightRequests.set(key, p);
    return p;
  }

  // Cache keys
  const cacheKeys = {
    reportDates: (language: 'zh' | 'en' = 'zh') => `report-dates-${language}`,
    report: (date: string, language: 'zh' | 'en' = 'zh') => `report-${date}-${language}`,
    dashboard: 'dashboard-data',
    ...(profile.cache.usStocksMarketCapsKey ? { usStocksMarketCaps: profile.cache.usStocksMarketCapsKey } : {}),
    quote: (symbol: string) => `quote-${symbol}`,
    matrix: (symbol: string) => `matrix-${symbol}`,
  };
  return { getCached, setCache, clearCache, getCacheSize, dedupe, cacheKeys };
}
