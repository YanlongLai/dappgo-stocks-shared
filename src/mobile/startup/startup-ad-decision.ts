/** Adapter supplies entitlement, consent, platform and synchronous access snapshots. */
import type { AdFreeEntitlementStatus } from '../purchases/ad-free-state';
import type { TrackingAdConsent } from '../ads/ad-request-options';

/** Pending identity/privacy is never permission; known paid/unavailable skips promptly. */
export function startupAdDecision(
  status: AdFreeEntitlementStatus,
  consent: TrackingAdConsent,
  platform: string,
  appAccessAllowed: boolean,
): 'pending' | 'allowed' | 'denied' {
  if (!appAccessAllowed) return 'denied';
  if (status === 'unknown') return 'pending';
  if (status !== 'free_verified' && status !== 'revoked_verified') return 'denied';
  if (!consent.ready || (platform === 'ios' && consent.trackingStatus === 'pending')) return 'pending';
  return consent.canRequestAds && (platform !== 'ios' ||
    (consent.trackingAuthorized === true && consent.trackingStatus === 'granted')) ? 'allowed' : 'denied';
}
