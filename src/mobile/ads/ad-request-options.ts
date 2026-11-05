import type { AdConsentSnapshot } from './consent';

export type TrackingAuthorization = 'pending' | 'granted' | 'denied' | 'unavailable-or-error';
export type TrackingAdConsent = AdConsentSnapshot & Readonly<{
  trackingAuthorized?: boolean;
  requestEpoch?: number;
  trackingStatus?: TrackingAuthorization;
}>;

/**
 * UMP consent is required on every platform. On iOS, foreground requests wait
 * only while ATT is pending; granted, denied (including restricted), and
 * unavailable/error states may request ads.
 */
export function canUseAdRequest(consent: TrackingAdConsent, platform: string, foreground: boolean): boolean {
  return consent.canRequestAds && (platform !== 'ios' || (
    foreground && (consent.trackingStatus ?? 'pending') !== 'pending'
  ));
}

/** iOS uses non-personalized ads unless ATT and ad-personalization consent are both granted. */
export function adRequestOptions(consent: TrackingAdConsent, platform: string) {
  return platform === 'ios'
    ? { requestNonPersonalizedAdsOnly: consent.trackingAuthorized !== true || consent.adPersonalization !== true }
    : undefined;
}

export function adRequestIdentity(consent: TrackingAdConsent): string {
  return JSON.stringify([
    consent.canRequestAds, consent.adStorage, consent.adUserData, consent.adPersonalization,
    consent.trackingAuthorized, consent.trackingStatus, consent.requestEpoch,
  ]);
}
