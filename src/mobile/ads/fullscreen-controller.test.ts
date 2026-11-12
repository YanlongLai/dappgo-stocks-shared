import { FullscreenAdmission, FULLSCREEN_COOLDOWN_MS } from './admission';
import { createAdReporter } from './telemetry';
import { startFullscreenController, type FullscreenDependencies, type FullscreenAdEvent } from './fullscreen-controller';
function harness(overrides: Partial<FullscreenDependencies> = {}) {
  let consent = { canRequestAds: true, adStorage: true, adUserData: false, adPersonalization: false };
  let foreground = true;
  let consentListener = () => {};
  let foregroundListener = (_active: boolean) => {};
  const admission = new FullscreenAdmission(); admission.hydrate([]);
  const ads: { load: jest.Mock; show: jest.Mock; remove: jest.Mock; listener: (event: FullscreenAdEvent, payload?: unknown) => void }[] = [];
  const persist = jest.fn(); const report = jest.fn();
  const deps: FullscreenDependencies = {
    format: 'interstitial', admission, prepare: async () => ({ launchCount: 3 }), initialize: async () => true,
    consent: () => consent, subscribeConsent: (fn) => { consentListener = fn; return () => {}; },
    foreground: () => foreground, appOpenRouteAllowed: () => true,
    subscribeForeground: (fn) => { foregroundListener = fn; return () => {}; },
    create: () => {
      const ad = { load: jest.fn(), show: jest.fn().mockResolvedValue(undefined), remove: jest.fn(), listener: (_event: FullscreenAdEvent) => {} };
      ads.push(ad);
      return { ...ad, subscribe: (fn) => { ad.listener = fn; return ad.remove; } };
    },
    persistExposure: persist, reporter: () => report, now: () => Date.now(), startupWindowMs: 0, ...overrides,
  };
  const controller = startFullscreenController(deps);
  return { controller, ads, persist, report, admission,
    time: (value: number) => { jest.setSystemTime(value); },
    consent: (allowed: boolean) => { consent = { ...consent, canRequestAds: allowed }; consentListener(); },
    purpose: () => { consent = { ...consent, adPersonalization: !consent.adPersonalization }; consentListener(); },
    foreground: (active: boolean) => { foreground = active; foregroundListener(active); },
  };
}
async function flush() { for (let i = 0; i < 8; i++) await Promise.resolve(); }
// Existing lifecycle cases start with interstitial inventory at its preload age.
async function preloadInterstitial() { await flush(); await jest.advanceTimersByTimeAsync(4 * 60 * 1000); }
beforeEach(() => jest.useFakeTimers({ now: 1000 }));
afterEach(() => { jest.clearAllTimers(); jest.useRealTimers(); });
test('15 foreground minutes, background suppression, persistence only after opened', async () => {
  const h = harness(); await preloadInterstitial(); h.ads[0].listener('loaded');
  expect(await h.controller.showIfEligible()).toBe(false);
  h.time(901000); h.foreground(false);
  expect(await h.controller.showIfEligible()).toBe(false);
  h.foreground(true);
  expect(await h.controller.showIfEligible()).toBe(true); expect(h.persist).not.toHaveBeenCalled();
  h.ads[0].listener('opened'); expect(h.persist).toHaveBeenCalledWith(901000);
  h.ads[0].listener('closed'); h.ads[1].listener('loaded');
  expect(await h.controller.showIfEligible()).toBe(false); h.controller.stop();
});
test('withdrawal invalidates cached callbacks and regrant requests fresh inventory', async () => {
  const h = harness(); await preloadInterstitial(); const old = h.ads[0]; h.consent(false);
  expect(old.remove).toHaveBeenCalled();
  old.listener('loaded'); old.listener('opened'); old.listener('paid', { value: 1 }); h.time(901000);
  expect(await h.controller.showIfEligible()).toBe(false); expect(h.persist).not.toHaveBeenCalled();
  h.consent(true); expect(h.ads).toHaveLength(2);
  old.listener('loaded'); expect(await h.controller.showIfEligible()).toBe(false);
  h.ads[1].listener('loaded'); expect(await h.controller.showIfEligible()).toBe(true);
  h.ads[1].listener('closed'); h.controller.stop();
});
test('purpose-only changes invalidate cached inventory', async () => {
  const h = harness(); await preloadInterstitial(); h.ads[0].listener('loaded'); h.purpose();
  expect(h.ads[0].remove).toHaveBeenCalled(); expect(h.ads).toHaveLength(2); h.controller.stop();
});
test('stop during show keeps mutex until close; stale rejection cannot release another owner', async () => {
  const h = harness(); await preloadInterstitial(); h.ads[0].listener('loaded'); h.time(901000);
  let reject!: () => void;
  h.ads[0].show.mockImplementation(() => new Promise<void>((_resolve, fail) => { reject = () => fail(new Error('fail')); }));
  const showing = h.controller.showIfEligible(); h.controller.stop();
  const input = { now: 901000, foreground: true, canRequestAds: true, safeBoundary: true };
  expect(h.admission.acquire('app_open', input)).toBeNull(); h.ads[0].listener('closed');
  const other = h.admission.acquire('app_open', input)!; expect(other).not.toBeNull();
  reject(); await showing; expect(h.admission.acquire('interstitial', input)).toBeNull(); h.admission.release(other);
});
test('failed show never erases previous exposure', async () => {
  const admission = new FullscreenAdmission(); admission.hydrate([1000]);
  const h = harness({ admission }); await preloadInterstitial(); h.time(1000 + FULLSCREEN_COOLDOWN_MS); h.ads[0].listener('loaded');
  h.ads[0].show.mockRejectedValue(new Error('failure'));
  expect(await h.controller.showIfEligible()).toBe(false); expect(h.persist).not.toHaveBeenCalled();
  expect(admission.acquire('app_open', { now: 999, foreground: true, canRequestAds: true, safeBoundary: true })).toBeNull(); h.controller.stop();
});
test('cold start respects persisted cross-format cooldown and existing deadline', async () => {
  const admission = new FullscreenAdmission(); admission.hydrate([1000]);
  const h = harness({ admission, format: 'app_open', startupWindowMs: 1500 }); await flush();
  h.ads[0].listener('loaded'); expect(h.ads[0].show).not.toHaveBeenCalled();
  await jest.advanceTimersByTimeAsync(1500); await h.controller.startupReady;
  h.ads[0].listener('loaded'); expect(h.ads[0].show).not.toHaveBeenCalled(); h.controller.stop();
});
test('late initialization after withdrawal cannot load, regrant resumes safely', async () => {
  let finish!: (ready: boolean) => void;
  const h = harness({ initialize: () => new Promise((resolve) => { finish = resolve; }) });
  await preloadInterstitial(); h.consent(false); finish(true); await flush(); expect(h.ads).toHaveLength(0);
  h.consent(true); expect(h.ads).toHaveLength(1); h.controller.stop();
});
test('stop before prepare completes prevents initialization and load', async () => {
  let finish!: (state: { launchCount: number }) => void; const initialize = jest.fn(async () => true);
  const h = harness({ initialize, prepare: () => new Promise((resolve) => { finish = resolve; }) });
  h.controller.stop(); finish({ launchCount: 3 }); await flush();
  expect(initialize).not.toHaveBeenCalled(); expect(h.ads).toHaveLength(0);
});
test('initially denied SDK can initialize on later consent grant', async () => {
  const initialize = jest.fn().mockResolvedValueOnce(false).mockResolvedValue(true);
  const h = harness({ initialize }); await preloadInterstitial(); expect(h.ads).toHaveLength(0);
  h.consent(false); h.consent(true); await flush(); expect(h.ads).toHaveLength(1); h.controller.stop();
});
test('withdrawal during display quarantines callbacks even after regrant, retaining lock until close', async () => {
  const h = harness(); await preloadInterstitial(); h.time(901000); h.ads[0].listener('loaded');
  await h.controller.showIfEligible(); h.consent(false); h.consent(true);
  const count = h.report.mock.calls.length;
  h.ads[0].listener('paid', { value: 1, currency: 'USD', precision: 1 });
  expect(h.report).toHaveBeenCalledTimes(count);
  expect(h.admission.acquire('app_open', { now: 901000, foreground: true, canRequestAds: true, safeBoundary: true })).toBeNull();
  h.ads[0].listener('closed'); expect(h.report).toHaveBeenCalledTimes(count + 1); // New request only.
  expect(h.ads).toHaveLength(2); h.controller.stop();
});
test('rejected presentation after withdrawal and regrant does not emit stale telemetry', async () => {
  const h = harness(); await preloadInterstitial(); h.time(901000); h.ads[0].listener('loaded');
  let reject!: () => void;
  h.ads[0].show.mockImplementation(() => new Promise<void>((_resolve, fail) => {
    reject = () => fail(new Error('failed'));
  }));
  const showing = h.controller.showIfEligible();
  h.consent(false); h.consent(true);
  const count = h.report.mock.calls.length;
  reject(); expect(await showing).toBe(false);
  expect(h.report).toHaveBeenCalledTimes(count);
  h.controller.stop();
});

