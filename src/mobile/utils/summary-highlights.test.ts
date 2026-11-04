import { highlightSummaryText } from './summary-highlights';
import { stripHighlights } from './highlight-markers';

it.each([
  ['價格 NT$67.10、年增 +7.02%，注意風險。', '[[key:NT$67.10]]', '[[warn:風險]]'],
  ['Revenue +5.2%, price $248.13; risks remain.', '[[key:+5.2%]]', '[[warn:risks]]'],
])('colors figures and risk labels without changing parsed text: %s', (text, figure, risk) => {
  const result = highlightSummaryText(text);
  expect(result).toContain(figure);
  expect(result).toContain(risk);
  expect(stripHighlights(result)).toBe(text);
  expect(highlightSummaryText(result)).toBe(result);
});

it('preserves existing colors and still highlights neighboring plain text', () => {
  const marked = '[[pos:利多 +5%]] [[neg:下跌]] [[key:$20]] [[warn:風險]] [[u:重點]]';
  expect(highlightSummaryText(marked)).toBe(marked);
  expect(highlightSummaryText(marked + ' $30')).toBe(marked + ' [[key:$30]]');
});

it('colors parsed bold text without inventing positive or negative sentiment', () => {
  expect(highlightSummaryText('Growth', true)).toBe('[[key:Growth]]');
  expect(highlightSummaryText('風險偏高', true)).toBe('[[warn:風險偏高]]');
  expect(highlightSummaryText('Growth is uncertain.')).toBe('Growth is uncertain.');
});

it('preserves unknown markers and avoids oversized or multiline emphasis markers', () => {
  expect(highlightSummaryText('[[unknown:$10]]')).toBe('[[unknown:$10]]');
  const long = 'x'.repeat(121);
  expect(highlightSummaryText(long, true)).toBe(long);
  expect(stripHighlights(highlightSummaryText('A\nB $20', true))).toBe('A\nB $20');
});
