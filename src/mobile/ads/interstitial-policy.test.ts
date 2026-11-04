import {
  INTERSTITIAL_ACTIVE_THRESHOLD_MS,
  INTERSTITIAL_COOLDOWN_MS,
  canShowTimedInterstitial,
  isInterstitialAdFresh,
} from './interstitial-policy';

describe('timed interstitial policy', () => {
  it('waits for a meaningful foreground session', () => {
    expect(canShowTimedInterstitial({
      activeMs: INTERSTITIAL_ACTIVE_THRESHOLD_MS - 1,
      lastShownAt: null,
      now: 100,
    })).toBe(false);
    expect(canShowTimedInterstitial({
      activeMs: INTERSTITIAL_ACTIVE_THRESHOLD_MS,
      lastShownAt: null,
      now: 100,
    })).toBe(true);
  });

  it('enforces the cooldown after a successful display', () => {
    expect(canShowTimedInterstitial({
      activeMs: INTERSTITIAL_ACTIVE_THRESHOLD_MS,
      lastShownAt: 10_000,
      now: 10_000 + INTERSTITIAL_COOLDOWN_MS - 1,
    })).toBe(false);
    expect(canShowTimedInterstitial({
      activeMs: INTERSTITIAL_ACTIVE_THRESHOLD_MS,
      lastShownAt: 10_000,
      now: 10_000 + INTERSTITIAL_COOLDOWN_MS,
    })).toBe(true);
  });

  it('expires stale preloaded ads', () => {
    expect(isInterstitialAdFresh(Date.now())).toBe(true);
    expect(isInterstitialAdFresh(1, 1 + 60 * 60 * 1000 + 1)).toBe(false);
  });
});
