import { createAppOpenPolicy } from './app-open-policy';
import { APP_PROFILES } from '../__fixtures__/app-profiles';
const { APP_OPEN_COOLDOWN_MS, APP_OPEN_MAX_REFERENCE_AGE_MS, canShowAppOpenAd, isAppOpenAdFresh } = createAppOpenPolicy(APP_PROFILES[2]);

describe('app-open policy', () => {
  const now = 1_000_000;

  it('skips the first two launches', () => {
    expect(canShowAppOpenAd({ launchCount: 1, lastShownAt: null, now })).toBe(false);
    expect(canShowAppOpenAd({ launchCount: 2, lastShownAt: null, now })).toBe(false);
    expect(canShowAppOpenAd({ launchCount: 3, lastShownAt: null, now })).toBe(true);
  });

  it('enforces the warm-policy cooldown', () => {
    const lastShownAt = now - APP_OPEN_COOLDOWN_MS + 1;
    expect(canShowAppOpenAd({ launchCount: 3, lastShownAt, now })).toBe(false);
    expect(canShowAppOpenAd({ launchCount: 3, lastShownAt: now - APP_OPEN_COOLDOWN_MS, now })).toBe(true);
  });

  it('rejects expired or future ad references', () => {
    expect(isAppOpenAdFresh(now, now)).toBe(true);
    expect(isAppOpenAdFresh(now - APP_OPEN_MAX_REFERENCE_AGE_MS, now)).toBe(false);
    expect(isAppOpenAdFresh(now + 1, now)).toBe(false);
  });
});
