import type { Locale } from './locale';

/**
 * App adapter owns OpenCC initialization and React hooks. Supply its converter;
 * UI catalogs never pass through this engine-prose conversion path.
 */
export function createContentLocalizer(toSimplified: (text: string) => string) {
  return {
    localizeContent(text: string, locale: Locale, engineLanguage: Locale): string {
      return locale === 'zh-Hans' && engineLanguage === 'zh-Hant' ? toSimplified(text) : text;
    },
  };
}
