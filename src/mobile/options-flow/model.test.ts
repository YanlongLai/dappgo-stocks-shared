import { buildFlowRows, ratioHeat, sortFlowRows, summarizeFlow } from './model';

// 11-23 Options open interest for a few tickers.
const dd = {
  oi_distribution: {
    EWT: { total_call_oi: 64375, total_put_oi: 158138, pc_oi_ratio: 2.46 },
    OKLO: { total_call_oi: 136882, total_put_oi: 29077, pc_oi_ratio: 0.21 },
    GOOG: { total_call_oi: 290506, total_put_oi: 145885, pc_oi_ratio: 0.5 },
    SPYV: { total_call_oi: 774, total_put_oi: 226, pc_oi_ratio: 0.29 },
    BAD: 'x',
  },
};

describe('buildFlowRows', () => {
  it('uses open interest, skipping thin chains', () => {
    const rows = buildFlowRows(dd);
    expect(rows.map((r) => r.symbol).sort()).toEqual(['EWT', 'GOOG', 'OKLO']);
    expect(rows.every((r) => r.basis === 'oi')).toBe(true);
  });
  it('switches to volume and flags when flow_summary is published', () => {
    const rows = buildFlowRows({ ...dd, flow_summary: { tickers: { GOOG: { pc_vol_ratio: 0.28, pc_vol_ratio_20d: 0.41, volume_vs_20d: 2.3, flag: 'unusual_volume', call_volume: 31234, put_volume: 8870 } } } });
    const goog = rows.find((r) => r.symbol === 'GOOG')!;
    expect(goog).toMatchObject({ basis: 'volume', ratio: 0.28, flag: 'unusual_volume', volumeVs20d: 2.3 });
    expect(rows.find((r) => r.symbol === 'EWT')!.basis).toBe('oi');
  });
});

describe('ratioHeat', () => {
  it('is 0 at 1, ±1 at 3 and 1/3, clamped', () => {
    expect(ratioHeat(1)).toBe(0);
    expect(ratioHeat(3)).toBeCloseTo(1);
    expect(ratioHeat(1 / 3)).toBeCloseTo(-1);
    expect(ratioHeat(10)).toBe(1);
    expect(ratioHeat(0)).toBe(0);
  });
});

describe('sort and summary', () => {
  const rows = buildFlowRows(dd);
  it('sorts by put-heavy, call-heavy and total', () => {
    expect(sortFlowRows(rows, 'put').map((r) => r.symbol)).toEqual(['EWT', 'GOOG', 'OKLO']);
    expect(sortFlowRows(rows, 'call').map((r) => r.symbol)).toEqual(['OKLO', 'GOOG', 'EWT']);
    expect(sortFlowRows(rows, 'total')[0].symbol).toBe('GOOG');
  });
  it('summarises counts and the aggregate ratio', () => {
    expect(summarizeFlow(rows)).toEqual({ count: 3, putHeavy: 1, callHeavy: 2, aggregate: 0.68, basis: 'oi', unusual: 0 });
  });
});
