import type { AppProfile } from '../app-profile';

export interface AppOpenResumePolicyInput {
  launchCount: number;
  lastShownAt: number | null;
  now?: number;
}

export type AppOpenShowPolicyInput = AppOpenResumePolicyInput;

/** Native loading/presentation stays in the app; policy values are explicit. */
export function createAppOpenPolicy(profile: AppProfile) {
  const MIN_LAUNCHES_BEFORE_APP_OPEN = profile.appOpen.minimumLaunches;
  const APP_OPEN_RESUME_COOLDOWN_MS = profile.appOpen.resumeCooldownMs;
  const APP_OPEN_COOLDOWN_MS = APP_OPEN_RESUME_COOLDOWN_MS;
  const APP_OPEN_MAX_REFERENCE_AGE_MS = profile.appOpen.maxReferenceAgeMs;
  const APP_OPEN_STARTUP_WINDOW_MS = profile.appOpen.startupWindowMs;
  const APP_OPEN_STARTUP_SHOW_FAIL_OPEN_MS = profile.appOpen.startupShowFailOpenMs;
  function canAttemptColdStartAppOpen(launchCount: number): boolean {
    return launchCount >= MIN_LAUNCHES_BEFORE_APP_OPEN;
  }

  function canShowColdStartAppOpen({
    launchCount,
    loadedAt,
    lastShownAt = null,
    now = Date.now(),
  }: {
    launchCount: number;
    loadedAt: number;
    lastShownAt?: number | null;
    now?: number;
  }): boolean {
    return canShowAppOpenOnResume({ launchCount, lastShownAt, now }) && isAppOpenAdFresh(loadedAt, now);
  }

  function canShowAppOpenOnResume({
    launchCount,
    lastShownAt,
    now = Date.now(),
  }: AppOpenResumePolicyInput): boolean {
    if (!canAttemptColdStartAppOpen(launchCount)) return false;
    if (lastShownAt === null) return true;
    return now >= lastShownAt + APP_OPEN_RESUME_COOLDOWN_MS;
  }

  /** Backwards-compatible alias for callers that use the warm-resume policy. */
  const canShowAppOpenAd = canShowAppOpenOnResume;

  function isAppOpenAdFresh(loadedAt: number, now = Date.now()): boolean {
    return loadedAt > 0 && now >= loadedAt && now - loadedAt < APP_OPEN_MAX_REFERENCE_AGE_MS;
  }
  return { MIN_LAUNCHES_BEFORE_APP_OPEN, APP_OPEN_RESUME_COOLDOWN_MS, APP_OPEN_COOLDOWN_MS, APP_OPEN_MAX_REFERENCE_AGE_MS, APP_OPEN_STARTUP_WINDOW_MS, APP_OPEN_STARTUP_SHOW_FAIL_OPEN_MS, canAttemptColdStartAppOpen, canShowColdStartAppOpen, canShowAppOpenOnResume, canShowAppOpenAd, isAppOpenAdFresh };
}
