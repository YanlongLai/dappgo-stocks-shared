import { LANGUAGE_NAMES, languageChoices } from './language-names';
import { SUPPORTED_LOCALES } from './locale';

describe('language names', () => {
  it('has every language named in every UI language', () => {
    for (const ui of SUPPORTED_LOCALES) for (const l of SUPPORTED_LOCALES) expect(LANGUAGE_NAMES[ui][l]).toBeTruthy();
  });
  it('rows: native name + the name in the UI language, no repeat of the same text', () => {
    const zh = languageChoices('zh-Hant');
    expect(zh[0]).toEqual({ locale: 'en', label: 'English', sub: '英文' });
    expect(zh.find((c) => c.locale === 'zh-Hant')!.sub).toBeNull();
    expect(languageChoices('en').find((c) => c.locale === 'en')!.sub).toBeNull();
    expect(languageChoices('en').find((c) => c.locale === 'ja')).toEqual({ locale: 'ja', label: '日本語', sub: 'Japanese' });
    expect(languageChoices('es').find((c) => c.locale === 'es')!.sub).toBeNull();
    expect(zh).toHaveLength(9);
  });
});