function deferredInitialization() {
  let resolve!: (value: boolean) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<boolean>((pass, fail) => { resolve = pass; reject = fail; });
  return { promise, resolve, reject };
}

test.each(['false', 'reject'] as const)('pending initialization %s recovers once for a newer grant', async (outcome) => {
  const pending = deferredInitialization();
  const initialize = jest.fn().mockReturnValueOnce(pending.promise).mockResolvedValue(true);
  const h = harness({ initialize }); await preloadInterstitial();
  h.consent(false); h.consent(true); h.consent(true);
  expect(initialize).toHaveBeenCalledTimes(1);
  if (outcome === 'false') pending.resolve(false); else pending.reject(new Error('initialization failed'));
  await flush();
  expect(initialize).toHaveBeenCalledTimes(2);
  expect(h.ads).toHaveLength(1);
  await jest.advanceTimersByTimeAsync(120000);
  expect(initialize).toHaveBeenCalledTimes(2);
  h.controller.stop();
});

test.each(['false', 'reject'] as const)('initialization %s never retries an unchanged generation', async (outcome) => {
  const initialize = jest.fn(() => outcome === 'false' ? Promise.resolve(false) : Promise.reject(new Error('failed')));
  const h = harness({ initialize }); await preloadInterstitial();
  h.consent(true); h.foreground(false); h.foreground(true);
  await jest.advanceTimersByTimeAsync(120000); await flush();
  expect(initialize).toHaveBeenCalledTimes(1); expect(h.ads).toHaveLength(0);
  h.consent(false); h.consent(true); await flush();
  expect(initialize).toHaveBeenCalledTimes(2);
  await jest.advanceTimersByTimeAsync(120000); await flush();
  expect(initialize).toHaveBeenCalledTimes(2); expect(h.ads).toHaveLength(0);
  h.controller.stop();
});

