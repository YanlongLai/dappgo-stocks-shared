import type { AppProfile, MobileApp, StorePlatform } from '../app-profile';

export type AdFreeAppKey = MobileApp;
export type AdFreeStore = StorePlatform;
export type AdFreeProductConfig = AppProfile['adFreeProduct'];

/** Native purchases/RevenueCat and their customer identity stay in each app. */
export function createAdFreeCatalog(profile: AppProfile) {
  const AD_FREE_PRODUCT: AdFreeProductConfig = Object.freeze({ ...profile.adFreeProduct });
  return {
    AD_FREE_PRODUCT,
    productIdFor(store: AdFreeStore): string { return AD_FREE_PRODUCT[store]; },
  };
}
