/** Public product destinations verified against dappgo.com/config/product-catalog.json.
 * Keep native consumers offline-capable; do not fetch a mutable catalog at render time.
 */
export type DappGoApp = 'options' | 'us-stocks' | 'tw-stocks';
export type DappGoLanguage = 'en' | 'zh';

export const DAPPGO_PRODUCTS = [
  {
    id: 'options',
    name: 'Options Explorer',
    summary: {
      en: 'Daily options research and strategy comparisons.',
      zh: '每日選擇權研究與策略比較。',
    },
    icon: 'trending-up-outline',
    ios: 'https://apps.apple.com/app/id6768116720',
    android: 'https://play.google.com/store/apps/details?id=com.dappgo.optionsapp',
    web: 'https://options.dappgo.com/us/',
  },
  {
    id: 'us-stocks',
    name: 'US Stocks',
    summary: {
      en: 'US stock research, market signals and news.',
      zh: '美股研究、市場訊號與新聞。',
    },
    icon: 'pulse-outline',
    ios: 'https://apps.apple.com/us/app/us-stocks/id6768116546',
    android: 'https://play.google.com/store/apps/details?id=com.dappgo.usstocksapp',
    web: 'https://stocks.dappgo.com/us/',
  },
  {
    id: 'tw-stocks',
    name: 'TW Stocks',
    summary: {
      en: 'Taiwan stock research, market signals and news.',
      zh: '台股研究、市場訊號與新聞。',
    },
    icon: 'analytics-outline',
    ios: 'https://apps.apple.com/app/id6768116538',
    android: 'https://play.google.com/store/apps/details?id=com.dappgo.twstocksapp',
    web: 'https://stocks.dappgo.com/tw/',
  },
] as const;

export const DAPPGO_PROMOTION_COPY = {
  en: {
    title: 'More DappGo apps',
    web: 'Web app',
    errorTitle: 'Unable to open link',
    errorMessage: 'Please try again or visit dappgo.com for all download links.',
    open: (name: string, destination: string) => `Open ${name} in ${destination}`,
  },
  zh: {
    title: '更多 DappGo App',
    web: '網頁版',
    errorTitle: '無法開啟連結',
    errorMessage: '請稍後再試，或前往 dappgo.com 查看下載連結。',
    open: (name: string, destination: string) => `在 ${destination} 開啟 ${name}`,
  },
} as const;

/** Unsupported/native-desktop platforms use the product website, never the wrong store. */
export function getDappGoSiblingProducts(
  currentApp: DappGoApp,
  platform: string,
  language: DappGoLanguage,
) {
  const destination = platform === 'ios' ? 'App Store'
    : platform === 'android' ? 'Google Play' : DAPPGO_PROMOTION_COPY[language].web;
  return DAPPGO_PRODUCTS.filter((product) => product.id !== currentApp).map((product) => ({
    id: product.id,
    name: product.name,
    summary: product.summary[language],
    icon: product.icon,
    url: platform === 'ios' ? product.ios : platform === 'android' ? product.android : product.web,
    destination,
    accessibilityLabel: DAPPGO_PROMOTION_COPY[language].open(product.name, destination),
  }));
}
