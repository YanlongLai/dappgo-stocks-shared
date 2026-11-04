import { reportBadge, alertBadge } from './tab-badges';

describe('reportBadge', () => {
  it('returns dot when current date is newer than last seen', () => {
    expect(reportBadge('2025-05-02', '2025-05-01')).toBe('•');
  });

  it('returns undefined when current date equals last seen', () => {
    expect(reportBadge('2025-05-01', '2025-05-01')).toBeUndefined();
  });

  it('returns dot when last seen is null (first visit)', () => {
    expect(reportBadge('2025-05-01', null)).toBe('•');
  });

  it('returns undefined when current date is null (no data yet)', () => {
    expect(reportBadge(null, '2025-05-01')).toBeUndefined();
  });

  it('returns undefined when current date is older than last seen', () => {
    expect(reportBadge('2025-04-30', '2025-05-01')).toBeUndefined();
  });
});

describe('alertBadge', () => {
  it('returns count string when there are unseen alerts', () => {
    expect(alertBadge(5, 3)).toBe('2');
  });

  it('returns undefined when count equals last seen', () => {
    expect(alertBadge(3, 3)).toBeUndefined();
  });

  it('returns undefined when current count is below last seen', () => {
    expect(alertBadge(2, 5)).toBeUndefined();
  });

  it('returns 99+ when unseen count exceeds 99', () => {
    expect(alertBadge(105, 0)).toBe('99+');
  });

  it('returns 1 when exactly one new alert', () => {
    expect(alertBadge(1, 0)).toBe('1');
  });
});
