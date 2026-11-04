import { resolveBannerAdUnitId } from './admob-config';

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
