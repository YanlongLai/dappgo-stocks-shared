export interface TimedInterstitialAdsController {
  showIfEligible: () => Promise<boolean>;
  stop: () => void;
}
export function startTimedInterstitialAds(): TimedInterstitialAdsController {
  return {
    showIfEligible: async () => false,
    stop: () => {},
  };
}
