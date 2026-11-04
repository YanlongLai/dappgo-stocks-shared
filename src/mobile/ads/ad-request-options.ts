import type { AdConsentSnapshot } from './consent';

export type TrackingAuthorization = 'pending' | 'granted' | 'denied' | 'unavailable-or-error';
export type TrackingAdConsent = AdConsentSnapshot & Readonly<{
  trackingAuthorized?: boolean;
  requestEpoch?: number;
  trackingStatus?: TrackingAuthorization;
}>;

/** Adapter supplies Platform.OS and AppState; permission APIs stay in the app. */
export function canUseAdRequest(consent: TrackingAdConsent, platform: string, foreground: boolean): boolean {
  return consent.canRequestAds && (platform !== 'ios' || (
    foreground && consent.trackingStatus === 'granted' && consent.trackingAuthorized === true
  ));
}

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