test.each(['false', 'reject', 'true'] as const)('pending initialization %s cannot resume while withdrawn or stopped', async (outcome) => {
  for (const stopped of [false, true]) {
    const pending = deferredInitialization();
    const initialize = jest.fn().mockReturnValueOnce(pending.promise).mockResolvedValue(true);
    const h = harness({ initialize }); await preloadInterstitial();
    h.consent(false); h.consent(true);
    if (stopped) h.controller.stop(); else h.consent(false);
    if (outcome === 'reject') pending.reject(new Error('failed')); else pending.resolve(outcome === 'true');
    await flush(); await jest.advanceTimersByTimeAsync(120000);
    expect(initialize).toHaveBeenCalledTimes(1); expect(h.ads).toHaveLength(0);
    expect(await h.controller.showIfEligible()).toBe(false);
    h.controller.stop();
  }
});

test('multiple pending consent changes coalesce, and a failed recovery waits for a fresh generation', async () => {
  const pending = deferredInitialization();
  const initialize = jest.fn().mockReturnValueOnce(pending.promise).mockResolvedValueOnce(false).mockResolvedValue(true);
  const h = harness({ initialize }); await preloadInterstitial();
  h.consent(false); h.consent(true); h.purpose(); h.purpose();
  pending.resolve(false); await flush();
  expect(initialize).toHaveBeenCalledTimes(2); expect(h.ads).toHaveLength(0);
  await jest.advanceTimersByTimeAsync(120000);
  expect(initialize).toHaveBeenCalledTimes(2);
  h.purpose(); await flush();
  expect(initialize).toHaveBeenCalledTimes(3); expect(h.ads).toHaveLength(1);
  h.controller.stop();
});

