import { daysUntilEarnings, KNOWN_EARNINGS } from './earnings-calendar';

describe('KNOWN_EARNINGS', () => {
  it('lists a date for each configured ticker (or omits it)', () => {
    for (const t of Object.keys(KNOWN_EARNINGS)) {
      const d = KNOWN_EARNINGS[t];
      if (d != null) {
        expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });
});

describe('daysUntilEarnings', () => {
  it('returns null for a ticker with no known date', () => {
    // Typecast to Ticker to satisfy the signature; values outside TICKERS
    // simulate "removed from calendar".
    const result = daysUntilEarnings('AAPL' as any);
    expect(result).toBeNull();
  });

  it('returns null once the date has passed', () => {
    // Monkey-patch a past date temporarily
    const orig = { ...KNOWN_EARNINGS };
    (KNOWN_EARNINGS as any).TEST = '2000-01-01';
    try {
      expect(daysUntilEarnings('TEST' as any)).toBeNull();
    } finally {
      delete (KNOWN_EARNINGS as any).TEST;
    }
  });

  it('returns a positive number for a future known ticker', () => {
    const orig = KNOWN_EARNINGS.TSLA;
    const far = new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10);
    (KNOWN_EARNINGS as any).TSLA = far;
    try {
      const d = daysUntilEarnings('TSLA');
      expect(d).not.toBeNull();
      expect(d!).toBeGreaterThan(0);
    } finally {
      (KNOWN_EARNINGS as any).TSLA = orig;
    }
  });
});
