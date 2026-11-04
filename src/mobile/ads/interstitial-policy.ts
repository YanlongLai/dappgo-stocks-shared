export const INTERSTITIAL_ACTIVE_THRESHOLD_MS = 5 * 60 * 1000;
export const INTERSTITIAL_COOLDOWN_MS = 5 * 60 * 1000;
export const INTERSTITIAL_AD_FRESHNESS_MS = 60 * 60 * 1000;

export interface TimedInterstitialEligibility {
  activeMs: number;
  lastShownAt: number | null;
  now?: number;
}

export function canShowTimedInterstitial({
  activeMs,
  lastShownAt,
  now = Date.now(),
}: TimedInterstitialEligibility): boolean {
  if (!Number.isFinite(activeMs) || activeMs < INTERSTITIAL_ACTIVE_THRESHOLD_MS) {
    return false;
  }
  if (
    lastShownAt != null
    && Number.isFinite(lastShownAt)
    && now - lastShownAt < INTERSTITIAL_COOLDOWN_MS
  ) {
    return false;
  }
  return true;
}

export function isInterstitialAdFresh(
  loadedAt: number,
  now = Date.now(),
): boolean {
  return Number.isFinite(loadedAt)
    && loadedAt > 0
    && now - loadedAt <= INTERSTITIAL_AD_FRESHNESS_MS;
}
