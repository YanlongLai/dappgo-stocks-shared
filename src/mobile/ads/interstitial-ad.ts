export interface TimedInterstitialAdsController {
  showIfEligible: () => Promise<boolean>;
  /** Research-detail demand for on-demand inventory; a no-op where ads are unavailable. */
  refreshInventory: () => void;
  stop: () => void;
}
export function startTimedInterstitialAds(): TimedInterstitialAdsController {
  return {
    showIfEligible: async () => false,
    refreshInventory: () => {},
    stop: () => {},
  };
}
