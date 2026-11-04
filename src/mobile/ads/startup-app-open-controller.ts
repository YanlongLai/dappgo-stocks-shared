import type { AdmissionToken } from './admission';
import type { FullscreenAd, FullscreenController, FullscreenDependencies } from './fullscreen-controller';

/** A cold-start ticket ends before content is released and can never become a warm ad. */
export function startStartupAppOpenController(deps: FullscreenDependencies): FullscreenController {
  const startupTicket = deps.admission.reserveStartupOpportunity();
  let resolveStartup!: () => void;
  const startupReady = new Promise<void>((resolve) => { resolveStartup = resolve; });
  const startedAt = deps.now();
  const readinessMs = deps.startupReadinessMs ?? 30_000;
  let deadline = startedAt + readinessMs;
  let inventoryStarted = false;
  let settled = false;
  let stopped = false;
  let prepared = false;
  let initializing = false;
  let sdkReady = false;
  let admitted = false;
  let generation = 0;
  let token: AdmissionToken | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let removeConsent = () => {};
  let removeForeground = () => {};
  const decision = () => deps.startupDecision?.() ?? (deps.consent().canRequestAds ? 'allowed' : 'pending');
  let consentKey = JSON.stringify([deps.consent(), decision()]);
  type Entry = { ad: FullscreenAd; loaded: boolean; presenting: boolean; invalidated: boolean; remove: () => void };
  let current: Entry | null = null;
  const report = deps.reporter(true, 'app_open_startup');

  const dispose = () => {
    current?.remove();
    current = null;
    removeConsent();
    removeForeground();
  };
  const settle = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    if (!settled) { settled = true; resolveStartup(); }
    // A native presentation owns the global mutex until its actual close/error.
    if (!current?.presenting) dispose();
  };
  const inWindow = () => !stopped && !settled && !admitted &&
    Number.isFinite(deps.now()) && deps.now() >= startedAt && deps.now() < deadline;
  const release = () => {
    if (token) deps.admission.release(token);
    token = null;
  };
  const terminate = (event: 'closed' | 'error', entry: Entry) => {
    if (!stopped && !entry.invalidated) report(event === 'closed' ? 'closed' : entry.presenting ? 'show_failed' : 'load_failed');
    release();
    entry.presenting = false;
    settle();
  };
  const show = () => {
    const entry = current;
    if (!entry?.loaded || entry.presenting) return;
    if (!inWindow() || decision() === 'denied' || deps.appOpenRouteAllowed?.() !== true) { settle(); return; }
    // System authentication/consent may briefly make the app inactive. Wait
    // within the same loading window; never interpret that as a warm launch.
    if (!deps.foreground() || decision() !== 'allowed' || !deps.consent().canRequestAds) return;
    token = deps.admission.acquire('app_open', {
      now: deps.now(), foreground: true, canRequestAds: true, safeBoundary: true,
      trigger: 'app_open_startup', startupTicket: startupTicket ?? undefined,
    });
    if (!token) { settle(); return; }
    admitted = true;
    entry.presenting = true;
    if (timer) clearTimeout(timer);
    timer = setTimeout(settle, 30_000);
    report('show_attempt');
    void Promise.resolve().then(() => {
      // Recheck after admission: access can be withdrawn before the native call.
      const now = deps.now();
      if (stopped || settled || entry.invalidated || !Number.isFinite(now) || now < startedAt || now >= deadline ||
          !deps.foreground() || decision() !== 'allowed' ||
          !deps.consent().canRequestAds || deps.appOpenRouteAllowed?.() !== true) throw new Error('Startup access withdrawn');
      return entry.ad.show();
    }).catch(() => { if (current === entry) terminate('error', entry); });
  };
  const load = () => {
    if (!inWindow() || !prepared || !sdkReady || current) return;
    if (decision() === 'denied' || deps.appOpenRouteAllowed?.() !== true) { settle(); return; }
    if (decision() !== 'allowed' || !deps.consent().canRequestAds || !deps.foreground()) return;
    // Time spent resolving identity or showing privacy prompts must not consume
    // the inventory window. Neither stage may continue after content is released.
    if (!inventoryStarted) {
      inventoryStarted = true;
      deadline = deps.now() + deps.startupWindowMs;
      if (timer) clearTimeout(timer);
      timer = setTimeout(settle, deps.startupWindowMs);
    }
    report('request');
    try {
      const ad = deps.create();
      const entry: Entry = { ad, loaded: false, presenting: false, invalidated: false, remove: () => {} };
      current = entry;
      entry.remove = ad.subscribe((event, payload) => {
        if (current !== entry) return;
        if (event === 'closed' || event === 'error') { terminate(event, entry); return; }
        if (event === 'opened' && token && entry.presenting) {
          const timestamp = deps.admission.impression(token, deps.now());
          if (timestamp !== null) deps.persistExposure(timestamp);
        }
        if (stopped || entry.invalidated || !deps.consent().canRequestAds) return;
        if (event === 'loaded') {
          entry.loaded = true;
          report('loaded');
          show();
        } else if (event === 'opened' && token && entry.presenting) report('opened');
        else if (event === 'paid' && token && entry.presenting) report('paid', payload);
        else if (event === 'clicked' && token && entry.presenting) report('clicked');
      });
      ad.load();
    } catch {
      report('load_failed');
      settle();
    }
  };
  const initialize = async () => {
    if (!inWindow() || !prepared || initializing || sdkReady) return;
    if (decision() === 'denied') { settle(); return; }
    initializing = true;
    const revision = generation;
    try {
      sdkReady = await deps.initialize();
      if (!inWindow()) return;
      if (decision() === 'denied') settle();
      else load();
    } catch { settle(); }
    finally {
      initializing = false;
      // Pending IAP/UMP/ATT is not denial. Retry only after a real state change.
      if (inWindow() && !sdkReady && revision !== generation) void initialize();
    }
  };
  removeConsent = deps.subscribeConsent(() => {
    const next = JSON.stringify([deps.consent(), decision()]);
    if (next === consentKey) return;
    consentKey = next;
    generation++;
    if (current) {
      current.invalidated = true;
      if (!current.presenting) settle();
      return;
    }
    if (!inWindow()) return;
    if (decision() === 'denied') settle();
    else if (sdkReady) load();
    else void initialize();
  });
  removeForeground = deps.subscribeForeground((active) => {
    if (current?.presenting) return;
    if (!active && deps.background?.() === true) { settle(); return; }
    if (active && inWindow()) { if (current?.loaded) show(); else if (sdkReady) load(); else void initialize(); }
  });
  if (startupTicket === null || !Number.isFinite(startedAt) || startedAt <= 0 || !Number.isFinite(readinessMs) || readinessMs <= 0 || !Number.isFinite(deps.startupWindowMs) ||
      deps.startupWindowMs <= 0 || decision() === 'denied') settle();
  else {
    timer = setTimeout(settle, readinessMs);
    void Promise.resolve().then(() => deps.prepare()).then(() => {
      prepared = true;
      return initialize();
    }).catch(settle);
  }
  return {
    startupReady,
    isReadyToShow: () => false,
    refreshInventory: () => {},
    showIfEligible: async () => false,
    stop: () => { stopped = true; if (current) current.invalidated = true; settle(); },
  };
}
