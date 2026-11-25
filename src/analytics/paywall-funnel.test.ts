import { createPaywallFunnel } from './paywall-funnel';

type Ev = [string, Record<string, unknown>];
function harness(kind: 'rc_ui' | 'custom' = 'rc_ui', source = 'valuation_hub') {
  const events: Ev[] = [];
  const success: string[] = [];
  const f = createPaywallFunnel({ source, kind, log: (n, p) => events.push([n, p as Record<string, unknown>]), onSuccess: (p) => success.push(p) });
  return { f, events, names: () => events.map((e) => e[0]), success };
}
const offer = { product: 'pro_monthly', price_tier: 'monthly' };

describe('paywall funnel (plan §3.6)', () => {
  it('success: view → offer_tap → purchase_start → purchase_result(success), once', () => {
    const h = harness();
    h.f.view();
    h.f.purchaseStarted(offer);
    h.f.result('success');
    h.f.closed('purchased'); // RevenueCat also returns PURCHASED afterwards
    expect(h.names()).toEqual(['paywall_view', 'offer_tap', 'purchase_start', 'purchase_result']);
    expect(h.events[0][1]).toEqual({ source: 'valuation_hub', paywall_kind: 'rc_ui' });
    expect(h.events[1][1]).toEqual({ product: 'pro_monthly', price_tier: 'monthly', source: 'valuation_hub', paywall_kind: 'rc_ui' });
    expect(h.events[2][1]).toEqual({ product: 'pro_monthly', paywall_kind: 'rc_ui' });
    expect(h.events[3][1]).toEqual({ product: 'pro_monthly', result: 'success', paywall_kind: 'rc_ui' });
    expect(h.success).toEqual(['pro_monthly']);
  });

  it('cancel: the store sheet closed without paying', () => {
    const h = harness();
    h.f.view();
    h.f.purchaseStarted(offer);
    h.f.result('cancel');
    h.f.closed('cancelled');
    expect(h.names()).toEqual(['paywall_view', 'offer_tap', 'purchase_start', 'purchase_result']);
    expect(h.events[3][1]).toMatchObject({ result: 'cancel' });
    expect(h.success).toEqual([]);
  });

  it('cancel reported only by the paywall result still closes the attempt', () => {
    const h = harness();
    h.f.view();
    h.f.purchaseStarted(offer);
    h.f.closed('cancelled');
    expect(h.events.at(-1)).toEqual(['purchase_result', { product: 'pro_monthly', result: 'cancel', paywall_kind: 'rc_ui' }]);
  });

  it('fail: a store error, then the user tries another plan', () => {
    const h = harness();
    h.f.view();
    h.f.purchaseStarted(offer);
    h.f.result('fail');
    h.f.purchaseStarted({ product: 'pro_annual', price_tier: 'annual' });
    h.f.result('success');
    expect(h.names()).toEqual(['paywall_view', 'offer_tap', 'purchase_start', 'purchase_result', 'offer_tap', 'purchase_start', 'purchase_result']);
    expect(h.events[3][1]).toMatchObject({ result: 'fail', product: 'pro_monthly' });
    expect(h.events[6][1]).toMatchObject({ result: 'success', product: 'pro_annual' });
  });

  it('restore: view → restore_tap; no purchase_result without a purchase', () => {
    const h = harness('rc_ui', 'settings');
    h.f.view();
    h.f.restore();
    h.f.closed('restored');
    expect(h.names()).toEqual(['paywall_view', 'restore_tap']);
    expect(h.events[1][1]).toEqual({ source: 'settings' });
  });

  it('closing without choosing a plan sends only paywall_view', () => {
    const h = harness();
    h.f.view();
    h.f.view();
    h.f.closed('cancelled');
    expect(h.names()).toEqual(['paywall_view']);
  });

  it('a purchase that skipped view still starts with paywall_view', () => {
    const h = harness('custom', 'ad_free_card');
    h.f.purchaseStarted(offer);
    h.f.closed('error');
    expect(h.names()).toEqual(['paywall_view', 'offer_tap', 'purchase_start', 'purchase_result']);
    expect(h.events[0][1]).toEqual({ source: 'ad_free_card', paywall_kind: 'custom' });
    expect(h.events[3][1]).toMatchObject({ result: 'fail' });
  });
});
