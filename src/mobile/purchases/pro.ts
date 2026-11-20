import type { CustomerInfo, PurchasesPackage } from './entitlement';

/**
 * DappGo Pro subscription state, derived from RevenueCat CustomerInfo.
 * The app's purchase adapter owns the SDK; this layer only interprets what it returns.
 */
export const PRO_ENTITLEMENT = 'pro';
export const PRO_OFFERING = 'pro';
/** How long the last verified entitlement is trusted without a fresh read (offline use). */
export const PRO_OFFLINE_GRACE_MS = 72 * 60 * 60 * 1000;

export type ProStatus = 'unknown' | 'unavailable' | 'free_verified' | 'entitled_verified';
export type ProPeriod = 'trial' | 'intro' | 'normal';
export type ProSnapshot = {
  status: ProStatus;
  productIdentifier: string | null;
  /** ISO time the current period ends; null when the store gave none. */
  expiresAt: string | null;
  willRenew: boolean | null;
  period: ProPeriod | null;
  /** Epoch ms of the CustomerInfo read this snapshot came from. */
  verifiedAt: number | null;
};

export const INITIAL_PRO_SNAPSHOT: ProSnapshot = Object.freeze({
  status: 'unknown', productIdentifier: null, expiresAt: null, willRenew: null, period: null, verifiedAt: null,
});

type EntitlementInfo = {
  productIdentifier?: unknown; expirationDate?: unknown; willRenew?: unknown; periodType?: unknown;
};

function period(value: unknown): ProPeriod | null {
  const text = typeof value === 'string' ? value.toLowerCase() : '';
  return text === 'trial' || text === 'intro' || text === 'normal' ? text : null;
}

export function proSnapshotFromCustomerInfo(info: CustomerInfo | null | undefined, now: number): ProSnapshot {
  const active = info?.entitlements?.active?.[PRO_ENTITLEMENT] as EntitlementInfo | undefined;
  if (!active || typeof active !== 'object') {
    return { ...INITIAL_PRO_SNAPSHOT, status: 'free_verified', verifiedAt: now };
  }
  const expires = typeof active.expirationDate === 'string' && Number.isFinite(Date.parse(active.expirationDate))
    ? active.expirationDate : null;
  return {
    status: 'entitled_verified',
    productIdentifier: typeof active.productIdentifier === 'string' ? active.productIdentifier : null,
    expiresAt: expires,
    willRenew: typeof active.willRenew === 'boolean' ? active.willRenew : null,
    period: period(active.periodType),
    verifiedAt: now,
  };
}

/** Entitled only while the last verified read is recent enough to trust. */
export function isProEntitled(snapshot: ProSnapshot, now: number, graceMs: number = PRO_OFFLINE_GRACE_MS): boolean {
  if (snapshot.status !== 'entitled_verified' || snapshot.verifiedAt === null) return false;
  const age = now - snapshot.verifiedAt;
  return age >= 0 ? age <= graceMs : age >= -graceMs;
}

/** A snapshot read back from device storage; anything malformed means "unknown". */
export function restoreProSnapshot(raw: unknown): ProSnapshot {
  if (!raw || typeof raw !== 'object') return INITIAL_PRO_SNAPSHOT;
  const value = raw as Record<string, unknown>;
  const statuses: ProStatus[] = ['unknown', 'unavailable', 'free_verified', 'entitled_verified'];
  if (!statuses.includes(value.status as ProStatus)) return INITIAL_PRO_SNAPSHOT;
  if (typeof value.verifiedAt !== 'number' || !Number.isFinite(value.verifiedAt)) return INITIAL_PRO_SNAPSHOT;
  return {
    status: value.status as ProStatus,
    productIdentifier: typeof value.productIdentifier === 'string' ? value.productIdentifier : null,
    expiresAt: typeof value.expiresAt === 'string' ? value.expiresAt : null,
    willRenew: typeof value.willRenew === 'boolean' ? value.willRenew : null,
    period: period(value.period),
    verifiedAt: value.verifiedAt,
  };
}

/** Pro also removes ads: ads are requested only when the ad-free gate allows it and Pro is not active. */
export function canRequestAdsWithPro(adFreeGateAllows: boolean, snapshot: ProSnapshot, now: number): boolean {
  return adFreeGateAllows && !isProEntitled(snapshot, now);
}

export function findSubscriptionPackages<T extends PurchasesPackage>(
  packages: readonly T[] | null | undefined,
): { monthly: T | null; annual: T | null } {
  const find = (identifier: string, type: string) =>
    packages?.find(item => item.identifier === identifier || item.packageType === type) ?? null;
  return { monthly: find('$rc_monthly', 'MONTHLY'), annual: find('$rc_annual', 'ANNUAL') };
}
