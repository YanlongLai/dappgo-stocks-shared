import { APP_PROFILES } from '../__fixtures__/app-profiles';
import { appleRecoveryErrorCode, createEntitlementPolicy, isStoreCancellation } from './entitlement';

test.each(APP_PROFILES)('$app preserves its current entitlement and platform product lookup', profile => {
  const policy = createEntitlementPolicy(profile);
  expect(policy.customerInfoPatch({ entitlements: { active: { ad_free: {} } } })).toEqual({ status: 'entitled_verified', purchaseStatus: 'idle', errorCode: null });
  expect(policy.customerInfoPatch({ entitlements: { active: { other_product: {} } } })).toEqual({ status: 'free_verified', purchaseStatus: 'idle', errorCode: null });
  expect(policy.customerInfoPatch({}).status).toBe('free_verified');
  const sibling = APP_PROFILES.find(app => app.app !== profile.app)!;
  const foreign = { identifier: 'foreign', product: { identifier: sibling.adFreeProduct.ios } };
  const ios = { identifier: 'ios', product: { identifier: profile.adFreeProduct.ios, priceString: 'NT$150' } };
  const android = { identifier: 'android', product: { identifier: 'remove_ads_lifetime', priceString: '$4.99' } };
  expect(policy.findLifetimePackage([foreign, ios, android], 'ios')).toBe(ios);
  expect(policy.findLifetimePackage([foreign, ios, android], 'android')).toBe(android);
  expect(policy.findLifetimePackage([foreign], 'ios')).toBeNull();
  expect(policy.findLifetimePackage(undefined, null)).toBeNull();
});

test.each([{ code: 1 }, { code: '1' }, { code: 'ERR_STORE_SYNC_CANCELLED' }, { userCancelled: true }, { code: 'PURCHASE_CANCELLED' }])('preserves store cancellation classification for %p', error => {
  expect(isStoreCancellation(error)).toBe(true);
});

test('unknown errors do not become cancellations and recovery stages keep their error codes', () => {
  expect(isStoreCancellation(null)).toBe(false);
  expect(isStoreCancellation({ code: '8' })).toBe(false);
  expect(appleRecoveryErrorCode({ code: 'ERR_STORE_SYNC_NOT_ACTIVE' })).toBe('store-sync-not-active');
  expect(appleRecoveryErrorCode({ code: 'ERR_STORE_SYNC_UNAVAILABLE' })).toBe('store-sync-unavailable');
  expect(appleRecoveryErrorCode({ code: 8 })).toBe('store-sync-verification-failed');
  expect(appleRecoveryErrorCode({ code: 8 }, true)).toBe('store-sync-verification-failed');
  expect(appleRecoveryErrorCode(null)).toBe('store-sync-failed');
  expect(appleRecoveryErrorCode(null, true)).toBe('restore-failed');
  expect(appleRecoveryErrorCode({ code: 'network' }, true)).toBe('network');
});
