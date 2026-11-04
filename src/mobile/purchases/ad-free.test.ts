import { canRequestAdsForEntitlement, isAdFreeEntitled } from './ad-free-state';
import { createAdFreeCatalog } from './ad-free-catalog';
import { APP_PROFILES } from '../__fixtures__/app-profiles';
const { AD_FREE_PRODUCT, productIdFor } = createAdFreeCatalog(APP_PROFILES[0]);

test('US Stocks product is app-scoped and platform-specific', () => {
  expect(productIdFor('ios')).toBe('com.dappgo.usstocksapp.removeads.lifetime');
  expect(productIdFor('android')).toBe('remove_ads_lifetime');
  expect(AD_FREE_PRODUCT.entitlement).toBe('ad_free');
});
test('paid entitlement suppresses ads and unresolved states fail closed', () => {
  expect(isAdFreeEntitled('entitled_verified')).toBe(true);
  expect(isAdFreeEntitled('entitled_cached')).toBe(true);
  expect(canRequestAdsForEntitlement('entitled_verified')).toBe(false);
  expect(canRequestAdsForEntitlement('unknown')).toBe(false);
  expect(canRequestAdsForEntitlement('unavailable')).toBe(false);
  expect(canRequestAdsForEntitlement('free_verified')).toBe(true);
  expect(canRequestAdsForEntitlement('revoked_verified')).toBe(true);
});
