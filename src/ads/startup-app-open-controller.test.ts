import { FullscreenAdmission, FULLSCREEN_COOLDOWN_MS } from './admission';
import { startFullscreenController, type FullscreenAdEvent, type FullscreenDependencies } from './fullscreen-controller';

async function flush() { for (let i = 0; i < 30; i++) await Promise.resolve(); }

function harness(overrides: Partial<FullscreenDependencies> = {}) {
  let authorization: 'pending' | 'allowed' | 'denied' = 'allowed';
  let active = true;
  let background = false;
  let routeAllowed = true;
  let consentChanged = () => {};
  let foregroundChanged = (_active: boolean) => {};
  const admission = new FullscreenAdmission();
  admission.hydrate([Date.now() - 10]);
  const ads: { load: jest.Mock; show: jest.Mock; removed: jest.Mock; emit(event: FullscreenAdEvent): void }[] = [];
  const report = jest.fn();
  const initialize = jest.fn(async () => true);
  const deps: FullscreenDependencies = {
    format: 'app_open', appOpenMode: 'startup-only', startupWindowMs: 6_000,
    admission, prepare: jest.fn(async () => ({ launchCount: 1 })), initialize,
    consent: () => ({ canRequestAds: authorization === 'allowed', adStorage: false, adUserData: false, adPersonalization: false }),
    startupDecision: () => authorization,
    subscribeConsent: (listener) => { consentChanged = listener; return () => { consentChanged = () => {}; }; },
    foreground: () => active, background: () => background,
    appOpenRouteAllowed: () => routeAllowed,
    subscribeForeground: (listener) => { foregroundChanged = listener; return () => { foregroundChanged = () => {}; }; },
    create: jest.fn(() => {
      let listener: (event: FullscreenAdEvent) => void = () => {};
      const ad = {
        load: jest.fn(), show: jest.fn(async () => {}), removed: jest.fn(),
        // Deliberately allow stale callbacks after unsubscribe to test the guard.
        emit: (event: FullscreenAdEvent) => listener(event),
        subscribe: (next: typeof listener) => { listener = next; return ad.removed; },
      };
      ads.push(ad);
      return ad;
    }),
    persistExposure: jest.fn(), reporter: () => report, now: Date.now,
    ...overrides,
  };
  return {
    deps, ads, admission: deps.admission, report, initialize,
    authorize: (next: typeof authorization) => { authorization = next; consentChanged(); },
    inactive: () => { active = false; background = false; foregroundChanged(false); },
    background: () => { active = false; background = true; foregroundChanged(false); },
    resume: () => { active = true; background = false; foregroundChanged(true); },
    setRoute: (next: boolean) => { routeAllowed = next; },
    start: () => startFullscreenController(deps),
  };
}

beforeEach(() => { jest.useFakeTimers(); jest.setSystemTime(1_000_000); });
afterEach(() => { jest.clearAllTimers(); jest.useRealTimers(); });

test('first launch waits for genuine identity/privacy, shows one startup ad, then releases content on close', async () => {
  const h = harness(); h.authorize('pending');
  const c = h.start(); const ready = jest.fn(); void c.startupReady.then(ready);
  await flush(); expect(h.ads).toHaveLength(0); expect(ready).not.toHaveBeenCalled();
  h.authorize('allowed'); await flush(); expect(h.ads).toHaveLength(1);
  h.ads[0].emit('loaded'); await flush(); expect(h.ads[0].show).toHaveBeenCalledTimes(1);
  expect(ready).not.toHaveBeenCalled();
  h.ads[0].emit('opened'); h.ads[0].emit('opened');
  expect(h.deps.persistExposure).toHaveBeenCalledTimes(1);
  h.ads[0].emit('closed'); await c.startupReady; await flush();
  expect(ready).toHaveBeenCalledTimes(1);
  h.resume(); h.authorize('allowed'); c.refreshInventory();
  expect(await c.showIfEligible()).toBe(false); expect(h.ads).toHaveLength(1);
  c.stop();
});

test('an initialization attempt returning false while pending is not denial', async () => {
  const h = harness(); h.authorize('pending'); h.initialize.mockResolvedValueOnce(false).mockResolvedValue(true);
  const c = h.start(); const ready = jest.fn(); void c.startupReady.then(ready);
  await flush(); expect(ready).not.toHaveBeenCalled();
  h.authorize('allowed'); await flush();
  expect(h.initialize).toHaveBeenCalledTimes(2); expect(h.ads).toHaveLength(1); c.stop();
});

