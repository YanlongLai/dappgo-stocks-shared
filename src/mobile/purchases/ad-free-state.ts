export type AdFreeEntitlementStatus =
  | 'unknown'
  | 'unavailable'
  | 'free_verified'
  | 'entitled_verified'
  | 'entitled_cached'
  | 'revoked_verified';
export type AdFreePurchaseStatus = 'idle' | 'purchasing' | 'restoring' | 'pending' | 'failed';
export type AdFreeSnapshot = {
  status: AdFreeEntitlementStatus;
  purchaseStatus: AdFreePurchaseStatus;
  generation: number;
  localizedPrice: string | null;
  errorCode: string | null;
};
export const INITIAL_AD_FREE_SNAPSHOT: AdFreeSnapshot = Object.freeze({
  status: 'unknown', purchaseStatus: 'idle', generation: 0, localizedPrice: null, errorCode: null,
});
export function isAdFreeEntitled(status: AdFreeEntitlementStatus): boolean {
  return status === 'entitled_verified' || status === 'entitled_cached';
}
export function canRequestAdsForEntitlement(status: AdFreeEntitlementStatus): boolean {
  return status === 'free_verified' || status === 'revoked_verified';
}
