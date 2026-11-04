import { formatDate, formatNumber, formatPercent } from './format';
import { SUPPORTED_LOCALES } from './locale';


it.each(SUPPORTED_LOCALES)('uses Intl for numbers, percentages and dates in %s', locale => {
  expect(formatNumber(123456.78, { minimumFractionDigits: 2, maximumFractionDigits: 2 }, locale)).toBe(new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(123456.78));
  expect(formatPercent(-12.5, { minimumFractionDigits: 1 }, locale)).toBe(new Intl.NumberFormat(locale, { style: 'percent', minimumFractionDigits: 1 }).format(-0.125));
  const options = { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' } as const;
  expect(formatDate('2026-11-03T23:30:00Z', options, locale)).toBe(new Intl.DateTimeFormat(locale, options).format(new Date('2026-11-03T23:30:00Z')));
});
it('keeps requested precision and returns an empty label for invalid dates', () => {
  expect(formatNumber(1234.5, 2, 'es')).toBe('1234,50');
  expect(formatNumber(12, { minimumFractionDigits: 2, maximumFractionDigits: 2 }, 'es')).toBe('12,00');
  expect(formatDate('invalid', undefined, 'en')).toBe('');
});
