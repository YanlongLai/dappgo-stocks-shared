import { FullscreenAdmission, type AdmissionToken, type FullscreenFormat } from './admission';
import type { AdLifecycle } from './telemetry';

export type FullscreenAdEvent = 'loaded' | 'opened' | 'closed' | 'error' | 'clicked' | 'paid';
export type FullscreenAd = {
  load(): void;
  show(): Promise<void>;
  subscribe(listener: (event: FullscreenAdEvent, payload?: unknown) => void): () => void;
};
type Consent = { canRequestAds: boolean; adStorage: boolean; adUserData: boolean; adPersonalization: boolean };
export type FullscreenDependencies = {
  format: FullscreenFormat;
  admission: FullscreenAdmission;
  prepare(): Promise<{ launchCount: number }>;
  initialize(): Promise<boolean>;
  consent(): Consent;
  subscribeConsent(listener: () => void): () => void;
  foreground(): boolean;
  // Omitted/unknown routes deny app-open; evaluated again at presentation time.
  appOpenRouteAllowed?(): boolean;
  subscribeForeground(listener: (active: boolean) => void): () => void;
  create(): FullscreenAd;
  persistExposure(timestamp: number): void;
  reporter(startup: boolean): (event: AdLifecycle, paid?: unknown) => void;
  now(): number;
  // Options uses warm resumes only; US/TW retain their existing startup opportunity.
  startupWindowMs: number;
};
export type FullscreenController = { startupReady: Promise<void>; showIfEligible(): Promise<boolean>; stop(): void };