test.each(['interstitial', 'app_open'] as const)('%s retains the reporter across load and a warm show', async (format) => {
  const emit = jest.fn();
  const reporter = jest.fn((startup: boolean) => createAdReporter({
    app: 'us_stocks', platform: 'ios', format,
    placement: format === 'interstitial' ? 'research_exit' : startup ? 'app_open_startup' : 'app_open_resume',
  }, () => ({ canRequestAds: true, analyticsStorage: true }), emit));
  const h = harness({ format, reporter }); await flush();
  if (format === 'interstitial') await preloadInterstitial();
  const paid = { value: 0.01, currency: 'USD', precision: 1 };
  // A queued SDK callback before any presentation cannot represent this ad's revenue.
  h.ads[0].listener('paid', paid);
  expect(emit.mock.calls.filter(([event]) => event.name === 'dgo_ad_paid')).toHaveLength(0);
  h.time(901000); h.ads[0].listener('loaded'); await h.controller.showIfEligible();
  h.ads[0].listener('paid', paid); h.ads[0].listener('paid', paid);
  expect(reporter).toHaveBeenCalledTimes(1);
  expect(emit.mock.calls.filter(([event]) => event.name === 'dgo_ad_paid')).toHaveLength(1);
  h.ads[0].listener('closed'); h.controller.stop();
});

