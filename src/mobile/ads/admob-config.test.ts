import {
  resolveAppOpenAdUnitId,
  resolveBannerAdUnitId,
  resolveInterstitialAdUnitId,
  resolveRewardedAdUnitId,
} from './admob-config';

const release = {
  isDevelopment: false,
  adsMode: 'production',
  adsBuildProfile: 'production',
  testUnitId: 'test-unit',
  productionUnitId: 'production-unit',
};

describe('emulator guard', () => {
  it('serves the test unit to an emulator in a production store build', () => {
    expect(resolveBannerAdUnitId({ ...release, isPhysicalDevice: false })).toBe('test-unit');
    expect(resolveAppOpenAdUnitId({ ...release, isPhysicalDevice: false })).toBe('test-unit');
    expect(resolveInterstitialAdUnitId({ ...release, isPhysicalDevice: false })).toBe('test-unit');
    expect(resolveRewardedAdUnitId({ ...release, isPhysicalDevice: false })).toBe('test-unit');
  });

  it('keeps production units on a physical device', () => {
    expect(resolveBannerAdUnitId({ ...release, isPhysicalDevice: true })).toBe('production-unit');
  });

  it('keeps the build decision when device detection is unavailable', () => {
    expect(resolveBannerAdUnitId({ ...release })).toBe('production-unit');
    expect(resolveBannerAdUnitId({ ...release, isPhysicalDevice: undefined })).toBe('production-unit');
  });

  it('never falls back to a production unit on an emulator', () => {
    expect(resolveBannerAdUnitId({ ...release, testUnitId: '', isPhysicalDevice: false })).toBe('');
  });
});

describe('resolveBannerAdUnitId', () => {
  it('uses the test ID for development builds', () => {
    expect(
      resolveBannerAdUnitId({
        isDevelopment: true,
        testUnitId: 'test-banner',
        productionUnitId: 'production-banner',
      }),
    ).toBe('test-banner');
  });

  it('uses the production ID for release builds', () => {
    expect(
      resolveBannerAdUnitId({
        isDevelopment: false,
        adsMode: 'production',
        adsBuildProfile: 'production',
        testUnitId: 'test-banner',
        productionUnitId: 'production-banner',
      }),
    ).toBe('production-banner');
  });

  it('does not fall back to a production ID in development', () => {
    expect(
      resolveBannerAdUnitId({
        isDevelopment: true,
        testUnitId: '',
        productionUnitId: 'production-banner',
      }),
    ).toBe('');
  });

  it('keeps release-like builds on test ads unless production is explicit', () => {
    expect(
      resolveBannerAdUnitId({
        isDevelopment: false,
        testUnitId: 'test-banner',
        productionUnitId: 'production-banner',
      }),
    ).toBe('test-banner');
  });

  it('keeps production mode on test ads without the production build marker', () => {
    expect(
      resolveBannerAdUnitId({
        isDevelopment: false,
        adsMode: 'production',
        testUnitId: 'test-banner',
        productionUnitId: 'production-banner',
      }),
    ).toBe('test-banner');
  });

  it('returns empty when release has no production ID configured', () => {
    expect(
      resolveBannerAdUnitId({
        isDevelopment: false,
        adsMode: 'production',
        adsBuildProfile: 'production',
        testUnitId: 'test-banner',
        productionUnitId: '',
      }),
    ).toBe('');
  });
});
