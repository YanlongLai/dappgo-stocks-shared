import { APP_PROFILES } from '../__fixtures__/app-profiles';
import { createAdUnitCatalog } from './admob-config';
import { createAppOpenPolicy } from './app-open-policy';
import { createInterstitialRoutePolicy } from './interstitial-route-policy';
import { createAdMeasurement } from './ad-measurement';

test.each(APP_PROFILES)('$app retains all eight production ad unit IDs', (profile) => {
  const catalog = createAdUnitCatalog(profile);
  for (const [format, ids] of Object.entries({
    banner: catalog.PRODUCTION_BANNER_AD_UNIT_IDS,
    app_open: catalog.PRODUCTION_APP_OPEN_AD_UNIT_IDS,
    interstitial: catalog.PRODUCTION_INTERSTITIAL_AD_UNIT_IDS,
    rewarded: catalog.PRODUCTION_REWARDED_AD_UNIT_IDS,
  })) {
    expect(ids).toEqual(profile.adUnits[format as keyof typeof profile.adUnits]);
    for (const platform of ['ios', 'android'] as const) {
      expect(catalog.resolveBannerAdUnitId({
        isDevelopment: false, adsMode: 'production', adsBuildProfile: 'production',
        productionUnitId: ids[platform], testUnitId: 'test',
      })).toBe(profile.adUnits[format as keyof typeof profile.adUnits][platform]);
    }
  }
});

test.each(APP_PROFILES)('$app preserves its launch, expiry and resume policy constants', (profile) => {
  const policy = createAppOpenPolicy(profile);
  expect(policy.MIN_LAUNCHES_BEFORE_APP_OPEN).toBe(3);
  expect(policy.APP_OPEN_COOLDOWN_MS).toBe(profile.app === 'options' ? 300_000 : 14_400_000);
  expect(policy.APP_OPEN_MAX_REFERENCE_AGE_MS).toBe(14_400_000);
  expect(policy.APP_OPEN_STARTUP_WINDOW_MS).toBe(profile.app === 'options' ? undefined : 1_500);
  expect(policy.APP_OPEN_STARTUP_SHOW_FAIL_OPEN_MS).toBe(profile.app === 'options' ? undefined : 30_000);
  const lastShownAt = 1_000_000;
  expect(policy.canShowAppOpenAd({ launchCount: 3, lastShownAt, now: lastShownAt + policy.APP_OPEN_COOLDOWN_MS - 1 })).toBe(false);
  expect(policy.canShowAppOpenAd({ launchCount: 3, lastShownAt, now: lastShownAt + policy.APP_OPEN_COOLDOWN_MS })).toBe(true);
});

test.each(APP_PROFILES)('$app uses its current research route prefix', (profile) => {
  const policy = createInterstitialRoutePolicy(profile);
  const prefix = profile.app === 'options' ? 'ticker' : 'stock';
  expect(policy.shouldShowTimedInterstitialOnTransition(`/${prefix}/AAPL`, '/')).toBe(true);
  expect(policy.shouldShowTimedInterstitialOnTransition('/settings', '/')).toBe(false);
  expect(policy.shouldShowTimedInterstitialOnTransition('/report/2026-11-03', '/reports')).toBe(true);
});

test.each(APP_PROFILES)('$app preserves telemetry identity on both platforms', (profile) => {
  for (const platform of ['ios', 'android'] as const) {
    const emit = jest.fn();
    let analyticsStorage = true;
    const report = createAdMeasurement(profile, platform, () => ({ canRequestAds: true, analyticsStorage }), emit)('banner', 'dashboard_primary');
    report('request');
    expect(emit).toHaveBeenLastCalledWith({ name: 'dgo_ad_request', params: {
      app: profile.app, platform, format: 'banner', placement: 'dashboard_primary',
      placement_id: `${profile.app}_${platform}_dashboard_primary`,
    } });
    analyticsStorage = false;
    report('loaded');
    expect(emit).toHaveBeenCalledTimes(1);
  }
});
