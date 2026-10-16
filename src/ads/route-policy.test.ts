import { canShowAppOpenOnRoute, shouldShowFullscreenOnTransition } from './route-policy';
test.each(['options', 'us_stocks', 'tw_stocks'] as const)('%s explicit safe route matrix', (app) => {
  const detail = app === 'options' ? '/ticker/AAPL' : '/stock/AAPL';
  for (const next of ['/', '/dashboard', '/(tabs)/dashboard', '/(tabs)/favorites/index', '/explore'])
    expect(shouldShowFullscreenOnTransition(app, detail, next)).toBe(true);
  for (const next of [null, detail, '/search', '/settings', '/(tabs)/settings', '/(tabs)/settings/push-notifications', '/unknown', '/stock/TSLA', '/ticker/TSLA', '/report/date', '/dashboard?symbol=AAPL', 'https://example.com'])
    expect(shouldShowFullscreenOnTransition(app, detail, next)).toBe(false);
  expect(shouldShowFullscreenOnTransition(app, null, '/dashboard')).toBe(false);
  expect(shouldShowFullscreenOnTransition(app, '/dashboard', detail)).toBe(false);
  expect(shouldShowFullscreenOnTransition(app, '/report/date', '/dashboard')).toBe(true);
});
test.each(['options', 'us_stocks', 'tw_stocks'] as const)('%s app-open route allowlist defaults to deny', (app) => {
  for (const path of [null, '', '/settings', '/(tabs)/settings', '/(tabs)/settings/push-notifications',
    '/search', '/(tabs)/search', '/unknown', '/dashboard?redirect=/settings', '/dashboard#search',
    '/stock/', '/ticker/', '/report/', '/report/date/nested']) {
    expect(canShowAppOpenOnRoute(app, path)).toBe(false);
  }
  for (const path of ['/dashboard', '/(tabs)/dashboard', '/favorites', '/report/date',
    app === 'options' ? '/explore' : '/signals',
    app === 'options' ? '/ticker/AAPL' : '/stock/AAPL']) {
    expect(canShowAppOpenOnRoute(app, path)).toBe(true);
  }
  expect(canShowAppOpenOnRoute(app, app === 'options' ? '/signals' : '/explore')).toBe(false);
});
