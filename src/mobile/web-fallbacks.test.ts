import { ensureAuth, getExistingAuthUid, onUid } from './data/auth.web';
import { getSecureKey, setSecureKey } from './data/secure-keys.web';
import { getAdConsentSnapshot, initializeAdMob, openAdPrivacyOptions } from './ads/admob';
import { startTimedInterstitialAds } from './ads/interstitial-ad';
import { startAppOpenAds } from './ads/app-open-ad';
import { requestPermissions } from './data/notifications.web';
import { FIREBASE_USER_DATA_COLLECTION_ENABLED } from './data/privacy-config';
import { resolveActualTheme } from './utils/theme-mode';

test('public fallbacks neither grant identity/permissions nor request native inventory', async () => {
  expect(await ensureAuth()).toBeNull(); expect(getExistingAuthUid()).toBeNull();
  const listener = jest.fn(); const stop = onUid(listener);
  expect(listener).toHaveBeenCalledWith(null); stop();
  expect(await initializeAdMob()).toBe(false);
  expect(getAdConsentSnapshot().canRequestAds).toBe(false);
  expect(await openAdPrivacyOptions()).toEqual({ status: 'unavailable', reason: 'unsupported-platform' });
  expect(await startTimedInterstitialAds().showIfEligible()).toBe(false);
  await expect(startAppOpenAds().startupReady).resolves.toBeUndefined();
  expect(await requestPermissions()).toBe(false);
  expect(FIREBASE_USER_DATA_COLLECTION_ENABLED).toBe(false);
});

test('web credentials remain unavailable rather than falling back to browser storage', async () => {
  expect(await getSecureKey('provider')).toBe('');
  await expect(setSecureKey('provider', 'value')).rejects.toThrow('web-secret-storage-unavailable');
});

test('explicit theme choice wins over device color scheme', () => {
  expect(resolveActualTheme('system', 'dark')).toBe('dark');
  expect(resolveActualTheme('light', 'dark')).toBe('light');
  expect(resolveActualTheme('dark', 'light')).toBe('dark');
});