test('known paid or unavailable authorization skips without requesting inventory', async () => {
  const h = harness(); h.authorize('denied'); const c = h.start();
  await c.startupReady; await flush();
  expect(h.deps.prepare).not.toHaveBeenCalled(); expect(h.initialize).not.toHaveBeenCalled(); expect(h.ads).toHaveLength(0);
});

test('deadline releases content even when identity/SDK never completes, and late readiness cannot load', async () => {
  let resolve!: (value: boolean) => void;
  const h = harness({ initialize: () => new Promise<boolean>((done) => { resolve = done; }) });
  const c = h.start(); await flush(); await jest.advanceTimersByTimeAsync(30_000); await c.startupReady;
  resolve(true); h.resume(); await flush(); expect(h.ads).toHaveLength(0);
});

test('late loaded inventory is discarded and cannot appear on a warm resume', async () => {
  const h = harness(); const c = h.start(); await flush();
  await jest.advanceTimersByTimeAsync(6_000); await c.startupReady;
  h.ads[0].emit('loaded'); h.resume(); await flush();
  expect(h.ads[0].show).not.toHaveBeenCalled(); expect(h.ads[0].removed).toHaveBeenCalledTimes(1);
});

test('privacy preparation has a separate bounded budget and cannot consume the six-second inventory window', async () => {
  const h = harness(); h.authorize('pending');
  const c = h.start(); const ready = jest.fn(); void c.startupReady.then(ready);
  await flush(); await jest.advanceTimersByTimeAsync(20_000);
  expect(ready).not.toHaveBeenCalled(); expect(h.ads).toHaveLength(0);
  h.authorize('allowed'); await flush(); expect(h.ads).toHaveLength(1);
  await jest.advanceTimersByTimeAsync(5_999); h.ads[0].emit('loaded'); await flush();
  expect(h.ads[0].show).toHaveBeenCalledTimes(1);
  h.ads[0].emit('closed'); await c.startupReady;
});

test('unresolved privacy releases startup at the readiness deadline and never becomes a late ad', async () => {
  const h = harness(); h.authorize('pending'); const c = h.start();
  await flush(); await jest.advanceTimersByTimeAsync(30_000); await c.startupReady;
  h.authorize('allowed'); h.resume(); await flush(); expect(h.ads).toHaveLength(0);
});

test('a brief system inactive state waits within the ticket, but real background consumes it', async () => {
  const h = harness(); const c = h.start(); await flush();
  h.inactive(); h.ads[0].emit('loaded'); await flush(); expect(h.ads[0].show).not.toHaveBeenCalled();
  h.resume(); await flush(); expect(h.ads[0].show).toHaveBeenCalledTimes(1); h.ads[0].emit('closed'); await c.startupReady;
  const other = harness(); const second = other.start(); await flush(); other.background(); await second.startupReady;
  other.ads[0].emit('loaded'); other.resume(); await flush(); expect(other.ads[0].show).not.toHaveBeenCalled();
});

test.each(['denied', 'route', 'inactive'] as const)('withdrawal at native-call boundary (%s) cannot show', async (kind) => {
  const h = harness(); const c = h.start(); await flush();
  h.ads[0].emit('loaded');
  if (kind === 'denied') h.authorize('denied');
  else if (kind === 'route') h.setRoute(false);
  else h.inactive();
  await flush(); await c.startupReady; expect(h.ads[0].show).not.toHaveBeenCalled();
  expect(h.admission.acquire('rewarded', { now: Date.now(), foreground: true, canRequestAds: true, safeBoundary: true, trigger: 'rewarded_opt_in' })).not.toBeNull();
});

test('a delayed native-call microtask cannot show after the inventory deadline', async () => {
  const h = harness(); const c = h.start(); await flush(); h.ads[0].emit('loaded');
  jest.setSystemTime(Date.now() + 6_000);
  await flush(); await c.startupReady;
  expect(h.ads[0].show).not.toHaveBeenCalled();
});

test.each(['closed', 'error'] as const)('stop and fallback timeout retain the shared mutex until native %s', async (terminal) => {
  const h = harness(); const c = h.start(); await flush(); h.ads[0].emit('loaded'); await flush();
  h.ads[0].emit('opened'); h.authorize('denied'); c.stop(); await c.startupReady;
  await jest.advanceTimersByTimeAsync(30_000);
  const input = { now: Date.now(), foreground: true, canRequestAds: true, safeBoundary: true, trigger: 'rewarded_opt_in' as const };
  expect(h.admission.acquire('rewarded', input)).toBeNull();
  h.ads[0].emit(terminal);
  expect(h.admission.acquire('rewarded', input)).not.toBeNull();
  expect(h.ads[0].removed).toHaveBeenCalledTimes(1);
});

