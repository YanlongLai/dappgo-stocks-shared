import { vwapDistanceTone } from './vwap-display';

describe('vwapDistanceTone', () => {
  it('returns positive when distance > +5%', () => {
    expect(vwapDistanceTone(10)).toBe('positive');
    expect(vwapDistanceTone(5.1)).toBe('positive');
  });

  it('returns negative when distance < -5%', () => {
    expect(vwapDistanceTone(-10)).toBe('negative');
    expect(vwapDistanceTone(-5.1)).toBe('negative');
  });

  it('returns neutral for -5..+5 range (inclusive boundaries)', () => {
    expect(vwapDistanceTone(5)).toBe('neutral');
    expect(vwapDistanceTone(-5)).toBe('neutral');
    expect(vwapDistanceTone(0)).toBe('neutral');
  });

  it('returns neutral for null or undefined', () => {
    expect(vwapDistanceTone(null)).toBe('neutral');
    expect(vwapDistanceTone(undefined)).toBe('neutral');
  });
});
