import { MONETIZATION_EVENT_NAMES, monetizationEvent, priceTier, resolveBuildChannel, shouldLogTrialView } from './monetization';

describe('monetization events (plan §3.6)', () => {
  it('lists the nine events with Firebase-safe names', () => {
    expect(MONETIZATION_EVENT_NAMES).toEqual([
      'paywall_view', 'offer_tap', 'purchase_start', 'purchase_result', 'restore_tap',
      'trial_start', 'trial_view', 'trial_expired', 'trial_to_purchase',
    ]);
    for (const n of MONETIZATION_EVENT_NAMES) expect(n).toMatch(/^[a-z][a-z0-9_]{0,39}$/);
  });

  it('every event carries build_channel', () => {
    expect(monetizationEvent('paywall_view', { source: 'valuation_tile', paywall_kind: 'rc_ui' }, 'testflight'))
      .toEqual({ name: 'paywall_view', params: { source: 'valuation_tile', paywall_kind: 'rc_ui', build_channel: 'testflight' } });
    expect(monetizationEvent('trial_to_purchase', { market: 'tw', product: 'dappgo_pro_yearly' }, 'production').params)
      .toEqual({ market: 'tw', product: 'dappgo_pro_yearly', build_channel: 'production' });
  });

  it('drops values that are not identifiers (no free text, no personal data)', () => {
    expect(monetizationEvent('paywall_view', { source: 'Me <a@b.c>', paywall_kind: 'custom' }, 'dev').params.source).toBe('unknown');
    expect(monetizationEvent('offer_tap', { product: 'pro yearly!', price_tier: 'mid', source: 'settings', paywall_kind: 'odd' as never }, 'dev').params)
      .toEqual({ price_tier: 'mid', source: 'settings', build_channel: 'dev' });
    expect(monetizationEvent('purchase_result', { product: 'p', result: 'weird' as never, paywall_kind: 'rc_ui' }, 'dev').params).toEqual({ product: 'p', paywall_kind: 'rc_ui', build_channel: 'dev' });
    expect(monetizationEvent('trial_start', { market: 'jp' as never }, 'dev').params).toEqual({ build_channel: 'dev' });
    expect(monetizationEvent('restore_tap', { source: 'settings' }, 'bogus' as never).params.build_channel).toBe('dev');
  });

  it('resolves the build channel', () => {
    expect(resolveBuildChannel({ isDev: true, profile: 'production' })).toBe('dev');
    expect(resolveBuildChannel({ isDev: false, profile: 'production', isTestFlight: true })).toBe('testflight');
    expect(resolveBuildChannel({ isDev: false, profile: 'production' })).toBe('production');
    expect(resolveBuildChannel({ isDev: false, profile: 'preview' })).toBe('internal');
  });

  it('trial_view at most once a day', () => {
    const now = new Date(2026, 10, 24, 9);
    expect(shouldLogTrialView(null, now)).toEqual({ log: true, day: '2026-11-24' });
    expect(shouldLogTrialView('2026-11-24', now).log).toBe(false);
    expect(shouldLogTrialView('2026-11-23', now).log).toBe(true);
  });

  it('price tiers', () => {
    expect([priceTier(2.99), priceTier(4.99), priceTier(29.99), priceTier(null)]).toEqual(['low', 'mid', 'high', 'unknown']);
  });
});
