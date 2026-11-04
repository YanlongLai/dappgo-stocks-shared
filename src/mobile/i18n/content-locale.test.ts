import { createContentLocalizer } from './content-locale';
import { SUPPORTED_LOCALES } from './locale';

test('only Simplified Chinese UI reading Traditional Chinese engine prose invokes the converter', () => {
  const converter = jest.fn((text: string) => text.replace('價', '价'));
  const { localizeContent } = createContentLocalizer(converter);
  expect(localizeContent('股價', 'zh-Hans', 'zh-Hant')).toBe('股价');
  expect(converter).toHaveBeenCalledTimes(1);
  for (const locale of SUPPORTED_LOCALES) {
    expect(localizeContent('AAPL rose. 股價', locale, 'en')).toBe('AAPL rose. 股價');
    if (locale !== 'zh-Hans') expect(localizeContent('股價', locale, 'zh-Hant')).toBe('股價');
  }
  expect(converter).toHaveBeenCalledTimes(1);
});
