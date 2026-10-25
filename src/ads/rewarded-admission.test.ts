import { FullscreenAdmission, type FullscreenFormat, type FullscreenTrigger } from './admission';
import { startFullscreenController, type FullscreenAdEvent } from './fullscreen-controller';

const consent = { canRequestAds: true, adStorage: true, adUserData: false, adPersonalization: false };
const now = 1_000_000;
function harness(admission: FullscreenAdmission, format: FullscreenFormat = 'rewarded') {
  const ads: { show: jest.Mock; emit(event: FullscreenAdEvent): void }[] = [];
  let clock = now;
  const deps = {
    admission, format, prepare: async () => ({ launchCount: 3 }), initialize: async () => true,
    consent: () => consent, subscribeConsent: () => () => {}, foreground: () => true,
    appOpenRouteAllowed: () => true, subscribeForeground: () => () => {},
    create: () => {
      let listener: (event: FullscreenAdEvent) => void = () => {};
      const ad = { show: jest.fn(async () => {}), load: jest.fn(), emit: (event: FullscreenAdEvent) => listener(event),
        subscribe: (next: typeof listener) => { listener = next; return () => {}; } };
      ads.push(ad); return ad;
    },
    persistExposure: jest.fn(), reporter: jest.fn((_startup: boolean, _trigger?: FullscreenTrigger) => jest.fn()), now: () => clock, startupWindowMs: 0,
  };
  return { controller: startFullscreenController(deps), ads, deps, advance: (ms: number) => { clock += ms; } };
}
async function flush() { for (let i = 0; i < 20; i++) await Promise.resolve(); }

test('only reward inventory with explicit opt-in bypasses timing while sharing the mutex', async () => {
  const admission = new FullscreenAdmission(); admission.hydrate([now - 10]);
  const summary = harness(admission); const appOpen = harness(admission, 'app_open');
  const regular = harness(admission, 'interstitial'); await flush();
  [summary, appOpen, regular].forEach(item => item.ads[0].emit('loaded'));
  expect(await summary.controller.showIfEligible()).toBe(false);
  expect(await appOpen.controller.showIfEligible('rewarded_opt_in')).toBe(false);
  expect(await regular.controller.showIfEligible('rewarded_opt_in')).toBe(false);
  expect(summary.controller.isReadyToShow('rewarded_opt_in')).toBe(true);
  expect(await summary.controller.showIfEligible('rewarded_opt_in')).toBe(true);
  const other = harness(admission); await flush(); other.ads[0].emit('loaded');
  expect(other.controller.isReadyToShow('rewarded_opt_in')).toBe(false);
  expect(await other.controller.showIfEligible('rewarded_opt_in')).toBe(false);
  summary.ads[0].emit('opened'); summary.ads[0].emit('closed');
  expect(await other.controller.showIfEligible('rewarded_opt_in')).toBe(true);
  other.ads[0].emit('opened'); other.ads[0].emit('closed');
  expect(admission.isCoolingDown(now)).toBe(true);
  expect(await appOpen.controller.showIfEligible()).toBe(false);
  expect(summary.deps.persistExposure).toHaveBeenCalledTimes(1);
  expect(summary.deps.reporter.mock.calls.filter(args => args[1] === 'rewarded_opt_in')).toEqual([[false, 'rewarded_opt_in']]);
  [summary, appOpen, regular, other].forEach(item => item.controller.stop());
});

test('opt-in cannot bypass hydration, rollback, foreground, consent, boundary or an active owner', () => {
  const admission = new FullscreenAdmission();
  const valid = { now, foreground: true, canRequestAds: true, safeBoundary: true, trigger: 'rewarded_opt_in' as const };
  expect(admission.acquire('rewarded', valid)).toBeNull(); admission.hydrate([now + 1]);
  expect(admission.acquire('rewarded', valid)).toBeNull();
  const ready = new FullscreenAdmission(); ready.hydrate([]);
  for (const invalid of [{ foreground: false }, { canRequestAds: false }, { safeBoundary: false }, { now: NaN }, { now: 0 }, { trigger: 'automatic' as const }]) {
    expect(ready.canAcquire('rewarded', { ...valid, ...invalid })).toBe(false);
    expect(ready.acquire('rewarded', { ...valid, ...invalid })).toBeNull();
  }
  const token = ready.acquire('rewarded', valid); expect(token).not.toBeNull();
  expect(ready.acquire('rewarded', valid)).toBeNull(); ready.release(token!);
});

test('expired inventory refreshes without auto-show or a deferred popup', async () => {
  const admission = new FullscreenAdmission(); admission.hydrate([]);
  const summary = harness(admission); await flush(); summary.ads[0].emit('loaded');
  summary.advance(60 * 60 * 1000); expect(summary.controller.isReadyToShow('rewarded_opt_in')).toBe(false);
  summary.controller.refreshInventory(); expect(summary.ads).toHaveLength(2); summary.ads[1].emit('loaded');
  expect(summary.ads.every(ad => ad.show.mock.calls.length === 0)).toBe(true);
  expect(summary.controller.isReadyToShow('rewarded_opt_in')).toBe(true); summary.controller.stop();
});
