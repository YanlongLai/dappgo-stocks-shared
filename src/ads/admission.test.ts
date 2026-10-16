import { FullscreenAdmission, FULLSCREEN_COOLDOWN_MS } from './admission';
const input = (now = 1000) => ({ now, foreground: true, canRequestAds: true, safeBoundary: true });
test('hydration, mutex, token ownership and persisted cross-format cooldown', () => {
  const a = new FullscreenAdmission();
  expect(a.acquire('app_open', input())).toBeNull(); a.hydrate([]);
  const first = a.acquire('app_open', input())!;
  expect(a.acquire('interstitial', input())).toBeNull();
  expect(a.release({ ...first })).toBe(false);
  expect(a.impression({ ...first }, 1000)).toBeNull();
  expect(a.impression(first, 1000)).toBe(1000);
  expect(a.impression(first, 1100)).toBeNull();
  a.release(first);
  expect(a.acquire('interstitial', input(1000 + FULLSCREEN_COOLDOWN_MS - 1))).toBeNull();
  const next = a.acquire('interstitial', input(1000 + FULLSCREEN_COOLDOWN_MS))!;
  expect(next).not.toBeNull(); expect(a.release(first)).toBe(false);
  expect(a.acquire('app_open', input(1000 + 2 * FULLSCREEN_COOLDOWN_MS))).toBeNull();
});
test.each(['app_open', 'interstitial'] as const)('%s failed attempt preserves prior success', (format) => {
  const a = new FullscreenAdmission(); a.hydrate([1000, NaN, -1, null, Infinity]);
  const failed = a.acquire(format, input(1000 + FULLSCREEN_COOLDOWN_MS))!;
  a.release(failed);
  expect(a.acquire(format, input(999))).toBeNull();
  expect(a.acquire(format, input(1000 + FULLSCREEN_COOLDOWN_MS))).not.toBeNull();
});
test.each([{ foreground: false }, { canRequestAds: false }, { safeBoundary: false }, { now: NaN }, { now: Infinity }])('suppresses %j', (override) => {
  const a = new FullscreenAdmission(); a.hydrate([]);
  expect(a.acquire('app_open', { ...input(), ...override })).toBeNull();
});
test('restart imports the greatest timestamp across formats, fails closed on clock rollback', () => {
  const a = new FullscreenAdmission(); a.hydrate([1000, 3000, 2000]);
  expect(a.acquire('app_open', input(2999))).toBeNull();
  expect(a.acquire('app_open', input(3000 + FULLSCREEN_COOLDOWN_MS - 1))).toBeNull();
  expect(a.acquire('app_open', input(3000 + FULLSCREEN_COOLDOWN_MS))).not.toBeNull();
});
