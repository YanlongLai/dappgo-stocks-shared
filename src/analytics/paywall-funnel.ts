/**
 * One paywall visit's funnel (2.0.1), shared by every paywall in every app:
 * paywall_view → offer_tap → purchase_start → purchase_result → (restore_tap).
 *
 * The apps' RevenueCat callbacks call these methods; the tracker keeps the
 * order and sends each event at most once per visit, so a late or repeated
 * callback (RevenueCat calls onPurchaseCompleted and then returns PURCHASED)
 * never doubles a result. Old app-specific events stay where they are.
 */
import type { MonetizationEventMap, MonetizationEventName, PaywallKind, PurchaseResult } from './monetization';

export type FunnelLog = <N extends MonetizationEventName>(name: N, params: MonetizationEventMap[N]) => void;

export interface PaywallFunnel {
  /** The paywall became visible. */
  view(): void;
  /** A plan was chosen and the store sheet is opening (RevenueCat UI reports both at once). */
  purchaseStarted(offer: { product: string; price_tier: string }): void;
  /** The store answered. */
  result(result: PurchaseResult): void;
  /** 「恢復購買」 tapped. */
  restore(): void;
  /** The paywall closed with RevenueCat's overall result. */
  closed(outcome: 'purchased' | 'restored' | 'cancelled' | 'error'): void;
  /** The product from the last purchaseStarted (for trial_to_purchase etc.). */
  readonly product: string;
}

export function createPaywallFunnel({ source, kind, log, onSuccess }: {
  source: string;
  kind: PaywallKind;
  log: FunnelLog;
  /** Runs once after a successful purchase_result (e.g. trial_to_purchase). */
  onSuccess?: (product: string) => void;
}): PaywallFunnel {
  let viewed = false;
  let started = false;
  let resulted = false;
  let product = 'unknown';
  const funnel: PaywallFunnel = {
    view() {
      if (viewed) return;
      viewed = true;
      log('paywall_view', { source, paywall_kind: kind });
    },
    purchaseStarted(offer) {
      funnel.view();
      product = offer.product || 'unknown';
      // A second plan after a cancelled sheet is a new attempt: let it report again.
      resulted = false;
      started = true;
      log('offer_tap', { product, price_tier: offer.price_tier || 'unknown', source, paywall_kind: kind });
      log('purchase_start', { product, paywall_kind: kind });
    },
    result(r) {
      if (resulted) return;
      resulted = true;
      log('purchase_result', { product, result: r, paywall_kind: kind });
      if (r === 'success') onSuccess?.(product);
    },
    restore() {
      funnel.view();
      log('restore_tap', { source });
    },
    closed(outcome) {
      if (outcome === 'purchased') funnel.result('success');
      else if (outcome === 'error' && started) funnel.result('fail');
      else if (outcome === 'cancelled' && started) funnel.result('cancel');
    },
    get product() { return product; },
  };
  return funnel;
}
