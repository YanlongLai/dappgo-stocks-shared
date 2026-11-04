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
