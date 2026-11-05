import { DENIED_AD_CONSENT } from './consent';
import { adRequestIdentity, adRequestOptions, canUseAdRequest, type TrackingAdConsent } from './ad-request-options';

test('iOS granted ATT allows foreground requests and personalization only when both consents allow it', () => {
  const granted: TrackingAdConsent = {
    ...DENIED_AD_CONSENT,
    canRequestAds: true,
    trackingStatus: 'granted',
    trackingAuthorized: true,
  };

  expect(canUseAdRequest(granted, 'ios', true)).toBe(true);
  expect(adRequestOptions(granted, 'ios')).toEqual({ requestNonPersonalizedAdsOnly: true });
  expect(adRequestOptions({ ...granted, adPersonalization: true }, 'ios'))
    .toEqual({ requestNonPersonalizedAdsOnly: false });
});

test.each([
  ['denied', false],
  ['unavailable-or-error', false],
] as const)('iOS %s ATT allows foreground non-personalized requests', (trackingStatus, trackingAuthorized) => {
  const consent: TrackingAdConsent = {
    ...DENIED_AD_CONSENT,
    canRequestAds: true,
    trackingStatus,
    trackingAuthorized,
  };

  expect(canUseAdRequest(consent, 'ios', true)).toBe(true);
  expect(adRequestOptions(consent, 'ios')).toEqual({ requestNonPersonalizedAdsOnly: true });
});

test('iOS waits for pending ATT and rejects background requests', () => {
  const consent: TrackingAdConsent = {
    ...DENIED_AD_CONSENT,
    canRequestAds: true,
    trackingStatus: 'granted',
    trackingAuthorized: true,
  };

  expect(canUseAdRequest({ ...consent, trackingStatus: 'pending' }, 'ios', true)).toBe(false);
  expect(canUseAdRequest(consent, 'ios', false)).toBe(false);
});

test('UMP canRequestAds remains required on both platforms', () => {
  const consent: TrackingAdConsent = {
    ...DENIED_AD_CONSENT,
    canRequestAds: false,
    trackingStatus: 'granted',
    trackingAuthorized: true,
  };

  expect(canUseAdRequest(consent, 'ios', true)).toBe(false);
  expect(canUseAdRequest(consent, 'android', true)).toBe(false);
});

test('Android remains gated only by UMP and does not receive iOS request options', () => {
  const consent: TrackingAdConsent = {
    ...DENIED_AD_CONSENT,
    canRequestAds: true,
    trackingStatus: 'pending',
    trackingAuthorized: false,
  };

  expect(canUseAdRequest(consent, 'android', false)).toBe(true);
  expect(adRequestOptions(consent, 'android')).toBeUndefined();
});

test('request identity changes when consent or the native permission epoch changes', () => {
  const consent = { ...DENIED_AD_CONSENT, requestEpoch: 1 };
  expect(adRequestIdentity(consent)).not.toBe(adRequestIdentity({ ...consent, requestEpoch: 2 }));
  expect(adRequestIdentity(consent)).not.toBe(adRequestIdentity({ ...consent, adStorage: true }));
  expect(adRequestIdentity(consent)).toBe(adRequestIdentity({ ...consent }));
});

describe('missing iOS tracking status', () => {
  it('waits like a pending ATT prompt', () => {
    expect(canUseAdRequest({ canRequestAds: true, adStorage: true, adUserData: true, adPersonalization: true } as never, 'ios', true)).toBe(false);
  });
});
