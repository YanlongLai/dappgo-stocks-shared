import { buildFlowRows, heatColor, heatColumns, mixHex, ratioHeat, sortFlowRows, summarizeFlow } from './model';

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

describe('heat colours', () => {
  const theme = { card: '#ffffff', callHeavy: '#1a8a3f', putHeavy: '#d02c2c' };
  test('mixHex blends channels and passes non-hex through', () => {
    expect(mixHex('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(mixHex('#000000', '#ffffff', 2)).toBe('#ffffff');
    expect(mixHex('rgb(0,0,0)', '#123456', 0.5)).toBe('#123456');
  });
  test('heatColor is the card at 0 and leans to calls or puts, capped at 55%', () => {
    expect(heatColor(0, theme)).toBe('#ffffff');
    expect(heatColor(-1, theme)).toBe(mixHex('#ffffff', '#1a8a3f', 0.55));
    expect(heatColor(1, theme)).toBe(mixHex('#ffffff', '#d02c2c', 0.55));
    expect(heatColor(5, theme)).toBe(heatColor(1, theme));
  });
  test('heatColumns: three on a phone, more on wide screens', () => {
    expect(heatColumns(0)).toBe(3);
    expect(heatColumns(370)).toBe(3);
    expect(heatColumns(408)).toBe(4);
    expect(heatColumns(637)).toBe(6);
    expect(heatColumns(1000)).toBe(8);
  });
});

describe('flow_summary (2026-11-24, first day of options-core flow)', () => {
  const live = {
    oi_distribution: {
      GOOG: { total_call_oi: 292720, total_put_oi: 147635, pc_oi_ratio: 0.5 },
      TSLA: { total_call_oi: 400000, total_put_oi: 336000, pc_oi_ratio: 0.84 },
    },
    flow_summary: {
      schema_version: 1,
      as_of_date: '2026-11-24',
      tickers: {
        GOOG: { call_volume: 30661, put_volume: 11562, pc_vol_ratio: 0.38, pc_oi_ratio: 0.5, pc_vol_ratio_20d: null, volume_vs_20d: null, flag: null },
        TSLA: { call_volume: 25256, put_volume: 28862, pc_vol_ratio: 1.14, pc_oi_ratio: 0.84, pc_vol_ratio_20d: null, volume_vs_20d: null, flag: null },
      },
    },
  };
  test('volume ratio leads; the 20-day fields stay null until history builds up', () => {
    const rows = buildFlowRows(live);
    const goog = rows.find((r) => r.symbol === 'GOOG')!;
    expect(goog).toMatchObject({ basis: 'volume', ratio: 0.38, pcOi: 0.5, callVolume: 30661, putVolume: 11562, pcVol20d: null, volumeVs20d: null });
    const summary = summarizeFlow(rows);
    expect(summary.basis).toBe('volume');
    expect(summary.aggregate).toBeCloseTo((11562 + 28862) / (30661 + 25256), 2);
    expect(summary.putHeavy).toBe(1);
    expect(summary.callHeavy).toBe(1);
  });
});
