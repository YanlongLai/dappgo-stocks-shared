import { DAPPGO_PRODUCTS, DAPPGO_PROMOTION_COPY, getDappGoSiblingProducts } from './dappgo-products';

describe('DappGo product promotion contract', () => {
  it('matches all six published official store destinations', () => {
    expect(DAPPGO_PRODUCTS.map(({ id, ios, android }) => ({ id, ios, android }))).toEqual([
      { id: 'options', ios: 'https://apps.apple.com/app/id6768116720', android: 'https://play.google.com/store/apps/details?id=com.dappgo.optionsapp' },
      { id: 'us-stocks', ios: 'https://apps.apple.com/us/app/us-stocks/id6768116546', android: 'https://play.google.com/store/apps/details?id=com.dappgo.usstocksapp' },
      { id: 'tw-stocks', ios: 'https://apps.apple.com/app/id6768116538', android: 'https://play.google.com/store/apps/details?id=com.dappgo.twstocksapp' },
    ]);
  });
  for (const current of DAPPGO_PRODUCTS) {
    for (const platform of ['ios', 'android', 'web', 'windows']) {
      for (const language of ['en', 'zh'] as const) {
        it(`${current.id}/${platform}/${language} excludes itself with localized store links`, () => {
          const products = getDappGoSiblingProducts(current.id, platform, language);
          expect(products).toHaveLength(2);
          expect(new Set(products.map((p) => p.id)).size).toBe(2);
          for (const product of products) {
            expect(product.id).not.toBe(current.id);
            const canonical = DAPPGO_PRODUCTS.find((p) => p.id === product.id)!;
            expect(product.summary).toBe(canonical.summary[language]);
            expect(product.summary).not.toMatch(/25|VIP|verdicts/);
            expect(product.url).toBe(platform === 'ios' ? canonical.ios : platform === 'android' ? canonical.android : canonical.web);
            expect(product.accessibilityLabel).toBe(DAPPGO_PROMOTION_COPY[language].open(product.name, product.destination));
            expect(new URL(product.url).protocol).toBe('https:');
          }
        });
      }
    }
  }
  it('returns fresh view models without mutating the catalog', () => {
    const products = getDappGoSiblingProducts('options', 'ios', 'en');
    products[0].summary = 'changed';
    expect(getDappGoSiblingProducts('options', 'ios', 'en')[0].summary).not.toBe('changed');
  });
});
