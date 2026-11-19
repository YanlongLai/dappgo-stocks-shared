import type { AppProfile } from '../app-profile';



export interface AdUnitConfig {
  isDevelopment: boolean;
  /** Explicitly set to "production" only for a public release build. */
  adsMode?: string;
  /** Explicit production build marker; prevents ambiguous store artifacts. */
  adsBuildProfile?: string;
  testUnitId: string;
  productionUnitId: string;
  /**
   * expo-device `isDevice`. `false` means an emulator or simulator (our own
   * release QA, store review, test labs): it gets Google's test unit so those
   * requests stay out of production reports. Omitted keeps the build decision.
   */
  isPhysicalDevice?: boolean;
}

export type BannerAdUnitConfig = AdUnitConfig;

/**
 * Selects the ad unit for the current build without ever falling back from a
 * development test ID to a production ID. Emulators always get the test ID.
 */
export function resolveBannerAdUnitId({
  isDevelopment,
  adsMode,
  adsBuildProfile,
  testUnitId,
  productionUnitId,
  isPhysicalDevice,
}: AdUnitConfig): string {
  const useTestAd =
    isDevelopment ||
    isPhysicalDevice === false ||
    adsMode !== 'production' ||
    adsBuildProfile !== 'production';
  return useTestAd ? testUnitId : productionUnitId;
}

export function resolveAppOpenAdUnitId(config: AdUnitConfig): string {
  return resolveBannerAdUnitId(config);
}

export function resolveInterstitialAdUnitId(config: AdUnitConfig): string {
  return resolveBannerAdUnitId(config);
}

// Dedicated RewardedAd units; release gates reject missing or reused units.

export function resolveRewardedAdUnitId(config: AdUnitConfig): string {
  return resolveBannerAdUnitId(config);
}

/** Bind the app ID catalog in the app composition root; SDK creation stays native. */
export function createAdUnitCatalog(profile: AppProfile) {
  return {
    PRODUCTION_BANNER_AD_UNIT_IDS: Object.freeze({ ...profile.adUnits.banner }),
    PRODUCTION_APP_OPEN_AD_UNIT_IDS: Object.freeze({ ...profile.adUnits.app_open }),
    PRODUCTION_INTERSTITIAL_AD_UNIT_IDS: Object.freeze({ ...profile.adUnits.interstitial }),
    PRODUCTION_REWARDED_AD_UNIT_IDS: Object.freeze({ ...profile.adUnits.rewarded }),
    resolveBannerAdUnitId, resolveAppOpenAdUnitId, resolveInterstitialAdUnitId, resolveRewardedAdUnitId,
  };
}
