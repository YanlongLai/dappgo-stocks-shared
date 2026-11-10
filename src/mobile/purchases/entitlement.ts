import type { AppProfile, StorePlatform } from '../app-profile';
import type { AdFreeSnapshot } from './ad-free-state';

/**
 * Native adapter supplies RevenueCat CustomerInfo/offerings and publishes the
 * returned state patch. SDK initialization, keys, identity, transaction flow,
 * receipt sync and observer ownership remain in each app's ad-free.ts.
 */
export type CustomerInfo = { entitlements?: { active?: Record<string, unknown> } };
export type PurchasesPackage = {
  identifier: string;
  packageType?: string;
  product?: { identifier?: string; priceString?: string; price?: number };
};

/** RevenueCat package identifier of the custom package that carries the regular-price product. */
export const REGULAR_PACKAGE_IDENTIFIER = 'lifetime_regular';

export function createEntitlementPolicy(profile: AppProfile) {
  return {
    customerInfoPatch(info: CustomerInfo): Pick<AdFreeSnapshot, 'status' | 'purchaseStatus' | 'errorCode'> {
      return {
        status: info.entitlements?.active?.[profile.adFreeProduct.entitlement] ? 'entitled_verified' : 'free_verified',
        purchaseStatus: 'idle', errorCode: null,
      };
    },
    /**
     * The package being sold: whichever of the promotional or regular lifetime
     * product the current offering exposes as its lifetime package. The
     * `lifetime_regular` reference package is never the one sold.
     */
    findLifetimePackage<T extends PurchasesPackage>(packages: readonly T[] | null | undefined, store: StorePlatform | null): T | null {
      if (!store || !packages) return null;
      const promoId = profile.adFreeProduct[store];
      const regularId = profile.adFreeProduct.regular[store];
      const candidates = packages.filter(item => item.identifier !== REGULAR_PACKAGE_IDENTIFIER
        && (item.product?.identifier === promoId || item.product?.identifier === regularId));
      if (candidates.length === 0) return null;
      const isSlot = (item: T) => item.packageType === 'LIFETIME' || item.identifier === '$rc_lifetime';
      return candidates.find(isSlot) ?? candidates.find(item => item.product?.identifier === promoId) ?? candidates[0];
    },
    /** The regular-price package, used only as the reference price. Null when the store does not offer it. */
    findRegularPackage<T extends PurchasesPackage>(packages: readonly T[] | null | undefined, store: StorePlatform | null): T | null {
      if (!store || !packages) return null;
      const regularId = profile.adFreeProduct.regular[store];
      const matches = packages.filter(item => item.product?.identifier === regularId);
      return matches.find(item => item.identifier === REGULAR_PACKAGE_IDENTIFIER) ?? matches[0] ?? null;
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
