/** Crashlytics is native-only; the web build intentionally has no-op twins. */
export function initializeCrashlyticsConsent(): () => void {
  return () => {};
}

export function recordError(_error: Error, _screen?: string): void {}
