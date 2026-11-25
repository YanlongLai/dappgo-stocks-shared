import { alertLine, type AlertLabels } from './today-alerts';
import { changesSince, rollMarks } from '../personalization/model';

const l: AlertLabels = {
  belowRange: (p) => `跌破估值下緣 · ${p}`,
  aboveRange: (p) => `升到偏高區間 · ${p}`,
  backInRange: (p) => `回到估值區間 · ${p}`,
  zoneChanged: '估值區間改變',
  signal: (a, b) => `訊號 ${a} → ${b}`,
  flow: (pc) => `Put/Call 量 ${pc} 倍`,
  flowNoValue: '選擇權量能異常',
  signalName: (v) => ({ bullish: '偏多', neutral: '中性' } as Record<string, string>)[v] ?? v,
  formatPrice: (v) => v.toFixed(2),
  formatRatio: (v) => v.toFixed(1),
};

describe('今日提醒 lines', () => {
  it('zone, signal and flow read as concrete changes', () => {
    expect(alertLine({ symbol: 'A', reason: 'favorite', change: 'zone', from: 'within', to: 'below', mark: { zone: 'below', signal: null, low: 182.3, price: 180 } }, l)).toBe('跌破估值下緣 · 182.30');
    expect(alertLine({ symbol: 'A', reason: 'favorite', change: 'zone', from: 'within', to: 'far_above', mark: { zone: 'far_above', signal: null, price: 412 } }, l)).toBe('升到偏高區間 · 412.00');
    expect(alertLine({ symbol: 'A', reason: 'favorite', change: 'zone', from: 'below', to: 'within', mark: { zone: 'within', signal: null, price: 96.1 } }, l)).toBe('回到估值區間 · 96.10');
    expect(alertLine({ symbol: 'A', reason: 'often_viewed', change: 'signal', from: 'bullish', to: 'neutral' }, l)).toBe('訊號 偏多 → 中性');
    expect(alertLine({ symbol: 'A', reason: 'favorite', change: 'flow', mark: { zone: null, signal: null, pc: 2.4 } }, l)).toBe('Put/Call 量 2.4 倍');
    expect(alertLine({ symbol: 'A', reason: 'favorite', change: 'flow' }, l)).toBe('選擇權量能異常');
  });

  it('no alerts on first use (no previous day) and none for neutral flow', () => {
    const first = rollMarks(null, '2026-11-24', { A: { zone: 'below', signal: 'bullish', flowFlag: 'unusual_put' } });
    expect(changesSince(first)).toEqual([]);
    const next = rollMarks(first, '2026-11-25', { A: { zone: 'below', signal: 'bullish', flowFlag: 'neutral' } });
    expect(changesSince(next).filter((c) => c.change)).toEqual([]);
    const third = rollMarks(next, '2026-11-26', { A: { zone: 'within', signal: 'neutral', price: 10 } });
    expect(changesSince(third)[0]).toMatchObject({ change: 'zone', from: 'below', to: 'within' });
  });
});
