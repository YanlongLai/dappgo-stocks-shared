import { dashboardDataPath, parseLatestPointer } from './latest-pointer';
import { shouldSkipUpdate } from './data-hash';

test('immutable pointer paths and publication metadata survive parsing', () => {
  const raw = { hash: 'abcdef123456', report_date: '2026-11-03', generated_at_utc: '2026-11-03T13:00:00Z', publication_slot: 'close', publication_revision: 2, data_url_v2: 'dashboard/data-abcdef123456.json' };
  expect(parseLatestPointer(raw)).toEqual(raw);
  expect(dashboardDataPath(parseLatestPointer(raw))).toBe(raw.data_url_v2);
  expect(shouldSkipUpdate('abcdef123456', parseLatestPointer(raw)?.hash)).toBe(true);
});

test.each(['https://evil.test/data-abcdef123456.json', '../data-abcdef123456.json', 'dashboard/data-short.json', 'dashboard/data-ABCDEF12.json', 'dashboard/data-abcdef12.json?bypass=1'])('untrusted pointer path %s falls back to the mutable dashboard', (path) => {
  const pointer = parseLatestPointer({ hash: 'abcdef12', data_url_v2: path });
  expect(pointer?.data_url_v2).toBeUndefined();
  expect(dashboardDataPath(pointer)).toBe('dashboard/data.json');
});

test.each([null, [], 'hash', {}, { hash: 42 }, { hash: ' ' }])('malformed pointer %p cannot skip the payload', (raw) => {
  expect(parseLatestPointer(raw)).toBeNull();
  expect(shouldSkipUpdate('abcdef12', parseLatestPointer(raw)?.hash)).toBe(false);
});
