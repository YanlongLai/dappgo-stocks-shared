import { validateCatalogs } from './catalog-validation';
import { SUPPORTED_LOCALES } from './locale';

const fixture = () => Object.fromEntries(SUPPORTED_LOCALES.map(locale => [locale, { 'a.key': '{n} shares', 'b.key': 'Hello' }]));

it('accepts sorted, complete catalogs with matching placeholders', () => {
  expect(validateCatalogs(fixture())).toEqual([]);
});
it('rejects missing and extra keys independently of STRICT_I18N', () => {
  const catalogs: Record<string, unknown> = fixture();
  catalogs.ja = { 'a.key': '{n} 株', 'c.key': 'Extra' };
  expect(validateCatalogs(catalogs)).toEqual(expect.arrayContaining(['ja: missing key b.key', 'ja: extra key c.key']));
});
it('rejects changed placeholders and unsorted JSON entries', () => {
  const catalogs = fixture();
  catalogs.ko = { 'b.key': 'Hello', 'a.key': '{count} shares' };
  expect(validateCatalogs(catalogs)).toEqual(expect.arrayContaining(['ko: placeholders differ for a.key', 'ko: keys are not sorted (run npm run i18n:sort)']));
});
it('rejects a missing locale file and nested or empty values', () => {
  const catalogs: Record<string, unknown> = fixture();
  delete catalogs.es;
  catalogs.ja = { 'a.key': { n: 'nested' } };
  catalogs.ko = { 'a.key': '' };
  expect(validateCatalogs(catalogs)).toHaveLength(3);
});
it.each(['es', 'ja', 'ko'])('enforces the short-string length boundary for %s', locale => {
  const catalogs = Object.fromEntries(SUPPORTED_LOCALES.map(code => [code, { label: 'a'.repeat(39) }]));
  catalogs[locale].label = 'b'.repeat(58);
  expect(validateCatalogs(catalogs)).toEqual([]);
  catalogs[locale].label += 'b';
  expect(validateCatalogs(catalogs)).toEqual([`${locale}: label length 59 exceeds 58`]);
  catalogs.en.label += 'a';
  catalogs[locale].label = 'b'.repeat(100);
  expect(validateCatalogs(catalogs)).toEqual([]);
});
it('measures Unicode characters rather than UTF-16 code units', () => {
  const catalogs = Object.fromEntries(SUPPORTED_LOCALES.map(code => [code, { label: '😀'.repeat(10) }]));
  catalogs.es.label = '😀'.repeat(21);
  expect(validateCatalogs(catalogs)).toEqual([]);
  catalogs.es.label += '😀';
  expect(validateCatalogs(catalogs)).toEqual(['es: label length 22 exceeds 21']);
});

