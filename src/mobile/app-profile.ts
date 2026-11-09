/**
 * Apps construct a profile in their composition root. Read build configuration,
 * native identity and environment variables there, then pass plain values here.
 * No default app, native module, store or environment lookup belongs in this layer.
 */
export type MobileApp = 'us_stocks' | 'tw_stocks' | 'options';
export type StorePlatform = 'ios' | 'android';
export type PlatformIds = Readonly<Record<StorePlatform, string>>;

export interface AppProfile {
  readonly app: MobileApp;
  readonly applicationId: string;
  readonly appleId: string;
  /** Preserve the existing report/backtest/matrix helper's scheme during migration. */
  readonly legacyDeepLinkScheme: string;
  readonly adUnits: Readonly<Record<'banner' | 'app_open' | 'interstitial' | 'rewarded', PlatformIds>>;
  readonly appOpen: Readonly<{
    minimumLaunches: number;
    resumeCooldownMs: number;
    maxReferenceAgeMs: number;
    startupWindowMs?: number;
    startupShowFailOpenMs?: number;
  }>;
  readonly adFreeProduct: Readonly<{
    ios: string;
    android: string;
    entitlement: 'ad_free';
    /** Regular-price lifetime product: reference price only, never sold unless the offering exposes it as its lifetime package. */
    regular: PlatformIds;
  }>;
  readonly data: Readonly<{
    githubOwner: string;
    githubRepo: string;
    market: string;
    gatewayBaseUrl: string;
  }>;
  readonly cache: Readonly<{
    dashboardTtlMs: number;
    usStocksMarketCapsKey?: string;
  }>;
  readonly report: Readonly<{
    datePattern: string;
    dateFlags?: string;
    generatedAtPattern: string;
    generatedAtFlags?: string;
    tickerPattern: string;
  }>;
}