test('SDK load and show errors release the loading screen without retries', async () => {
  const h = harness(); const c = h.start(); await flush(); h.ads[0].emit('error'); await c.startupReady;
  await jest.advanceTimersByTimeAsync(60_000); h.resume(); expect(h.ads).toHaveLength(1);
  const other = harness(); const second = other.start(); await flush(); other.ads[0].show.mockRejectedValue(new Error('SDK failure'));
  other.ads[0].emit('loaded'); await flush(); await second.startupReady; expect(other.ads).toHaveLength(1);
});

test('cold startup ignores in-session frequency gates once, but cannot bypass rollback or another fullscreen owner', async () => {
  const h = harness(); const c = h.start(); await flush(); h.ads[0].emit('loaded'); await flush(); h.ads[0].emit('closed'); await c.startupReady;
  const input = { now: Date.now(), foreground: true, canRequestAds: true, safeBoundary: true, trigger: 'app_open_startup' as const };
  expect(h.admission.acquire('app_open', input)).toBeNull();
  const rollback = new FullscreenAdmission(); rollback.hydrate([Date.now() + 1]);
  expect(rollback.acquire('app_open', { ...input, startupTicket: rollback.reserveStartupOpportunity()! })).toBeNull();
  const busy = new FullscreenAdmission(); busy.hydrate([]);
  expect(busy.acquire('rewarded', { ...input, trigger: 'rewarded_opt_in' })).not.toBeNull();
  expect(busy.acquire('app_open', { ...input, startupTicket: busy.reserveStartupOpportunity()! })).toBeNull();
});

test.each(['timeout', 'error', 'stop', 'background', 'paid'] as const)('a startup skipped by %s still consumes the process ticket', async (reason) => {
  const h = harness();
  if (reason === 'paid') h.authorize('denied');
  const first = h.start(); await flush();
  if (reason === 'timeout') await jest.advanceTimersByTimeAsync(6_000);
  else if (reason === 'error') h.ads[0].emit('error');
  else if (reason === 'stop') first.stop();
  else if (reason === 'background') h.background();
  await first.startupReady;
  h.resume(); h.authorize('allowed');
  const requested = h.ads.length;
  const second = h.start(); await second.startupReady; await flush();
  expect(h.ads).toHaveLength(requested);
  for (const ad of h.ads) { ad.emit('loaded'); expect(ad.show).not.toHaveBeenCalled(); }
});

test('startup admission requires the actual reserved capability', () => {
  const admission = new FullscreenAdmission(); admission.hydrate([]);
  const ticket = admission.reserveStartupOpportunity()!;
  expect(admission.reserveStartupOpportunity()).toBeNull();
  const input = { now: Date.now(), foreground: true, canRequestAds: true, safeBoundary: true, trigger: 'app_open_startup' as const };
  expect(admission.acquire('app_open', input)).toBeNull();
  expect(admission.acquire('app_open', { ...input, startupTicket: Symbol('app_open_startup') })).toBeNull();
  const owner = admission.acquire('app_open', { ...input, startupTicket: ticket })!;
  expect(owner).not.toBeNull(); admission.release(owner);
  expect(admission.acquire('app_open', { ...input, startupTicket: ticket })).toBeNull();
});

test('ordinary interstitials need five active minutes and still respect the shared five-minute interval', async () => {
  expect(FULLSCREEN_COOLDOWN_MS).toBe(5 * 60 * 1000);
  const h = harness({ format: 'interstitial', appOpenMode: 'legacy', startupWindowMs: 0 });
  const c = h.start(); await flush(); h.ads[0].emit('loaded');
  await jest.advanceTimersByTimeAsync(FULLSCREEN_COOLDOWN_MS - 1); expect(await c.showIfEligible()).toBe(false);
  await jest.advanceTimersByTimeAsync(1); expect(await c.showIfEligible()).toBe(true);
  h.ads[0].emit('opened'); h.ads[0].emit('closed');
  expect(h.admission.acquire('interstitial', { now: Date.now(), foreground: true, canRequestAds: true, safeBoundary: true })).toBeNull();
  c.stop();
});
