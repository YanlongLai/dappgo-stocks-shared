import type { AdFreeSnapshot } from './ad-free-state';
export type { AdFreeSnapshot } from './ad-free-state';

// Browser research is currently ad-free by product configuration, not by a
// verified store purchase. Never load a native billing SDK or trust web storage.
const snapshot: AdFreeSnapshot = Object.freeze({
  status: 'unavailable',
  purchaseStatus: 'idle',
  generation: 0,
  localizedPrice: null,
  errorCode: null,
});

export function getAdFreeSnapshot(): AdFreeSnapshot { return snapshot; }
export function subscribeAdFree(_listener: () => void): () => void { return () => {}; }
export function isAdFreeEntitledNow(): boolean { return false; }
export function canRequestAdsForEntitlement(): boolean { return false; }
export async function initializeAdFree(): Promise<void> {}
export async function purchaseAdFree(): Promise<AdFreeSnapshot> { return snapshot; }
export async function restoreAdFree(): Promise<AdFreeSnapshot> { return snapshot; }
export function getAdFreeProductId(): string | null { return null; }
