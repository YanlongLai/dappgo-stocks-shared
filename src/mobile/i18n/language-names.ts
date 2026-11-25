import { LOCALE_LABELS, SUPPORTED_LOCALES, type Locale } from './locale';

/**
 * Each app language's name, written in every app language (2.0.1 language
 * picker: 「English／英文」). Rows show the native name; the subtitle is the
 * name in the current UI language, omitted when it is the same.
 */
export const LANGUAGE_NAMES: Record<Locale, Record<Locale, string>> = {
  en: { en: 'English', 'zh-Hant': 'Traditional Chinese', 'zh-Hans': 'Simplified Chinese', ja: 'Japanese', ko: 'Korean', es: 'Spanish', de: 'German', fr: 'French', 'pt-BR': 'Portuguese (Brazil)' },
  'zh-Hant': { en: '英文', 'zh-Hant': '繁體中文', 'zh-Hans': '簡體中文', ja: '日文', ko: '韓文', es: '西班牙文', de: '德文', fr: '法文', 'pt-BR': '葡萄牙文（巴西）' },
  'zh-Hans': { en: '英语', 'zh-Hant': '繁体中文', 'zh-Hans': '简体中文', ja: '日语', ko: '韩语', es: '西班牙语', de: '德语', fr: '法语', 'pt-BR': '葡萄牙语（巴西）' },
  ja: { en: '英語', 'zh-Hant': '繁体字中国語', 'zh-Hans': '簡体字中国語', ja: '日本語', ko: '韓国語', es: 'スペイン語', de: 'ドイツ語', fr: 'フランス語', 'pt-BR': 'ポルトガル語（ブラジル）' },
  ko: { en: '영어', 'zh-Hant': '중국어(번체)', 'zh-Hans': '중국어(간체)', ja: '일본어', ko: '한국어', es: '스페인어', de: '독일어', fr: '프랑스어', 'pt-BR': '포르투갈어(브라질)' },
  es: { en: 'Inglés', 'zh-Hant': 'Chino tradicional', 'zh-Hans': 'Chino simplificado', ja: 'Japonés', ko: 'Coreano', es: 'Español', de: 'Alemán', fr: 'Francés', 'pt-BR': 'Portugués (Brasil)' },
  de: { en: 'Englisch', 'zh-Hant': 'Chinesisch (traditionell)', 'zh-Hans': 'Chinesisch (vereinfacht)', ja: 'Japanisch', ko: 'Koreanisch', es: 'Spanisch', de: 'Deutsch', fr: 'Französisch', 'pt-BR': 'Portugiesisch (Brasilien)' },
  fr: { en: 'Anglais', 'zh-Hant': 'Chinois traditionnel', 'zh-Hans': 'Chinois simplifié', ja: 'Japonais', ko: 'Coréen', es: 'Espagnol', de: 'Allemand', fr: 'Français', 'pt-BR': 'Portugais (Brésil)' },
  'pt-BR': { en: 'Inglês', 'zh-Hant': 'Chinês tradicional', 'zh-Hans': 'Chinês simplificado', ja: 'Japonês', ko: 'Coreano', es: 'Espanhol', de: 'Alemão', fr: 'Francês', 'pt-BR': 'Português (Brasil)' },
};

export interface LanguageChoice {
  locale: Locale;
  /** Native name, e.g. 「English」. */
  label: string;
  /** Name in the current UI language (「英文」); null when it would repeat the label. */
  sub: string | null;
}

export function languageChoices(uiLocale: Locale): LanguageChoice[] {
  return SUPPORTED_LOCALES.map((locale) => {
    const label = LOCALE_LABELS[locale];
    const translated = LANGUAGE_NAMES[uiLocale]?.[locale] ?? null;
    return { locale, label, sub: translated && translated.toLowerCase() !== label.toLowerCase() ? translated : null };
  });
}
