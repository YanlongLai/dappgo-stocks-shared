import type { AppOpenAdsController } from './app-open-ad.types';

export function startAppOpenAds(): AppOpenAdsController {
  return { startupReady: Promise.resolve(), stop: () => {} };
}
/** Web has no native app-open inventory. */
export function updateAppOpenAdRoute(_pathname: string | null): void {}
