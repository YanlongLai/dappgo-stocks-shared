/**
 * App adapter creates one controller with its AsyncStorage-compatible adapter.
 * Only this structural protocol crosses the boundary; no storage module is imported.
 */
export interface AnalyticsConsentStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<unknown>;
  removeItem(key: string): Promise<unknown>;
}

export const ANALYTICS_CONSENT_KEY = 'dappgo-first-party-analytics-consent-v1';
export function createAnalyticsConsent(storage: AnalyticsConsentStorage) {
  // A missing preference uses the Owner-approved default-on behavior. Hydration
  // still preserves an existing explicit false choice.
  let optedIn = true;
  let hydrated = false;
  let saveError = false;
  let revision = 0;
  let hydration: Promise<void> | null = null;
  let writes: Promise<void> = Promise.resolve();
  const listeners = new Set<() => void>();

  function getAnalyticsConsent(): boolean { return optedIn; }
  function getAnalyticsConsentHydrated(): boolean { return hydrated; }
  function getAnalyticsConsentSaveError(): boolean { return saveError; }
  function subscribeAnalyticsConsent(listener: () => void): () => void {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }
  function notify(): void {
    for (const listener of listeners) {
      try { listener(); } catch { /* Withdrawal must reach other consumers. */ }
    }
  }
  /** Local first-party analytics choice, independent of UMP. */
  function initializeAnalyticsConsent(): Promise<void> {
    if (!hydration) {
      const started = revision;
      hydration = (async () => {
        let stored: string | null = null;
        try { stored = await storage.getItem(ANALYTICS_CONSENT_KEY); } catch { stored = '__storage-error__'; }
        if (started !== revision) return;
        optedIn = stored === null ? true : stored === 'true';
        hydrated = true;
        notify();
      })();
    }
    return hydration;
  }
  function setAnalyticsConsent(value: boolean): Promise<void> {
    const changed = ++revision;
    hydrated = true;
    optedIn = value === true;
    saveError = false;
    const serialized = optedIn ? 'true' : 'false';
    const pending = writes.then(async () => {
      try {
        await storage.setItem(ANALYTICS_CONSENT_KEY, serialized);
      } catch {
        // If saving fails, remove an older grant where storage still allows it.
        let removed = false;
        try { await storage.removeItem(ANALYTICS_CONSENT_KEY); removed = true; } catch { /* Surface failed durability. */ }
        if (changed === revision) {
          optedIn = false;
          saveError = serialized === 'true' || !removed;
          notify();
        }
      }
    });
    // Reserve order before notifying: a re-entrant withdrawal must queue last.
    writes = pending;
    notify();
    return pending;
  }
  return { getAnalyticsConsent, getAnalyticsConsentHydrated, getAnalyticsConsentSaveError, subscribeAnalyticsConsent, initializeAnalyticsConsent, setAnalyticsConsent };
}
