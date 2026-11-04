export type AdConsentSnapshot = Readonly<{
  canRequestAds: boolean;
  analyticsStorage: boolean;
  adStorage: boolean;
  adUserData: boolean;
  adPersonalization: boolean;
  ready: boolean;
}>;

export const DENIED_AD_CONSENT: AdConsentSnapshot = Object.freeze({
  canRequestAds: false, analyticsStorage: false, adStorage: false,
  adUserData: false, adPersonalization: false, ready: false,
});

/** Structural subset of the installed RN Google Mobile Ads getUserChoices API. */
export type AdPurposeChoices = {
  storeAndAccessInformationOnDevice?: boolean;
  createAPersonalisedAdsProfile?: boolean;
  selectPersonalisedAds?: boolean;
};

export function resolveAdConsent(canRequestAds: boolean, choices?: AdPurposeChoices | null): AdConsentSnapshot {
  return Object.freeze({
    canRequestAds: canRequestAds === true,
    // UMP TCF purpose flags do not establish Firebase Analytics consent or
    // consent to sending user data to Google for advertising.
    analyticsStorage: false,
    adUserData: false,
    adStorage: choices?.storeAndAccessInformationOnDevice === true,
    adPersonalization: choices?.createAPersonalisedAdsProfile === true &&
      choices?.selectPersonalisedAds === true,
    ready: true,
  });
}
