import {
  canRequestAdsWithPro, findSubscriptionPackages, INITIAL_PRO_SNAPSHOT, isProEntitled, PRO_OFFLINE_GRACE_MS,
  proSnapshotFromCustomerInfo, restoreProSnapshot,
} from './pro';

const NOW = Date.parse('2026-11-20T00:00:00Z');
const active = (extra: Record<string, unknown> = {}) => ({
  entitlements: { active: { pro: { productIdentifier: 'com.dappgo.usstocksapp.pro.monthly', expirationDate: '2026-12-20T00:00:00Z', willRenew: true, periodType: 'TRIAL', ...extra } } },
});

test('an active pro entitlement becomes an entitled snapshot with its period details', () => {
  expect(proSnapshotFromCustomerInfo(active(), NOW)).toEqual({
    status: 'entitled_verified', productIdentifier: 'com.dappgo.usstocksapp.pro.monthly',
    expiresAt: '2026-12-20T00:00:00Z', willRenew: true, period: 'trial', verifiedAt: NOW,
  });
});

test('other entitlements, including ad_free, do not grant pro', () => {
  for (const info of [{}, null, undefined, { entitlements: { active: { ad_free: {} } } }, { entitlements: { active: { pro: null } } }]) {
    const snapshot = proSnapshotFromCustomerInfo(info as never, NOW);
    expect(snapshot.status).toBe('free_verified');
    expect(isProEntitled(snapshot, NOW)).toBe(false);
  }
});

test('malformed entitlement fields become null instead of leaking through', () => {
  const snapshot = proSnapshotFromCustomerInfo(active({ expirationDate: 'soon', willRenew: 'yes', periodType: 7, productIdentifier: 3 }), NOW);
  expect(snapshot).toMatchObject({ status: 'entitled_verified', expiresAt: null, willRenew: null, period: null, productIdentifier: null });
});

test('a verified entitlement is trusted for 72 hours without a fresh read, then not', () => {
  const snapshot = proSnapshotFromCustomerInfo(active(), NOW);
  expect(isProEntitled(snapshot, NOW + PRO_OFFLINE_GRACE_MS)).toBe(true);
  expect(isProEntitled(snapshot, NOW + PRO_OFFLINE_GRACE_MS + 1)).toBe(false);
  // A device clock set far back must not extend access either.
  expect(isProEntitled(snapshot, NOW - PRO_OFFLINE_GRACE_MS - 1)).toBe(false);
  expect(isProEntitled(INITIAL_PRO_SNAPSHOT, NOW)).toBe(false);
  expect(isProEntitled({ ...snapshot, verifiedAt: null }, NOW)).toBe(false);
});

test('a stored snapshot is restored only when well formed', () => {
  const snapshot = proSnapshotFromCustomerInfo(active(), NOW);
  expect(restoreProSnapshot(JSON.parse(JSON.stringify(snapshot)))).toEqual(snapshot);
  for (const raw of [null, 'x', {}, { status: 'entitled_verified' }, { status: 'vip', verifiedAt: NOW }, { status: 'entitled_verified', verifiedAt: 'now' }]) {
    expect(restoreProSnapshot(raw)).toBe(INITIAL_PRO_SNAPSHOT);
  }
});

test('pro removes ads on top of the ad-free gate', () => {
  const pro = proSnapshotFromCustomerInfo(active(), NOW);
  const free = proSnapshotFromCustomerInfo({}, NOW);
  expect(canRequestAdsWithPro(true, free, NOW)).toBe(true);
  expect(canRequestAdsWithPro(true, pro, NOW)).toBe(false);
  expect(canRequestAdsWithPro(false, free, NOW)).toBe(false);
  // Once the grace period ends, ads follow the ad-free gate again.
  expect(canRequestAdsWithPro(true, pro, NOW + PRO_OFFLINE_GRACE_MS + 1)).toBe(true);
});

test('subscription packages are found by RevenueCat identifier or package type', () => {
  const monthly = { identifier: '$rc_monthly' };
  const annual = { identifier: 'yearly', packageType: 'ANNUAL' };
  const lifetime = { identifier: '$rc_lifetime', packageType: 'LIFETIME' };
  expect(findSubscriptionPackages([lifetime, annual, monthly])).toEqual({ monthly, annual });
  expect(findSubscriptionPackages([lifetime])).toEqual({ monthly: null, annual: null });
  expect(findSubscriptionPackages(undefined)).toEqual({ monthly: null, annual: null });
});
