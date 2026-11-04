import { APP_PROFILES } from '../__fixtures__/app-profiles';
import { createReportParser } from './parser';
import { createMemoryCache } from './cache';

test.each(APP_PROFILES)('$app retains its report title, timestamp and ticker patterns', (profile) => {
  const { parseReport } = createReportParser(profile);
  const markdown = '每日選擇權策略報告 — 2026-11-03\n產生時間：2026-11-03 13:00\n## AAPL\nUS\n## 2330\nTW\n## 008780\nETF\n## ABCDEF\nlong\n';
  const parsed = parseReport(markdown);
  expect(parsed.date).toBe('2026-11-03');
  expect(parsed.generatedAt).toBe('2026-11-03 13:00');
  expect(parsed.tickers).toEqual(profile.app === 'tw_stocks' ? ['AAPL', '2330', '008780', 'ABCDEF'] : ['AAPL']);
  expect(parsed.sections.AAPL).toBe('## AAPL\nUS');
  expect(parseReport(markdown)).toEqual(parsed); // RegExp state never leaks across reports.
  const english = parseReport('Daily report — 2026-11-03\nGenerated at: 2026-11-03 13:00\n## TSLA\n');
  expect(english.date).toBe(profile.app === 'options' ? '2026-11-03' : '');
  expect(english.generatedAt).toBe(profile.app === 'options' ? '2026-11-03 13:00' : '');
});

test.each(APP_PROFILES)('$app retains cache TTL and app-specific cache keys', (profile) => {
  jest.useFakeTimers().setSystemTime(1_000_000);
  try {
    const cache = createMemoryCache(profile);
    cache.setCache('dashboard', 42);
    jest.advanceTimersByTime(1_800_000);
    expect(cache.getCached('dashboard')).toBe(42);
    jest.advanceTimersByTime(1);
    expect(cache.getCached('dashboard')).toBeNull();
    expect(cache.cacheKeys.reportDates()).toBe('report-dates-zh');
    expect(cache.cacheKeys.report('2026-11-03', 'en')).toBe('report-2026-11-03-en');
    expect(cache.cacheKeys.usStocksMarketCaps).toBe(profile.app === 'options' ? 'us-stocks-market-caps' : undefined);
    expect(createMemoryCache(profile).getCacheSize()).toBe(0);
  } finally { jest.useRealTimers(); }
});
