import { createInterstitialRoutePolicy } from './interstitial-route-policy';
import { APP_PROFILES } from '../__fixtures__/app-profiles';
const { shouldShowTimedInterstitialOnTransition } = createInterstitialRoutePolicy(APP_PROFILES[0]);
test('only explicit safe research exits may show', () => {
  expect(shouldShowTimedInterstitialOnTransition('/stock/AAPL', '/(tabs)/dashboard')).toBe(true);
  for (const path of ['/settings', '/(tabs)/settings', '/search', '/unknown', '/stock/TSLA', '/report/date'])
    expect(shouldShowTimedInterstitialOnTransition('/stock/AAPL', path)).toBe(false);
  expect(shouldShowTimedInterstitialOnTransition(null, '/dashboard')).toBe(false);
  expect(shouldShowTimedInterstitialOnTransition('/dashboard', '/stock/AAPL')).toBe(false);
});
test('entering a research detail is the inventory demand signal', () => {
  const { shouldRequestTimedInterstitialInventory } = createInterstitialRoutePolicy(APP_PROFILES[0]);
  expect(shouldRequestTimedInterstitialInventory('/(tabs)/dashboard', '/stock/AAPL')).toBe(true);
  expect(shouldRequestTimedInterstitialInventory('/stock/AAPL', '/report/2026-11-18')).toBe(true);
  for (const next of ['/(tabs)/dashboard', '/settings', '/search', null])
    expect(shouldRequestTimedInterstitialInventory('/stock/AAPL', next)).toBe(false);
  expect(shouldRequestTimedInterstitialInventory('/stock/AAPL', '/stock/AAPL')).toBe(false);
});
