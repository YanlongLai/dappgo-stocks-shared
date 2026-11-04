import { isDataStale, staleTone } from './stale-detection';

const TODAY = new Date('2024-05-02T10:00:00');

describe('isDataStale', () => {
  it('returns not stale when lastUpdated is today', () => {
    const { stale, daysOld } = isDataStale('2024-05-02', TODAY);
    expect(stale).toBe(false);
    expect(daysOld).toBe(0);
  });

  it('returns stale with daysOld=1 for yesterday', () => {
    const { stale, daysOld } = isDataStale('2024-05-01', TODAY);
    expect(stale).toBe(true);
    expect(daysOld).toBe(1);
  });

  it('returns stale with daysOld=2 for two days ago', () => {
    const { stale, daysOld } = isDataStale('2024-04-30', TODAY);
    expect(stale).toBe(true);
    expect(daysOld).toBe(2);
  });

  it('returns stale with daysOld=5 for five days ago', () => {
    const { stale, daysOld } = isDataStale('2024-04-27', TODAY);
    expect(stale).toBe(true);
    expect(daysOld).toBe(5);
  });

  it('returns stale when lastUpdated is null', () => {
    const { stale, daysOld } = isDataStale(null, TODAY);
    expect(stale).toBe(true);
    expect(daysOld).toBe(Infinity);
  });

  it('returns stale when lastUpdated is a malformed string', () => {
    const { stale, daysOld } = isDataStale('not-a-date', TODAY);
    expect(stale).toBe(true);
    expect(daysOld).toBe(Infinity);
  });
});

describe('staleTone', () => {
  it('returns fresh for 0 days old', () => {
    expect(staleTone(0)).toBe('fresh');
  });

  it('returns amber for 1 day old', () => {
    expect(staleTone(1)).toBe('amber');
  });

  it('returns red for 2 days old', () => {
    expect(staleTone(2)).toBe('red');
  });

  it('returns red for many days old', () => {
    expect(staleTone(10)).toBe('red');
  });
});
