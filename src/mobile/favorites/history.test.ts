import {
  backfillPriceAtAdd, changeSinceAdded, EMPTY_HISTORY, migrateHistory, recordView, recordVisit, RECENT_LIMIT, sinceLastVisit,
} from './history';

const bars = [
  { date: '2026-10-01', close: 100 }, { date: '2026-10-02', close: 102 }, { date: '2026-10-05', close: 98 },
];

describe('price at add', () => {
  it('uses the close on or just before the added day', () => {
    expect(backfillPriceAtAdd('2026-10-02T09:00:00Z', bars)).toBe(102);
    expect(backfillPriceAtAdd('2026-10-04T09:00:00Z', bars)).toBe(102); // weekend → Friday close
    expect(backfillPriceAtAdd('2026-10-06T09:00:00Z', bars)).toBe(98);
  });
  it('is null beyond the history window or without history', () => {
    expect(backfillPriceAtAdd('2026-09-01T00:00:00Z', bars)).toBeNull();
    expect(backfillPriceAtAdd('2026-10-02T00:00:00Z', [])).toBeNull();
  });
  it('computes the change since added', () => {
    expect(changeSinceAdded(100, 110)).toBeCloseTo(10);
    expect(changeSinceAdded(null, 110)).toBeNull();
    expect(changeSinceAdded(0, 110)).toBeNull();
  });
});

describe('recent and visits', () => {
  const now = new Date('2026-11-24T02:00:00Z');
  it('keeps the newest view first, de-duplicates and trims', () => {
    let h = EMPTY_HISTORY;
    for (let i = 0; i < RECENT_LIMIT + 3; i += 1) h = recordView(h, `S${i}`, new Date(now.getTime() + i * 1000));
    h = recordView(h, 'S5', new Date(now.getTime() + 99_000));
    expect(h.recent).toHaveLength(RECENT_LIMIT);
    expect(h.recent[0].symbol).toBe('S5');
    expect(h.recent.filter((r) => r.symbol === 'S5')).toHaveLength(1);
  });
  it('drops views older than 30 days', () => {
    const old = { ...EMPTY_HISTORY, recent: [{ symbol: 'OLD', viewedAt: '2026-09-01T00:00:00Z' }] };
    expect(recordView(old, 'NEW', now).recent.map((r) => r.symbol)).toEqual(['NEW']);
  });
  it('records the visit snapshot', () => {
    expect(recordVisit(EMPTY_HISTORY, { A: { tone: 'neutral' } }, now).lastVisit).toEqual({ at: now.toISOString(), snapshot: { A: { tone: 'neutral' } } });
  });
  it('migrates unknown or corrupt input', () => {
    expect(migrateHistory(null)).toEqual(EMPTY_HISTORY);
    expect(migrateHistory({ recent: [{ symbol: 'A', viewedAt: 'x' }, { bad: 1 }], lastVisit: { at: 'x', snapshot: {} } })).toEqual({
      version: 3, lastVisit: { at: 'x', snapshot: {} }, recent: [{ symbol: 'A', viewedAt: 'x' }],
    });
  });
});

describe('sinceLastVisit', () => {
  const last = { at: '2026-11-22T21:40:00Z', snapshot: {
    AAPL: { tone: 'neutral', zone: 'within', pcFlag: null },
    '2454': { tone: 'neutral', zone: 'below', risk: null },
    NVDA: { tone: 'neutral', pcFlag: null },
  } };
  it('reports signal, valuation, risk, P/C and big moves, most consequential first', () => {
    const events = sinceLastVisit(['AAPL', '2454', 'NVDA', 'SOXL', 'GONE'], last, {
      AAPL: { tone: 'mildBullish', zone: 'above', changePct: 2.5 },
      '2454': { tone: 'neutral', zone: 'below', risk: 'attention', changePct: 10 },
      NVDA: { tone: 'neutral', pcFlag: 'unusual_put', changePct: 1 },
      SOXL: { tone: 'neutral', changePct: 39.9 },
    });
    expect(events.map((e) => `${e.kind}:${e.symbol}`)).toEqual([
      'signal:AAPL', 'valuation:AAPL', 'risk:2454', 'pcFlag:NVDA', 'bigMove:2454', 'bigMove:SOXL',
    ]);
    expect(events[0]).toEqual({ symbol: 'AAPL', kind: 'signal', from: 'neutral', to: 'mildBullish' });
  });
  it('is quiet with no changes', () => {
    expect(sinceLastVisit(['AAPL'], last, { AAPL: { tone: 'neutral', zone: 'within', changePct: 0.5 } })).toEqual([]);
    expect(sinceLastVisit(['AAPL'], null, { AAPL: { tone: 'neutral', changePct: 0.5 } })).toEqual([]);
  });
});