test('startup presentation keeps startup placement and one paid emission', async () => {
  const emit = jest.fn();
  const reporter = jest.fn((startup: boolean) => createAdReporter({
    app: 'us_stocks', platform: 'ios', format: 'app_open',
    placement: startup ? 'app_open_startup' : 'app_open_resume',
  }, () => ({ canRequestAds: true, analyticsStorage: true }), emit));
  const h = harness({ format: 'app_open', startupWindowMs: 1500, reporter }); await flush();
  h.ads[0].listener('loaded'); await flush();
  expect(h.ads[0].show).toHaveBeenCalledTimes(1);
  const paid = { value: 0.01, currency: 'USD', precision: 1 };
  h.ads[0].listener('paid', paid); h.ads[0].listener('paid', paid);
  const paidEvents = emit.mock.calls.filter(([event]) => event.name === 'dgo_ad_paid');
  expect(paidEvents).toHaveLength(1);
  expect(paidEvents[0][0].params.placement).toBe('app_open_startup');
  h.ads[0].listener('closed'); await h.controller.startupReady; h.controller.stop();
});
test('known persisted cooldown releases startup immediately even while SDK initialization is pending', async () => {
  const admission = new FullscreenAdmission(); admission.hydrate([999]);
  const pending = deferredInitialization();
  const h = harness({ format: 'app_open', admission, startupWindowMs: 1500, initialize: () => pending.promise });
  let settled = false;
  void h.controller.startupReady.then(() => { settled = true; });
  await flush();
  expect(settled).toBe(true); // No timer advancement.
  expect(jest.getTimerCount()).toBe(0);
  pending.resolve(true); await flush();
  h.ads[0].listener('loaded'); expect(h.ads[0].show).not.toHaveBeenCalled();
  h.controller.stop();
});
test('app-open route gate defaults to deny and rechecks the route at every resume', async () => {
  const unknown = harness({ format: 'app_open', appOpenRouteAllowed: undefined }); await flush();
  unknown.ads[0].listener('loaded'); unknown.foreground(false); unknown.foreground(true);
  expect(unknown.ads[0].show).not.toHaveBeenCalled();
  expect(await unknown.controller.showIfEligible()).toBe(false); unknown.controller.stop();
  let allowed = true;
  const h = harness({ format: 'app_open', appOpenRouteAllowed: () => allowed }); await flush();
  h.ads[0].listener('loaded'); allowed = false;
  h.foreground(false); h.foreground(true); expect(h.ads[0].show).not.toHaveBeenCalled();
  allowed = true; expect(h.ads[0].show).not.toHaveBeenCalled(); // Route updates alone cannot present.
  h.foreground(false); h.foreground(true); await flush();
  expect(h.ads[0].show).toHaveBeenCalledTimes(1);
  h.ads[0].listener('closed'); h.controller.stop();
});
test('a blocked current route also suppresses an already queued startup load callback', async () => {
  let allowed = true;
  const h = harness({ format: 'app_open', startupWindowMs: 1500, appOpenRouteAllowed: () => allowed });
  await flush(); allowed = false; h.ads[0].listener('loaded'); await flush();
  expect(h.ads[0].show).not.toHaveBeenCalled(); h.controller.stop();
});
test.each([false, undefined])('excluded/unknown startup route (%s) releases immediately while initialization is pending', async (route) => {
  let allowed = route;
  const pending = deferredInitialization();
  const h = harness({
    format: 'app_open', startupWindowMs: 1500, initialize: () => pending.promise,
    appOpenRouteAllowed: route === undefined ? undefined : () => allowed === true,
  });
  let settled = false;
  void h.controller.startupReady.then(() => { settled = true; });
  await flush();
  expect(settled).toBe(true);
  expect(jest.getTimerCount()).toBe(0);
  // Becoming eligible cannot turn a late SDK load into a startup presentation.
  allowed = true; pending.resolve(true); await flush();
  h.ads[0].listener('loaded'); await flush();
  expect(h.ads[0].show).not.toHaveBeenCalled();
  if (route === false) {
    h.foreground(false); h.foreground(true); await flush();
    expect(h.ads[0].show).toHaveBeenCalledTimes(1);
    h.ads[0].listener('closed');
  }
  h.controller.stop();
});

const formats = ['rewarded', 'interstitial', 'app_open'] as const;
async function requestingHarness(format: typeof formats[number]) {
  const h = harness({ format });
  await flush();
  if (format === 'interstitial') await jest.advanceTimersByTimeAsync(4 * 60 * 1000);
  if (format === 'rewarded') h.controller.refreshInventory();
  expect(h.ads).toHaveLength(1);
  return h;
}
async function exhaust(h: ReturnType<typeof harness>) {
  for (let n = 1; n <= 5; n++) {
    h.ads[n - 1].listener('error');
    if (n < 5) await jest.advanceTimersByTimeAsync(30_000 * 2 ** (n - 1));
  }
}

test.each(formats)('%s backs off exponentially and stops after exactly five failed requests', async (format) => {
  const h = await requestingHarness(format);
  for (let n = 1; n <= 5; n++) {
    h.ads[n - 1].listener('error');
    // Polling cannot bypass either backoff or exhaustion.
    h.controller.refreshInventory(); h.controller.refreshInventory();
    expect(h.ads).toHaveLength(n);
    if (n < 5) {
      await jest.advanceTimersByTimeAsync(30_000 * 2 ** (n - 1) - 1);
      h.controller.refreshInventory(); expect(h.ads).toHaveLength(n);
      await jest.advanceTimersByTimeAsync(1); expect(h.ads).toHaveLength(n + 1);
    }
  }
  expect(jest.getTimerCount()).toBe(0);
  await jest.advanceTimersByTimeAsync(60 * 60 * 1000);
  expect(h.ads).toHaveLength(5);
  expect(h.ads.every(ad => ad.load.mock.calls.length === 1)).toBe(true);
  h.controller.stop();
});

