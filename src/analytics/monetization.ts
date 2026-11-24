/**
 * Paywall funnel and trial events (1.12.0 plan §3.6). One catalogue for the
 * three stock apps and Number RPG: same names, same params. Revenue comes from
 * RevenueCat; these events record intent before the purchase, joined on
 * `product`.
 *
 * Callers send nothing when analytics consent is off (the apps' existing
 * `analyticsEnabled` gate) and never attach personal data or stock lists.
 */

export const BUILD_CHANNELS = ['dev', 'internal', 'testflight', 'production'] as const;
export type BuildChannel = typeof BUILD_CHANNELS[number];

export const PURCHASE_RESULTS = ['success', 'cancel', 'fail', 'pending'] as const;
export type PurchaseResult = typeof PURCHASE_RESULTS[number];

/** rc_ui: RevenueCat's own paywall (offer_tap and purchase_start arrive together); custom: our own button. */
export const PAYWALL_KINDS = ['rc_ui', 'custom'] as const;
export type PaywallKind = typeof PAYWALL_KINDS[number];

export const TRIAL_MARKETS = ['us', 'tw', 'options'] as const;
export type TrialMarket = typeof TRIAL_MARKETS[number];

export type MonetizationEventMap = {
  /** A paywall or shop screen was shown. source: e.g. valuation_tile, ai_summary, settings, out_of_lives, shop_tab. */
  paywall_view: { source: string; paywall_kind: PaywallKind };
  /** A plan or product was tapped. */
  offer_tap: { product: string; price_tier: string; source: string; paywall_kind: PaywallKind };
  /** The system payment sheet opened. */
  purchase_start: { product: string; paywall_kind: PaywallKind };
  /** The payment ended. */
  purchase_result: { product: string; result: PurchaseResult; paywall_kind: PaywallKind };
  restore_tap: { source: string };
  /** Stock apps: the valuation trial started. */
  trial_start: { market: TrialMarket };
  /** Stock apps: valuation opened during the trial (at most once a day; see shouldLogTrialView). */
  trial_view: { market: TrialMarket };
  /** Stock apps: first open after the trial ended. */
  trial_expired: { market: TrialMarket };
  /** Stock apps: purchase during or after the trial. */
  trial_to_purchase: { market: TrialMarket; product: string };
};
export type MonetizationEventName = keyof MonetizationEventMap;

export const MONETIZATION_EVENT_NAMES: readonly MonetizationEventName[] = [
  'paywall_view', 'offer_tap', 'purchase_start', 'purchase_result', 'restore_tap',
  'trial_start', 'trial_view', 'trial_expired', 'trial_to_purchase',
];

/** Firebase limits: names ≤ 40 chars, param values ≤ 100 chars. */
const MAX_VALUE = 100;
/** Identifiers only: lowercase letters, digits, _ . - (a product id or a source slug, never free text). */
const SAFE = /^[a-z0-9_.\-]+$/;

function clean(key: string, value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const v = value.trim().toLowerCase().slice(0, MAX_VALUE);
  if (!v || !SAFE.test(v)) return key === 'source' ? 'unknown' : null;
  return v;
}

/**
 * Build one event's payload. Every event carries `build_channel` so internal
 * and TestFlight data never mix with production. Unknown keys are dropped;
 * values that are not plain identifiers become 'unknown' (source) or are dropped.
 */
export function monetizationEvent<N extends MonetizationEventName>(
  name: N,
  params: MonetizationEventMap[N],
  buildChannel: BuildChannel,
): { name: N; params: Record<string, string> } {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (key === 'result' && !(PURCHASE_RESULTS as readonly string[]).includes(String(value))) continue;
    if (key === 'paywall_kind' && !(PAYWALL_KINDS as readonly string[]).includes(String(value))) continue;
    if (key === 'market' && !(TRIAL_MARKETS as readonly string[]).includes(String(value))) continue;
    const v = clean(key, value);
    if (v !== null) out[key] = v;
  }
  out.build_channel = (BUILD_CHANNELS as readonly string[]).includes(buildChannel) ? buildChannel : 'dev';
  return { name, params: out };
}

/**
 * Pick the channel from what the app knows at runtime: a dev build, the EAS
 * profile, and (iOS) whether the receipt is a sandbox one (TestFlight).
 */
export function resolveBuildChannel(input: { isDev: boolean; profile?: string | null; isTestFlight?: boolean | null }): BuildChannel {
  if (input.isDev) return 'dev';
  if (input.isTestFlight) return 'testflight';
  const p = (input.profile ?? '').toLowerCase();
  if (p === 'production') return 'production';
  if (p) return 'internal';
  return 'production';
}

/** trial_view goes out at most once per local calendar day. */
export function shouldLogTrialView(lastLoggedDay: string | null, now: Date = new Date()): { log: boolean; day: string } {
  const day = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return { log: lastLoggedDay !== day, day };
}

/** Price tier for offer_tap without sending the localized price: 'low' < 3, 'mid' < 10, 'high' otherwise (USD-equivalent). */
export function priceTier(usd: number | null | undefined): string {
  if (typeof usd !== 'number' || !Number.isFinite(usd) || usd <= 0) return 'unknown';
  if (usd < 3) return 'low';
  if (usd < 10) return 'mid';
  return 'high';
}
