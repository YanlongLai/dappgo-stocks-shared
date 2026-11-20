import { describeAdsConfig } from './admob-config';

const units = ['ca-app-pub-1234567890123456/1234567890', 'ca-app-pub-1234567890123456/2234567890'];
const release = {
  platform: 'ios' as const,
  isDevelopment: false,
  adsMode: 'production',
  adsBuildProfile: 'production',
  isPhysicalDevice: true,
  productionUnitIds: units,
};

describe('describeAdsConfig', () => {
  it('reports a store build on a phone as production/build', () => {
    expect(describeAdsConfig(release)).toEqual({ platform: 'ios', mode: 'production', reason: 'build' });
    expect(describeAdsConfig({ ...release, platform: 'android' })).toEqual({ platform: 'android', mode: 'production', reason: 'build' });
  });

  it('keeps production when device detection is unavailable', () => {
    expect(describeAdsConfig({ ...release, isPhysicalDevice: undefined }).mode).toBe('production');
  });

  it('reports development bundles first', () => {
    expect(describeAdsConfig({ ...release, isDevelopment: true, isPhysicalDevice: false, adsMode: undefined }))
      .toEqual({ platform: 'ios', mode: 'test', reason: 'dev' });
  });

  it('reports emulators', () => {
    expect(describeAdsConfig({ ...release, isPhysicalDevice: false }))
      .toEqual({ platform: 'ios', mode: 'test', reason: 'emulator' });
  });

  it('reports non-production build markers as test/build', () => {
    expect(describeAdsConfig({ ...release, adsMode: undefined })).toEqual({ platform: 'ios', mode: 'test', reason: 'build' });
    expect(describeAdsConfig({ ...release, adsBuildProfile: 'preview' })).toEqual({ platform: 'ios', mode: 'test', reason: 'build' });
  });

  it('reports a production build with a missing or invalid unit', () => {
    expect(describeAdsConfig({ ...release, productionUnitIds: [units[0], ''] }))
      .toEqual({ platform: 'ios', mode: 'production', reason: 'missing_unit' });
    expect(describeAdsConfig({ ...release, productionUnitIds: [units[0], 'ca-app-pub-3940256099942544'] }).reason).toBe('missing_unit');
    expect(describeAdsConfig({ ...release, productionUnitIds: [] }).reason).toBe('missing_unit');
  });

  it('carries only platform, mode and reason', () => {
    expect(Object.keys(describeAdsConfig(release)).sort()).toEqual(['mode', 'platform', 'reason']);
  });
});