test.each(formats)('%s loaded resets the next failure to a 30-second backoff', async (format) => {
  const h = await requestingHarness(format);
  h.ads[0].listener('error'); await jest.advanceTimersByTimeAsync(30_000);
  h.ads[1].listener('error'); await jest.advanceTimersByTimeAsync(60_000);
  h.ads[2].listener('loaded'); h.ads[2].listener('error');
  await jest.advanceTimersByTimeAsync(29_999); expect(h.ads).toHaveLength(3);
  await jest.advanceTimersByTimeAsync(1); expect(h.ads).toHaveLength(4);
  h.controller.stop();
});

test.each(formats)('%s cancels retries in background and reloads once on resume', async (format) => {
  const h = await requestingHarness(format);
  h.ads[0].listener('error');
  expect(jest.getTimerCount()).toBe(1);
  h.foreground(false); expect(jest.getTimerCount()).toBe(0);
  await jest.advanceTimersByTimeAsync(60 * 60 * 1000);
  h.controller.refreshInventory(); expect(h.ads).toHaveLength(1);
  h.foreground(true); h.foreground(true); h.controller.refreshInventory();
  expect(h.ads).toHaveLength(2);
  h.controller.stop();
});

test.each(formats)('%s cannot load after initialization or consent changes in background', async (format) => {
  const h = harness({ format }); h.foreground(false);
  await flush(); h.purpose(); h.controller.refreshInventory();
  await jest.advanceTimersByTimeAsync(60 * 60 * 1000);
  expect(h.ads).toHaveLength(0); expect(jest.getTimerCount()).toBe(0);
  h.foreground(true);
  if (format === 'rewarded') {
    expect(h.ads).toHaveLength(0); h.controller.refreshInventory();
  } else if (format === 'interstitial') {
    expect(h.ads).toHaveLength(0); await jest.advanceTimersByTimeAsync(4 * 60 * 1000);
  }
  expect(h.ads).toHaveLength(1); h.controller.stop();
});

test.each(formats)('%s refresh after exhaustion waits ten minutes from the last failure', async (format) => {
  const h = await requestingHarness(format); await exhaust(h);
  await jest.advanceTimersByTimeAsync(10 * 60 * 1000 - 1);
  h.controller.refreshInventory(); expect(h.ads).toHaveLength(5);
  expect(jest.getTimerCount()).toBe(0);
  await jest.advanceTimersByTimeAsync(1);
  h.controller.refreshInventory(); h.controller.refreshInventory();
  expect(h.ads).toHaveLength(6);
  h.controller.stop();
});

test.each(formats)('%s resume respects the 480-second fifth-failure gate and ten-minute maximum', async (format) => {
  const h = await requestingHarness(format); await exhaust(h);
  h.foreground(false); h.foreground(true);
  await jest.advanceTimersByTimeAsync(480_000 - 1);
  h.controller.refreshInventory(); expect(h.ads).toHaveLength(5);
  await jest.advanceTimersByTimeAsync(1); expect(h.ads).toHaveLength(6);
  h.ads[5].listener('error');
  h.foreground(false); h.foreground(true);
  await jest.advanceTimersByTimeAsync(600_000 - 1); expect(h.ads).toHaveLength(6);
  await jest.advanceTimersByTimeAsync(1); expect(h.ads).toHaveLength(7);
  h.controller.stop();
});

