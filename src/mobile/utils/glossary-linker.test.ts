import { createGlossaryLinker } from './glossary-linker';

// Copied from the three apps' glossary-data.ts catalogs (the ATM entry is identical).
const terms = [{
  id: 'atm', en: { term: 'ATM (At The Money)', definition: 'Strike price equals current stock price' },
  zh: { term: 'ATM（價平）', definition: '履約價等於目前股價' },
}];

test('the injected locale mapper preserves US extended locales and bilingual app fields', () => {
  const { findGlossaryTerms } = createGlossaryLinker(terms, locale => locale.startsWith('zh') ? 'zh' : 'en');
  expect(findGlossaryTerms('ATM（價平）', 'zh-Hant')).toEqual([{
    term: 'ATM（價平）', definition: '履約價等於目前股價', start: 0, end: 7, id: 'atm',
  }]);
  for (const locale of ['en', 'es']) {
    expect(findGlossaryTerms('ATM (AT THE MONEY)', locale)[0]).toMatchObject({ start: 0, id: 'atm' });
  }
});

test('short forms match once, results are sorted and catalogs are isolated', () => {
  const linker = createGlossaryLinker([
    terms[0], { id: 'iv', en: { term: 'Implied Volatility (IV)', definition: 'Volatility' }, zh: { term: '波動率', definition: '波動' } },
  ], () => 'en');
  expect(linker.findGlossaryTerms('IV; ATM (At The Money); IV', 'en').map(match => [match.id, match.start, match.end])).toEqual([
    ['iv', 0, 2], ['atm', 4, 22],
  ]);
  expect(createGlossaryLinker([], () => 'en').findGlossaryTerms('IV', 'en')).toEqual([]);
  expect(linker.findGlossaryTerms('', 'en')).toEqual([]);
});
