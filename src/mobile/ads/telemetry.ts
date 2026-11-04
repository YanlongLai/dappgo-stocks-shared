import type { AdApp } from './route-policy';
export const BANNER_PLACEMENTS = [
  'dashboard_primary', 'dashboard_secondary', 'favorites_footer', 'signals_footer',
  'search_footer', 'detail_primary', 'detail_secondary', 'report_footer',
  'sectors_after_second',
] as const;
export type BannerPlacement = typeof BANNER_PLACEMENTS[number];
export type AdPlacement = BannerPlacement | 'app_open_resume' | 'app_open_startup' | 'research_exit' | 'ai_summary_reveal';
export type AdFormat = 'banner' | 'app_open' | 'interstitial' | 'rewarded';
export const AD_LIFECYCLE = [
  'request', 'loaded', 'load_failed', 'show_attempt', 'opened', 'exposure', 'show_failed', 'closed', 'clicked', 'paid',
] as const;
export type AdLifecycle = typeof AD_LIFECYCLE[number];
export type AdMetadata = { app: AdApp; platform: 'ios' | 'android'; format: AdFormat; placement: AdPlacement };
export type TelemetryConsent = { canRequestAds: boolean; analyticsStorage: boolean };
export type AdMeasurement = { name: string; params: Record<string, string | number> };

function validMetadata(meta: AdMetadata): boolean {
  if (!['options', 'us_stocks', 'tw_stocks'].includes(meta.app) || !['ios', 'android'].includes(meta.platform)) return false;
  if (meta.format === 'banner') return (BANNER_PLACEMENTS as readonly string[]).includes(meta.placement);
  if (meta.format === 'app_open') return ['app_open_startup', 'app_open_resume'].includes(meta.placement);
  if (meta.format === 'rewarded') return meta.placement === 'ai_summary_reveal';
  return meta.format === 'interstitial' && meta.placement === 'research_exit';
}

/** SDK 16.3.4 normalizes BOTH platforms to currency major units (not micros). */
export function validatePaidEvent(raw: unknown): { value: number; currency: string; precision: number } | null {
  if (!raw || typeof raw !== 'object') return null;
  const { value, currency, precision } = raw as Record<string, unknown>;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 ||
      typeof currency !== 'string' || !/^[A-Z]{3}$/.test(currency) ||
      typeof precision !== 'number' || !Number.isInteger(precision) || precision < 0 || precision > 3) return null;
  // ISO 4217 codes used by the supported SDK; reject free-text three-letter strings.
  if (!('AED AFN ALL AMD ANG AOA ARS AUD AWG AZN BAM BBD BDT BGN BHD BIF BMD BND BOB BRL BSD BTN BWP BYN BZD CAD CDF CHF CLP CNY COP CRC CUP CVE CZK DJF DKK DOP DZD EGP ERN ETB EUR FJD FKP GBP GEL GHS GIP GMD GNF GTQ GYD HKD HNL HTG HUF IDR ILS INR IQD IRR ISK JMD JOD JPY KES KGS KHR KMF KPW KRW KWD KYD KZT LAK LBP LKR LRD LSL LYD MAD MDL MGA MKD MMK MNT MOP MRU MUR MVR MWK MXN MYR MZN NAD NGN NIO NOK NPR NZD OMR PAB PEN PGK PHP PKR PLN PYG QAR RON RSD RUB RWF SAR SBD SCR SDG SEK SGD SHP SLE SOS SRD SSP STN SVC SYP SZL THB TJS TMT TND TOP TRY TTD TWD TZS UAH UGX USD UYU UZS VES VND VUV WST XAF XCD XOF XPF YER ZAR ZMW ZWG').split(' ').includes(currency)) return null;
  return { value, currency, precision };
}

export function adMeasurement(meta: AdMetadata, event: AdLifecycle, consent: TelemetryConsent, paid?: unknown): AdMeasurement | null {
  if (!consent.canRequestAds || consent.analyticsStorage !== true || !validMetadata(meta) ||
      !(AD_LIFECYCLE as readonly string[]).includes(event)) return null;
  const params: Record<string, string | number> = {
    app: meta.app, platform: meta.platform, format: meta.format, placement: meta.placement,
    placement_id: [meta.app, meta.platform, meta.placement].join('_'),
  };
  if (event === 'paid') {
    const revenue = validatePaidEvent(paid);
    if (!revenue) return null;
    Object.assign(params, revenue, { value_unit: 'major' });
  }
  return { name: 'dgo_ad_' + event, params };
}

/** One paid callback per loaded fullscreen ad. No SDK request/response IDs leave the process. */
export function createAdReporter(meta: AdMetadata, consent: () => TelemetryConsent, emit: (event: AdMeasurement) => void) {
  let paidRecorded = false;
  return (event: AdLifecycle, paid?: unknown): void => {
    if (event === 'paid' && paidRecorded) return;
    const measurement = adMeasurement(meta, event, consent(), paid);
    if (!measurement) return;
    if (event === 'paid') paidRecorded = true;
    emit(measurement);
  };
}