test.each(formats)('%s consent changes reset the counter while retaining the load deadline', async (format) => {
  const h = await requestingHarness(format); await exhaust(h);
  h.purpose(); h.controller.refreshInventory();
  await jest.advanceTimersByTimeAsync(480_000 - 1); expect(h.ads).toHaveLength(5);
  await jest.advanceTimersByTimeAsync(1); expect(h.ads).toHaveLength(6);
  h.ads[5].listener('error');
  await jest.advanceTimersByTimeAsync(29_999); expect(h.ads).toHaveLength(6);
  await jest.advanceTimersByTimeAsync(1); expect(h.ads).toHaveLength(7);
  h.controller.stop();
});

test('rewarded requests inventory only after refresh, including after consent changes and close', async () => {
  const h = harness({ format: 'rewarded' }); await flush();
  h.purpose(); h.consent(false); h.consent(true);
  await jest.advanceTimersByTimeAsync(60 * 60 * 1000);
  h.foreground(false); h.foreground(true);
  expect(h.ads).toHaveLength(0);
  h.controller.refreshInventory(); h.controller.refreshInventory();
  expect(h.ads).toHaveLength(1);
  h.ads[0].listener('loaded');
  expect(await h.controller.showIfEligible('rewarded_opt_in')).toBe(true);
  h.ads[0].listener('closed'); expect(h.ads).toHaveLength(1);
  h.purpose(); await flush(); expect(h.ads).toHaveLength(1);
  h.controller.refreshInventory(); expect(h.ads).toHaveLength(2);
  h.controller.stop();
});

test('interstitial preload uses one timer for four active minutes, pausing in background', async () => {
  const h = harness(); await flush();
  expect(h.ads).toHaveLength(0); expect(jest.getTimerCount()).toBe(1);
  for (let i = 0; i < 10; i++) h.controller.refreshInventory();
  expect(jest.getTimerCount()).toBe(1);
  await jest.advanceTimersByTimeAsync(2 * 60 * 1000);
  h.foreground(false); expect(jest.getTimerCount()).toBe(0);
  await jest.advanceTimersByTimeAsync(60 * 60 * 1000);
  expect(h.ads).toHaveLength(0);
  h.foreground(true); expect(jest.getTimerCount()).toBe(1);
  await jest.advanceTimersByTimeAsync(2 * 60 * 1000 - 1); expect(h.ads).toHaveLength(0);
  await jest.advanceTimersByTimeAsync(1); expect(h.ads).toHaveLength(1);
  h.ads[0].listener('loaded');
  expect(await h.controller.showIfEligible()).toBe(false);
  await jest.advanceTimersByTimeAsync(60_000);
  expect(h.ads).toHaveLength(1);
  expect(await h.controller.showIfEligible()).toBe(true);
  h.ads[0].listener('closed'); h.controller.stop();
});

test.each(['create', 'load'] as const)('synchronous %s failures also stop after five requests', async (stage) => {
  const create = jest.fn(() => {
    if (stage === 'create') throw new Error('create failed');
    return { load: () => { throw new Error('load failed'); }, show: async () => {}, subscribe: () => () => {} };
  });
  const h = harness({ format: 'app_open', create }); await flush();
  await jest.advanceTimersByTimeAsync(60 * 60 * 1000);
  expect(create).toHaveBeenCalledTimes(5);
  expect(h.report.mock.calls.filter(([event]) => event === 'load_failed')).toHaveLength(5);
  h.controller.stop();
});

test.each(['rejection', 'error event'] as const)('show %s uses failure backoff and cannot double-retry', async (failure) => {
  const h = await requestingHarness('rewarded'); h.ads[0].listener('loaded');
  h.ads[0].show.mockImplementation(async () => {
    if (failure === 'error event') h.ads[0].listener('error');
    throw new Error('show failed');
  });
  expect(await h.controller.showIfEligible('rewarded_opt_in')).toBe(false);
  h.controller.refreshInventory();
  await jest.advanceTimersByTimeAsync(29_999); expect(h.ads).toHaveLength(1);
  await jest.advanceTimersByTimeAsync(1); expect(h.ads).toHaveLength(2);
  expect(jest.getTimerCount()).toBe(0);
  h.controller.stop();
});
