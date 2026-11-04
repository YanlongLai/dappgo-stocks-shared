import { signalLabel } from './signal-labels';

describe('signalLabel', () => {
  const translate = (key: string) => ({
    'signalLabel.trend.strong_up': 'Strong Up',
  } as Record<string, string>)[key] ?? key;

  it('uses the translated label', () => {
    expect(signalLabel('trend', 'strong_up', translate)).toBe('Strong Up');
  });

  it('does not leak an untranslated engine token', () => {
    expect(signalLabel('trend', 'unknown_slug', translate)).toBe('—');
  });

  it('uses a placeholder for missing tokens', () => {
    expect(signalLabel('trend', undefined, translate)).toBe('—');
  });
});
