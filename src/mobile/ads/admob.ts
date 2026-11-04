import { DENIED_AD_CONSENT, type AdConsentSnapshot } from './consent';
import type { AdPrivacyOptionsResult } from './ad-privacy-options';
export type { AdPrivacyOptionsResult } from './ad-privacy-options';
/** Web and Expo fallback: no native permissions or collection. */
export function getAdConsentSnapshot(): AdConsentSnapshot { return DENIED_AD_CONSENT; }
export function subscribeAdConsent(_listener: () => void): () => void { return () => {}; }
export function initializeAdMob(): Promise<boolean> { return Promise.resolve(false); }
export function openAdPrivacyOptions(): Promise<AdPrivacyOptionsResult> {
  return Promise.resolve({ status: 'unavailable', reason: 'unsupported-platform' });
}
/** @deprecated Use the purpose snapshot. This never reports ad-request eligibility. */
export async function canRequestAdsForAnalytics(): Promise<boolean> {
  return getAdConsentSnapshot().analyticsStorage;
}
