/**
 * Tests for the dashboard schema validator. Pure JS, no RN deps.
 */
import { validateDashboardSchema } from './schema-validator';

function richTicker() {
  return {
    symbol: '2330',
    name: 'TSMC',
    price_change_pct: 0.5,
    indicators: { latest_close: 600 },
    signals: { verdict: 'BUY' },
    price_history: [{ date: '2026-04-30', close: 600 }],
    chip: {},
  };
}

function fullPayload(): Record<string, unknown> {
  return {
    last_updated: '2026-05-02',
    tickers: ['2330'],
    ticker_data: { '2330': richTicker() },
    sector_rotation: { '半導體': { tickers: ['2330'] } },
    recommendations: [],
    cautions: [],
  };
}

describe('validateDashboardSchema', () => {
  it('accepts a complete payload', () => {
    const r = validateDashboardSchema(fullPayload());
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.summary.lastUpdated).toBe('2026-05-02');
      expect(r.summary.tickerCount).toBe(1);
      expect(r.summary.sectorCount).toBe(1);
    }
  });

  it('rejects when last_updated is missing', () => {
    const p = fullPayload();
    delete p.last_updated;
    const r = validateDashboardSchema(p);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.some((e) => e.includes('last_updated'))).toBe(true);
    }
  });

  it('rejects when last_updated is empty string', () => {
    const p = fullPayload();
    p.last_updated = '';
    const r = validateDashboardSchema(p);
    expect(r.ok).toBe(false);
  });

  it('rejects when ticker_data is not an object', () => {
    const p = fullPayload();
    p.ticker_data = [] as unknown as Record<string, unknown>;
    const r = validateDashboardSchema(p);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.some((e) => e.includes('ticker_data'))).toBe(true);
    }
  });

  it('rejects when no ticker has indicators + signals + price_history', () => {
    const p = fullPayload();
    p.ticker_data = {
      '2330': { symbol: '2330', indicators: {}, signals: {} }, // missing price_history
    };
    const r = validateDashboardSchema(p);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.some((e) => e.includes('price_history'))).toBe(true);
    }
  });

  it('rejects when root is null/non-object', () => {
    expect(validateDashboardSchema(null).ok).toBe(false);
    expect(validateDashboardSchema('foo').ok).toBe(false);
    expect(validateDashboardSchema(42).ok).toBe(false);
  });

  it('rejects when recommendations exists but is not an array', () => {
    const p = fullPayload();
    p.recommendations = { foo: 1 } as unknown as unknown[];
    const r = validateDashboardSchema(p);
    expect(r.ok).toBe(false);
  });

  it('accumulates multiple errors', () => {
    const r = validateDashboardSchema({
      // every required field wrong/missing
      ticker_data: 'oops',
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.length).toBeGreaterThan(1);
    }
  });
});
