import { AD_FREE_EVENT_NAMES, AD_FREE_SOURCES, adFreeEvent, isAdFreeSource } from './ad-free-events';

test('event names and sources match the approved list', () => {
  expect([...AD_FREE_EVENT_NAMES]).toEqual(['adfree_sheet_view', 'adfree_purchase_start', 'adfree_purchase_success', 'adfree_purchase_cancel',
    'adfree_purchase_fail', 'adfree_restore_result', 'adfree_entry_tap', 'adfree_nudge_view', 'adfree_nudge_dismiss']);
  expect([...AD_FREE_SOURCES]).toEqual(['settings', 'banner', 'ai_summary', 'interstitial']);
});
test('builds payloads with the right params', () => {
  expect(adFreeEvent('adfree_sheet_view', { source: 'banner' })).toEqual({ name: 'adfree_sheet_view', params: { source: 'banner' } });
  expect(adFreeEvent('adfree_purchase_fail', { source: 'ai_summary', code: '8' }).params).toEqual({ source: 'ai_summary', code: '8' });
  expect(adFreeEvent('adfree_restore_result', { result: 'none' }).params).toEqual({ result: 'none' });
  expect(adFreeEvent('adfree_nudge_view', {}).params).toEqual({});
});
test('invalid source falls back and long codes are truncated', () => {
  expect(adFreeEvent('adfree_entry_tap', { source: 'bogus' as never }).params.source).toBe('settings');
  expect(adFreeEvent('adfree_purchase_fail', { source: 'settings', code: 'x'.repeat(100) }).params.code).toHaveLength(40);
  expect(isAdFreeSource('interstitial')).toBe(true);
  expect(isAdFreeSource(3)).toBe(false);
});
