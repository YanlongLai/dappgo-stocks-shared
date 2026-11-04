import { DENIED_AD_CONSENT } from './consent';
import { adRequestIdentity, adRequestOptions, canUseAdRequest, type TrackingAdConsent } from './ad-request-options';

test('iOS requests require foreground, ATT grant and UMP while Android retains its UMP gate', () => {
  const consent: TrackingAdConsent = { ...DENIED_AD_CONSENT, canRequestAds: true, trackingStatus: 'granted', trackingAuthorized: true };
  expect(canUseAdRequest(consent, 'ios', true)).toBe(true);
  expect(canUseAdRequest(consent, 'ios', false)).toBe(false);
  expect(canUseAdRequest({ ...consent, trackingAuthorized: false }, 'ios', true)).toBe(false);
  expect(canUseAdRequest({ ...consent, trackingStatus: 'pending' }, 'ios', true)).toBe(false);
  expect(canUseAdRequest({ ...consent, canRequestAds: false }, 'android', true)).toBe(false);
  expect(canUseAdRequest({ ...consent, trackingStatus: 'denied' }, 'android', true)).toBe(true);
  expect(adRequestOptions(consent, 'ios')).toEqual({ requestNonPersonalizedAdsOnly: true });
  expect(adRequestOptions({ ...consent, adPersonalization: true }, 'ios')).toEqual({ requestNonPersonalizedAdsOnly: false });
  expect(adRequestOptions(consent, 'android')).toBeUndefined();
});

test('request identity changes when consent or the native permission epoch changes', () => {
  const consent = { ...DENIED_AD_CONSENT, requestEpoch: 1 };
  expect(adRequestIdentity(consent)).not.toBe(adRequestIdentity({ ...consent, requestEpoch: 2 }));
  expect(adRequestIdentity(consent)).not.toBe(adRequestIdentity({ ...consent, adStorage: true }));
  expect(adRequestIdentity(consent)).toBe(adRequestIdentity({ ...consent }));
});
