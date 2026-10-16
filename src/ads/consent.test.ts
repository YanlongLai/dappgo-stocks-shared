import { DENIED_AD_CONSENT, resolveAdConsent } from './consent';

describe('purpose consent', () => {
  it('denies every unknown purpose even when ads can be requested', () => {
    expect(resolveAdConsent(true)).toEqual({ ...DENIED_AD_CONSENT, ready: true, canRequestAds: true });
  });
  it('maps only explicit supported purposes without inferring analytics or user data', () => {
    expect(resolveAdConsent(true, {
      storeAndAccessInformationOnDevice: true,
      createAPersonalisedAdsProfile: true, selectPersonalisedAds: true,
    })).toEqual({ canRequestAds: true, ready: true, adStorage: true,
      adPersonalization: true, analyticsStorage: false, adUserData: false });
    expect(resolveAdConsent(true, { selectPersonalisedAds: true }).adPersonalization).toBe(false);
  });
  it('does not infer purpose permissions from request eligibility', () => {
    expect(resolveAdConsent(false, { storeAndAccessInformationOnDevice: true }).adStorage).toBe(true);
    expect(Object.isFrozen(DENIED_AD_CONSENT)).toBe(true);
  });
});
