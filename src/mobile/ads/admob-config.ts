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

export type AdsConfigPlatform = 'ios' | 'android';
export type AdsConfigMode = 'production' | 'test';
/**
 * Why the build serves the units it does:
 * - `dev`: a development (`__DEV__`) bundle, always test units.
 * - `emulator`: an emulator or simulator, always test units.
 * - `build`: the build markers decide; with mode `test` they are not both
 *   `production`, with mode `production` this is a normal store build.
 * - `missing_unit`: a production build where at least one ad format has no
 *   valid production unit id, so that format requests nothing.
 */
export type AdsConfigReason = 'dev' | 'emulator' | 'build' | 'missing_unit';
export interface AdsConfigEvent {
  platform: AdsConfigPlatform;
  mode: AdsConfigMode;
  reason: AdsConfigReason;
}

export type AdsConfigInput = Omit<AdUnitConfig, 'testUnitId' | 'productionUnitId'> & {
  platform: AdsConfigPlatform;
  /** The platform's production unit ids for every format the app uses. */
  productionUnitIds: readonly (string | undefined)[];
};

const AD_UNIT_ID_PATTERN = /^ca-app-pub-\d+\/\d+$/;

/**
 * Describes, without user identifiers, whether this start serves real or
 * Google test units and why. The mode comes from the unit resolver itself,
 * so the analytics record can never disagree with the units requested.
 */
export function describeAdsConfig({ platform, productionUnitIds, ...config }: AdsConfigInput): AdsConfigEvent {
  const production =
    resolveBannerAdUnitId({ ...config, testUnitId: 'test', productionUnitId: 'production' }) === 'production';
  const mode: AdsConfigMode = production ? 'production' : 'test';
  let reason: AdsConfigReason;
  if (config.isDevelopment) reason = 'dev';
  else if (config.isPhysicalDevice === false) reason = 'emulator';
  else if (!production) reason = 'build';
  else if (productionUnitIds.length === 0 || productionUnitIds.some(id => !id || !AD_UNIT_ID_PATTERN.test(id))) reason = 'missing_unit';
  else reason = 'build';
  return { platform, mode, reason };
}
