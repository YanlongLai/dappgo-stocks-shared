import { lookupTranslation } from './translate';

const catalogs = { en: { hello: 'Hello {name}', count: '{n} of {total}', blank: '' }, es: { hello: 'Hola {name}' } };

it('looks up the requested locale before English, then returns unknown dynamic keys', () => {
  expect(lookupTranslation(catalogs, 'es', 'hello')).toBe('Hola {name}');
  expect(lookupTranslation(catalogs, 'es', 'count')).toBe('{n} of {total}');
  expect(lookupTranslation(catalogs, 'ko', 'hello')).toBe('Hello {name}');
  expect(lookupTranslation(catalogs, 'ja', 'family.unknown')).toBe('family.unknown');
});
it('replaces repeated placeholders, including zero, without treating values as replacement syntax', () => {
  expect(lookupTranslation({ en: { value: '{n} / {n} / {name}' } }, 'en', 'value', { n: 0, name: '$&' })).toBe('0 / 0 / $&');
});
it('preserves placeholders when a caller uses the existing replace-at-call-site signature', () => {
  expect(lookupTranslation(catalogs, 'es', 'count', { n: 2 })).toBe('2 of {total}');
});
it('returns unknown keys safely even when they match Object prototype properties', () => {
  expect(lookupTranslation(catalogs, 'ja', 'constructor')).toBe('constructor');
  expect(lookupTranslation(catalogs, 'ja', 'toString')).toBe('toString');
});