/** Dependency-free lifecycle; SDK, consent, clocks and persistence are injected. */
export function startFullscreenController(deps: FullscreenDependencies): FullscreenController {
  let resolveStartup!: () => void;
  const startupReady = new Promise<void>((resolve) => { resolveStartup = resolve; });
  let stopped = false;
  let prepared = false;
  let sdkReady = false;
  let initializing = false;
  let consentGeneration = 0;
  let lastInitializationGeneration = -1;
  let launchCount = 0;
  let startupOpen = deps.startupWindowMs > 0;
  const startupDeadline = deps.now() + deps.startupWindowMs;
  let startupTimer: ReturnType<typeof setTimeout> | null = null;
  let failOpenTimer: ReturnType<typeof setTimeout> | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let current: { ad: FullscreenAd; loadedAt: number | null; invalidated: boolean; remove: () => void; report: ReturnType<FullscreenDependencies['reporter']> } | null = null;
  let token: AdmissionToken | null = null;
  let activeStartedAt: number | null = deps.foreground() ? deps.now() : null;
  let activeMs = 0;
  let consentKey = JSON.stringify(deps.consent());

  const settleStartup = () => {
    startupOpen = false;
    if (startupTimer) clearTimeout(startupTimer);
    if (failOpenTimer) clearTimeout(failOpenTimer);
    startupTimer = failOpenTimer = null;
    resolveStartup();
  };
  if (startupOpen) startupTimer = setTimeout(() => { if (!token) settleStartup(); else startupOpen = false; }, deps.startupWindowMs);
  else settleStartup();

  const clear = () => {
    current?.remove();
    current = null;
  };
  const release = (owned: AdmissionToken | null) => {
    if (owned) deps.admission.release(owned);
    if (token === owned) token = null;
  };
  const retry = () => {
    if (stopped || retryTimer || !deps.consent().canRequestAds) return;
    retryTimer = setTimeout(() => { retryTimer = null; load(); }, 30_000);
  };
  const eligible = () => {
    if (deps.format === 'app_open') return launchCount >= 3;
    const active = activeMs + (activeStartedAt === null ? 0 : Math.max(0, deps.now() - activeStartedAt));
    return Number.isFinite(active) && active >= 15 * 60 * 1000;
  };

  const show = async (startup = false): Promise<boolean> => {
    const entry = current;
    if (stopped || token || !prepared || !sdkReady || !entry || entry.loadedAt === null ||
        !eligible() || !deps.consent().canRequestAds || !deps.foreground()) return false;
    if (deps.format === 'app_open' && deps.appOpenRouteAllowed?.() !== true) return false;
    const age = deps.now() - entry.loadedAt;
    if (age < 0 || age >= (deps.format === 'app_open' ? 4 : 1) * 60 * 60 * 1000) {
      clear(); load(); return false;
    }
    if (startup && (!startupOpen || deps.now() >= startupDeadline)) return false;
    const owned = deps.admission.acquire(deps.format, {
      now: deps.now(), foreground: deps.foreground(), canRequestAds: deps.consent().canRequestAds,
      safeBoundary: deps.format !== 'app_open' || deps.appOpenRouteAllowed?.() === true,
    });
    if (!owned) return false;
    token = owned;
    // Warm presentations keep the request's reporter and its per-ad paid dedup.
    // Startup gets its presentation placement before any paid callback is accepted.
    if (startup) entry.report = deps.reporter(true);
    entry.report('show_attempt');
    if (startup) {
      startupOpen = false;
      // Existing startup fail-open limit only releases content, never the fullscreen mutex.
      failOpenTimer = setTimeout(settleStartup, 30_000);
    }
    try {
      await entry.ad.show();
      return true;
    } catch {
      if (current !== entry || token !== owned) return false;
      if (!stopped && !entry.invalidated) entry.report('show_failed');
      release(owned);
      clear();
      settleStartup();
      retry();
      return false;
    }
  };

  const load = () => {
    if (stopped || !prepared || !sdkReady || !deps.consent().canRequestAds || current || retryTimer ||
        (deps.format === 'app_open' && launchCount < 3)) return;
    const report = deps.reporter(false);
    report('request');
    try {
      const ad = deps.create();
      const entry = { ad, loadedAt: null as number | null, invalidated: false, remove: () => {}, report };
      current = entry;
      entry.remove = ad.subscribe((event, payload) => {
        if (current !== entry) return;
        // A stopped/withdrawn controller retains ONLY the terminal listeners of a
        // presentation already in progress, so another controller cannot overlap it.
        if (event === 'closed' || event === 'error') {
          if (!stopped && !entry.invalidated) entry.report(event === 'closed' ? 'closed' : token ? 'show_failed' : 'load_failed');
          const owned = token;
          release(owned);
          clear();
          settleStartup();
          if (event === 'error') retry(); else load();
          return;
        }
        if (event === 'opened' && token) {
          const timestamp = deps.admission.impression(token, deps.now());
          if (timestamp !== null) deps.persistExposure(timestamp);
        }
        if (stopped || entry.invalidated || !deps.consent().canRequestAds) return;
        if (event === 'loaded') {
          entry.loadedAt = deps.now();
          entry.report('loaded');
          if (deps.format === 'app_open' && startupOpen) void show(true);
        } else if (event === 'opened') entry.report('opened');
        else if (event === 'clicked') entry.report('clicked');
        else if (event === 'paid' && token) entry.report('paid', payload);
      });
      ad.load();
    } catch {
      report('load_failed');
      clear();
      settleStartup();
      retry();
    }
  };

  const removeForeground = deps.subscribeForeground((active) => {
    if (!active && activeStartedAt !== null) {
      activeMs += Math.max(0, deps.now() - activeStartedAt);
      activeStartedAt = null;
    } else if (active && activeStartedAt === null) {
      activeStartedAt = deps.now();
      if (deps.format === 'app_open') void show();
    }
  });
  const initialize = async () => {
    if (stopped || !prepared || initializing || sdkReady ||
        lastInitializationGeneration === consentGeneration ||
        (deps.format === 'app_open' && launchCount < 3)) return;
    initializing = true;
    const generation = consentGeneration;
    lastInitializationGeneration = generation;
    try {
      sdkReady = await deps.initialize();
      if (!sdkReady) settleStartup();
      load();
    } catch {
      sdkReady = false;
      settleStartup();
    } finally {
      initializing = false;
      // Coalesce consent changes while the SDK was pending into one latest-
      // generation attempt. A failed attempt never retries its own generation.
      if (!stopped && !sdkReady && generation !== consentGeneration &&
          deps.consent().canRequestAds) void initialize();
    }
  };
  const removeConsent = deps.subscribeConsent(() => {
    const nextKey = JSON.stringify(deps.consent());
    if (nextKey === consentKey) return;
    consentKey = nextKey;
    consentGeneration++;
    if (retryTimer) clearTimeout(retryTimer);
    retryTimer = null;
    // Purpose changes invalidate requests made under the previous consent.
    if (!token) clear();
    else if (current) current.invalidated = true;
    if (!deps.consent().canRequestAds) settleStartup();
    else {
      load();
      void initialize().catch(settleStartup);
    }
  });

  void (async () => {
    const state = await deps.prepare();
    if (stopped) return;
    launchCount = state.launchCount;
    prepared = true;
    // Cooldown and excluded/unknown routes already rule out startup display.
    // Release content now, including when initialize() remains pending; a later
    // safe route may permit a warm resume but never reopens this startup window.
    if (deps.format === 'app_open' && (deps.admission.isCoolingDown(deps.now()) ||
        deps.appOpenRouteAllowed?.() !== true)) settleStartup();
    if (deps.format === 'app_open' && launchCount < 3) { settleStartup(); return; }
    await initialize();
  })().catch(settleStartup);

  return {
    startupReady,
    showIfEligible: () => show(),
    stop: () => {
      stopped = true;
      settleStartup();
      removeConsent();
      removeForeground();
      if (retryTimer) clearTimeout(retryTimer);
      retryTimer = null;
      // Native show cannot be cancelled. Keep its lock through close/error.
      if (!token) clear();
    },
  };
}

