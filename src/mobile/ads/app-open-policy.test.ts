import { createAppOpenPolicy } from './app-open-policy';
import { APP_PROFILES } from '../__fixtures__/app-profiles';
const { APP_OPEN_COOLDOWN_MS, APP_OPEN_MAX_REFERENCE_AGE_MS, canShowAppOpenAd, canShowColdStartAppOpen, canAttemptColdStartAppOpen, isAppOpenAdFresh, APP_OPEN_STARTUP_WINDOW_MS } = createAppOpenPolicy(APP_PROFILES[0]);

describe('app-open policy', () => {
  const now = 1_000_000;

  it('skips App Open requests for the first two launches', () => {
    expect(canAttemptColdStartAppOpen(1)).toBe(false);
    expect(canAttemptColdStartAppOpen(2)).toBe(false);
    expect(canAttemptColdStartAppOpen(3)).toBe(true);
  });

  it('uses the persisted cooldown on cold starts too', () => {
    expect(canShowColdStartAppOpen({ launchCount: 3, loadedAt: now, now })).toBe(true);
    expect(canShowColdStartAppOpen({ launchCount: 3, loadedAt: now - 1, now })).toBe(true);
    expect(canShowColdStartAppOpen({ launchCount: 3, loadedAt: now, lastShownAt: now - 1, now })).toBe(false);
  });

  it('enforces the warm-policy cooldown for warm resumes', () => {
    const lastShownAt = now - APP_OPEN_COOLDOWN_MS + 1;
    expect(canShowAppOpenAd({ launchCount: 3, lastShownAt, now })).toBe(false);
    expect(canShowAppOpenAd({ launchCount: 3, lastShownAt: now - APP_OPEN_COOLDOWN_MS, now })).toBe(true);
  });

  it('bounds the startup opportunity to 1.5 seconds', () => {
    expect(APP_OPEN_STARTUP_WINDOW_MS).toBe(1_500);
  });

  it('rejects expired or future ad references', () => {
    expect(isAppOpenAdFresh(now, now)).toBe(true);
    expect(isAppOpenAdFresh(now - APP_OPEN_MAX_REFERENCE_AGE_MS, now)).toBe(false);
    expect(isAppOpenAdFresh(now + 1, now)).toBe(false);
  });
});
