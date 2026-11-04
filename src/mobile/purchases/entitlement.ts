import type { AppProfile, StorePlatform } from '../app-profile';
import type { AdFreeSnapshot } from './ad-free-state';

/**
 * Native adapter supplies RevenueCat CustomerInfo/offerings and publishes the
 * returned state patch. SDK initialization, keys, identity, transaction flow,
 * receipt sync and observer ownership remain in each app's ad-free.ts.
 */
export type CustomerInfo = { entitlements?: { active?: Record<string, unknown> } };
export type PurchasesPackage = { identifier: string; product?: { identifier?: string; priceString?: string } };

export function createEntitlementPolicy(profile: AppProfile) {
  return {
    customerInfoPatch(info: CustomerInfo): Pick<AdFreeSnapshot, 'status' | 'purchaseStatus' | 'errorCode'> {
      return {
        status: info.entitlements?.active?.[profile.adFreeProduct.entitlement] ? 'entitled_verified' : 'free_verified',
        purchaseStatus: 'idle', errorCode: null,
      };
    },
    findLifetimePackage<T extends PurchasesPackage>(packages: readonly T[] | null | undefined, store: StorePlatform | null): T | null {
      const productId = store ? profile.adFreeProduct[store] : '';
      return packages?.find(item => item.product?.identifier === productId) ?? null;
    },
  };
}

export function isStoreCancellation(error: unknown): boolean {
  const code = String((error as { code?: unknown })?.code ?? '');
  return code === '1' || code === 'ERR_STORE_SYNC_CANCELLED'
    || (error as { userCancelled?: unknown })?.userCancelled === true || /cancel/i.test(code);
}

export function appleRecoveryErrorCode(error: unknown, appleSynced = false): string {
  const code = String((error as { code?: unknown })?.code ?? '');
  if (appleSynced) return code === '8' ? 'store-sync-verification-failed' : code || 'restore-failed';
  if (code === 'ERR_STORE_SYNC_NOT_ACTIVE') return 'store-sync-not-active';
  if (code === 'ERR_STORE_SYNC_UNAVAILABLE') return 'store-sync-unavailable';
  return code === '8' ? 'store-sync-verification-failed' : 'store-sync-failed';
}
