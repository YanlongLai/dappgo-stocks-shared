export interface AppOpenAdsController {
  startupReady: Promise<void>;
  stop: () => void;
}
