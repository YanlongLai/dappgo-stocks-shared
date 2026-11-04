export const SUPPORTED_LOCALES = ['en', 'zh-Hant', 'zh-Hans', 'ja', 'ko', 'es', 'de', 'fr', 'pt-BR'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  'zh-Hant': '繁體中文',
  'zh-Hans': '简体中文',
  ja: '日本語',
  ko: '한국어',
  es: 'Español',
  de: 'Deutsch',
  fr: 'Français',
  'pt-BR': 'Português (Brasil)',
};

export interface DeviceLocale {
  languageTag?: string | null;
  languageCode?: string | null;
  languageScriptCode?: string | null;
  scriptCode?: string | null;
  regionCode?: string | null;
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && SUPPORTED_LOCALES.includes(value as Locale);
}

/** Honor the first supported device preference; an explicit script wins over region. */
export function resolveDeviceLocale(locales: readonly DeviceLocale[] | null | undefined): Locale {
  for (const locale of locales ?? []) {
    const parts = (locale.languageTag ?? '').replace(/_/g, '-').toLowerCase().split('-');
    const language = (locale.languageCode ?? parts[0]).toLowerCase().split('-')[0];
    if (language === 'zh') {
      const script = (locale.languageScriptCode ?? locale.scriptCode ?? parts.find(p => p === 'hans' || p === 'hant') ?? '').toLowerCase();
      if (script === 'hant') return 'zh-Hant';
      if (script === 'hans') return 'zh-Hans';
      const region = (locale.regionCode ?? parts.find(p => ['tw', 'hk', 'mo', 'cn', 'sg'].includes(p)) ?? '').toLowerCase();
      return ['tw', 'hk', 'mo'].includes(region) ? 'zh-Hant' : 'zh-Hans';
    }
    if (language === 'pt') return 'pt-BR';
    if (isLocale(language)) return language;
  }
  return 'en';
}

export type LanguageSource = 'device' | 'manual';

/** Also normalize current-version storage, which may be corrupt or from a newer app. */
export function migrateLanguagePreference(
  saved: { language?: unknown; languageSource?: unknown },
  deviceLocale: Locale,
): { language: Locale; languageSource: LanguageSource } {
  const language = saved.language === 'zh' ? 'zh-Hant' : saved.language;
  if (saved.languageSource === 'device' || !isLocale(language)) {
    return { language: deviceLocale, languageSource: 'device' };
  }
  return { language, languageSource: 'manual' };
}
