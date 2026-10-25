import { adMeasurement, createAdReporter, validatePaidEvent, type AdMetadata } from './telemetry';
const meta: AdMetadata = { app: 'us_stocks', platform: 'ios', format: 'banner', placement: 'dashboard_primary' };
const consent = { canRequestAds: true, analyticsStorage: true };
test('only fixed metadata reaches custom events', () => {
  const event = adMeasurement({ ...meta, symbol: 'AAPL', url: 'https://private', error: 'secret' } as AdMetadata, 'loaded', consent)!;
  expect(event).toEqual({ name: 'dgo_ad_loaded', params: { app: 'us_stocks', platform: 'ios', format: 'banner', placement: 'dashboard_primary', placement_id: 'us_stocks_ios_dashboard_primary' } });
  expect(adMeasurement({ ...meta, placement: 'AAPL' } as unknown as AdMetadata, 'loaded', consent)).toBeNull();
  expect(adMeasurement(meta, 'ad_impression' as never, consent)).toBeNull();
});
test.each([
  { value: -1, currency: 'USD', precision: 1 }, { value: NaN, currency: 'USD', precision: 1 },
  { value: Infinity, currency: 'USD', precision: 1 }, { value: 1, currency: 'usd', precision: 1 },
  { value: 1, currency: 'ABC', precision: 1 }, { value: 1, currency: 'USD', precision: 4 },
  { valueMicros: 1000, currency: 'USD', precision: 1 }, null,
])('rejects invalid paid %j', (paid) => expect(validatePaidEvent(paid)).toBeNull());
test('preserves SDK major units, deduplicates paid, and gates each event at callback time', () => {
  let state = consent; const emit = jest.fn();
  const report = createAdReporter(meta, () => state, emit);
  const paid = { value: 0.0015, currency: 'USD', precision: 1, symbol: 'secret' };
  state = { canRequestAds: true, analyticsStorage: false };
  report('paid', paid); expect(emit).not.toHaveBeenCalled();
  state = consent; report('paid', paid); report('paid', paid);
  expect(emit).toHaveBeenCalledTimes(1);
  expect(emit.mock.calls[0][0].params).toMatchObject({ value: 0.0015, currency: 'USD', value_unit: 'major' });
  expect(emit.mock.calls[0][0].params.symbol).toBeUndefined();
  state = { canRequestAds: false, analyticsStorage: true };
  report('clicked'); expect(emit).toHaveBeenCalledTimes(1);
});

test('sector banner placement has its own validated metadata and honors measurement consent', () => {
  const sector: AdMetadata = { ...meta, placement: 'sectors_after_second' };
  expect(adMeasurement(sector, 'loaded', consent)?.params.placement_id).toBe('us_stocks_ios_sectors_after_second');
  expect(adMeasurement(sector, 'loaded', { ...consent, analyticsStorage: false })).toBeNull();
});
