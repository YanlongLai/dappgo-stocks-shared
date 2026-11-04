import { verdictColor } from './verdict-color';

const colors = {
  positive: '#00c087',
  accent: '#5b6cf7',
  gold: '#e8b84b',
  negative: '#ff4757',
  textMuted: '#7d8199',
};

describe('verdictColor', () => {
  it('BUY → positive bg', () => {
    const r = verdictColor('BUY', colors);
    expect(r.bg).toBe(colors.positive);
    expect(r.fg).toBe('#ffffff');
  });

  it('HOLD → accent bg', () => {
    const r = verdictColor('HOLD', colors);
    expect(r.bg).toBe(colors.accent);
  });

  it('WATCH → gold bg', () => {
    const r = verdictColor('WATCH', colors);
    expect(r.bg).toBe(colors.gold);
  });

  it('AVOID → orange bg', () => {
    const r = verdictColor('AVOID', colors);
    expect(r.bg).toBe('#ff8c42');
  });

  it('SELL → negative bg', () => {
    const r = verdictColor('SELL', colors);
    expect(r.bg).toBe(colors.negative);
  });

  it('null → textMuted fallback', () => {
    const r = verdictColor(null, colors);
    expect(r.bg).toBe(colors.textMuted);
    expect(r.fg).toBe('#ffffff');
  });
});
