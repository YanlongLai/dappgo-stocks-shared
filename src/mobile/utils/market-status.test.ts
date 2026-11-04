import { getMarketStatus, calcDte } from './market-status';

describe('getMarketStatus', () => {
  it('returns an object with label and isOpen', () => {
    const s = getMarketStatus();
    expect(typeof s.label).toBe('string');
    expect(typeof s.isOpen).toBe('boolean');
    expect(['Open', 'Closed']).toContain(s.label);
  });

  it('label matches isOpen semantic', () => {
    const s = getMarketStatus();
    expect(s.label === 'Open' ? s.isOpen : !s.isOpen).toBe(true);
  });
});

describe('calcDte', () => {
  it('returns null for empty / invalid', () => {
    expect(calcDte('')).toBeNull();
    expect(calcDte('not-a-date')).toBeNull();
  });

  it('clamps past dates to 0', () => {
    expect(calcDte('1999-01-01')).toBe(0);
  });

  it('returns positive for future date', () => {
    const tomorrow = new Date(Date.now() + 48 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    expect(calcDte(tomorrow)).toBeGreaterThan(0);
  });
});
