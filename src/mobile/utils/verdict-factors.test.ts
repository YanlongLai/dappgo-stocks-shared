import { breakdownVerdict, confidenceScore } from './verdict-factors';

describe('breakdownVerdict', () => {
  it('returns empty for undefined signals', () => {
    expect(breakdownVerdict(undefined)).toEqual([]);
  });

  it('produces 4 factors when all signal axes present', () => {
    const out = breakdownVerdict({
      trend_label: 'strong_up', trend_reason: '多頭排列',
      momentum_label: 'bullish', momentum_reason: 'RSI 60',
      volume_label: 'active', volume_reason: '放量',
      chip_label: 'accumulating', chip_reason: '法人買超',
    });
    expect(out).toHaveLength(4);
    expect(out.map((f) => f.tone)).toEqual(['bullish', 'bullish', 'bullish', 'bullish']);
  });

  it('classifies bearish trend + overbought + distributing as bearish/bearish/bearish', () => {
    const out = breakdownVerdict({
      trend_label: 'strong_down',
      momentum_label: 'overbought',
      chip_label: 'distributing',
    });
    expect(out.map((f) => f.tone)).toEqual(['bearish', 'bearish', 'bearish']);
  });

  it('treats oversold momentum as bullish (bounce candidate)', () => {
    const out = breakdownVerdict({ momentum_label: 'oversold' });
    expect(out[0].tone).toBe('bullish');
  });

  it('prefers ownership_label over chip_label when both present (US shape)', () => {
    const out = breakdownVerdict({
      ownership_label: 'buying', ownership_reason: '機構持續買進',
      chip_label: 'distributing',
    });
    const chipFactor = out.find((f) => f.axis === '籌碼');
    expect(chipFactor?.tone).toBe('bullish');
    expect(chipFactor?.reason).toBe('機構持續買進');
  });

  it('marks unknown labels as unknown', () => {
    const out = breakdownVerdict({
      trend_label: 'mystery_label',
      momentum_label: 'mystery',
    });
    expect(out.every((f) => f.tone === 'unknown')).toBe(true);
  });

  it('omits factors where the label is missing', () => {
    const out = breakdownVerdict({ trend_label: 'up' });
    expect(out).toHaveLength(1);
    expect(out[0].axis).toBe('趨勢');
  });
});

describe('confidenceScore', () => {
  it('returns 100 when all factors align bullish', () => {
    const factors = [
      { axis: 'a', rawLabel: 'x', reason: '', tone: 'bullish' as const },
      { axis: 'b', rawLabel: 'x', reason: '', tone: 'bullish' as const },
      { axis: 'c', rawLabel: 'x', reason: '', tone: 'bullish' as const },
      { axis: 'd', rawLabel: 'x', reason: '', tone: 'bullish' as const },
    ];
    expect(confidenceScore(factors)).toBe(100);
  });

  it('returns 75 for 3-of-4 dominance', () => {
    const factors = [
      { axis: 'a', rawLabel: 'x', reason: '', tone: 'bullish' as const },
      { axis: 'b', rawLabel: 'x', reason: '', tone: 'bullish' as const },
      { axis: 'c', rawLabel: 'x', reason: '', tone: 'bullish' as const },
      { axis: 'd', rawLabel: 'x', reason: '', tone: 'bearish' as const },
    ];
    expect(confidenceScore(factors)).toBe(75);
  });

  it('returns 50 when split 2-2', () => {
    const factors = [
      { axis: 'a', rawLabel: 'x', reason: '', tone: 'bullish' as const },
      { axis: 'b', rawLabel: 'x', reason: '', tone: 'bullish' as const },
      { axis: 'c', rawLabel: 'x', reason: '', tone: 'bearish' as const },
      { axis: 'd', rawLabel: 'x', reason: '', tone: 'bearish' as const },
    ];
    expect(confidenceScore(factors)).toBe(50);
  });

  it('ignores unknown when computing confidence base', () => {
    const factors = [
      { axis: 'a', rawLabel: 'x', reason: '', tone: 'bullish' as const },
      { axis: 'b', rawLabel: 'x', reason: '', tone: 'unknown' as const },
    ];
    expect(confidenceScore(factors)).toBe(100);
  });

  it('returns 0 when no factors', () => {
    expect(confidenceScore([])).toBe(0);
  });
});
