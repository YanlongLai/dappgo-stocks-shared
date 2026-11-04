import { migrateLanguagePreference, resolveDeviceLocale, SUPPORTED_LOCALES } from './locale';

describe('resolveDeviceLocale', () => {
  it.each([
    ['en-US', 'en'], ['en-GB', 'en'], ['zh-TW', 'zh-Hant'], ['zh-HK', 'zh-Hant'],
    ['zh-MO', 'zh-Hant'], ['zh-CN', 'zh-Hans'], ['zh-SG', 'zh-Hans'], ['zh', 'zh-Hans'],
    ['zh-Hans-TW', 'zh-Hans'], ['zh-Hant-CN', 'zh-Hant'], ['zh_Hant_HK', 'zh-Hant'],
    ['ja-JP', 'ja'], ['ko-KR', 'ko'], ['es-MX', 'es'], ['es-ES', 'es'], ['fr-FR', 'en'],
  ])('%s resolves to %s', (languageTag, expected) => {
    expect(resolveDeviceLocale([{ languageTag }])).toBe(expected);
  });
  it('uses Expo script and region fields without a language tag', () => {
    expect(resolveDeviceLocale([{ languageCode: 'zh', languageScriptCode: 'Hant', regionCode: 'CN' }])).toBe('zh-Hant');
    expect(resolveDeviceLocale([{ languageCode: 'zh', regionCode: 'TW' }])).toBe('zh-Hant');
  });
  it('walks unsupported preferences in device order', () => {
    expect(resolveDeviceLocale([{ languageTag: 'fr' }, { languageTag: 'ko-KR' }, { languageTag: 'ja' }])).toBe('ko');
  });
  it.each([null, undefined, [], [{ languageTag: null }]])('defaults safely for %s', locales => {
    expect(resolveDeviceLocale(locales)).toBe('en');
  });
});

describe('language preference migration', () => {
  it('preserves legacy Chinese as a manual Traditional Chinese preference', () => {
    expect(migrateLanguagePreference({ language: 'zh' }, 'ja')).toEqual({ language: 'zh-Hant', languageSource: 'manual' });
  });
  it.each(SUPPORTED_LOCALES)('preserves saved %s preferences', language => {
    expect(migrateLanguagePreference({ language }, 'ko')).toEqual({ language, languageSource: 'manual' });
  });
  it.each([undefined, 'xx', '', 42, null])('uses device language for invalid saved value %s', language => {
    expect(migrateLanguagePreference({ language, languageSource: 'manual' }, 'es')).toEqual({ language: 'es', languageSource: 'device' });
  });
  it('refreshes a device-sourced preference on the next launch', () => {
    expect(migrateLanguagePreference({ language: 'en', languageSource: 'device' }, 'ja')).toEqual({ language: 'ja', languageSource: 'device' });
  });
});
