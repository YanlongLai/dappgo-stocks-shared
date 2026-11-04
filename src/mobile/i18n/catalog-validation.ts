import { SUPPORTED_LOCALES } from './locale';

/** Pure validation shared by the CLI and its regression tests. */
export function validateCatalogs(catalogs: Record<string, unknown>): string[] {
  const errors: string[] = [];
  const isFlat = (value: unknown): value is Record<string, string> =>
    !!value && typeof value === 'object' && !Array.isArray(value) && Object.values(value).every(v => typeof v === 'string' && v.length > 0);
  const en = catalogs.en;
  if (!isFlat(en)) return ['en: expected a flat object of nonempty strings'];
  const baseKeys = Object.keys(en);
  const placeholders = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort().join(',');
  for (const locale of new Set([...SUPPORTED_LOCALES, ...Object.keys(catalogs)])) {
    const catalog = catalogs[locale];
    if (!isFlat(catalog)) {
      errors.push(`${locale}: expected a flat object of nonempty strings`);
      continue;
    }
    const keys = Object.keys(catalog);
    if (keys.join('\n') !== [...keys].sort().join('\n')) errors.push(`${locale}: keys are not sorted (run npm run i18n:sort)`);
    for (const key of baseKeys) {
      if (!Object.prototype.hasOwnProperty.call(catalog, key)) errors.push(`${locale}: missing key ${key}`);
      else {
        if (placeholders(catalog[key]) !== placeholders(en[key])) errors.push(`${locale}: placeholders differ for ${key}`);
        const enLength = [...en[key]].length;
        const length = [...catalog[key]].length;
        if (['es', 'ja', 'ko'].includes(locale) && enLength < 40 && length > enLength * 1.3 + 8) {
          errors.push(`${locale}: ${key} length ${length} exceeds ${Math.floor(enLength * 1.3 + 8)}`);
        }
      }
    }
    for (const key of keys) {
      if (!Object.prototype.hasOwnProperty.call(en, key)) errors.push(`${locale}: extra key ${key}`);
    }
  }
  return errors;
}
