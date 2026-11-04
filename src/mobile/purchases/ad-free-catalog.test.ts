import { APP_PROFILES } from '../__fixtures__/app-profiles';
import { createAdFreeCatalog } from './ad-free-catalog';

test.each(APP_PROFILES)('$app reproduces its isolated product catalog', (profile) => {
  const { AD_FREE_PRODUCT, productIdFor } = createAdFreeCatalog(profile);
  expect(AD_FREE_PRODUCT).toEqual(profile.adFreeProduct);
  expect(productIdFor('ios')).toBe(`${profile.applicationId}.removeads.lifetime`);
  expect(productIdFor('android')).toBe('remove_ads_lifetime');
  expect(AD_FREE_PRODUCT.entitlement).toBe('ad_free');
  expect(AD_FREE_PRODUCT.price).toBe('$4.99');
  expect(Object.isFrozen(AD_FREE_PRODUCT)).toBe(true);
});
