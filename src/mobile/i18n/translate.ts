import type { Locale } from './locale';

export type TranslationParams = Record<string, string | number>;
export type Catalogs = Partial<Record<Locale, Readonly<Record<string, string>>>>;

export function lookupTranslation(
  catalogs: Catalogs,
  locale: Locale,
  key: string,
  params?: TranslationParams,
): string {
  const ownValue = (catalog: Readonly<Record<string, string>> | undefined) =>
    catalog && Object.prototype.hasOwnProperty.call(catalog, key) ? catalog[key] : undefined;
  const template = ownValue(catalogs[locale]) ?? ownValue(catalogs.en) ?? key;
  return template.replace(/\{([\w]+)\}/g, (placeholder, name: string) =>
    params && Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : placeholder,
  );
}
