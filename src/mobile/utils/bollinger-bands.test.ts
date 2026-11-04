import { computeBollinger } from './bollinger-bands';

describe('computeBollinger', () => {
  it('returns nulls when input shorter than period', () => {
    const out = computeBollinger([1, 2, 3], 20);
    expect(out.upper.every((v) => v === null)).toBe(true);
    expect(out.middle.every((v) => v === null)).toBe(true);
    expect(out.lower.every((v) => v === null)).toBe(true);
  });

  it('emits values starting at index period-1', () => {
    const series = Array.from({ length: 25 }, (_, i) => i + 1);
    const out = computeBollinger(series, 20);
    for (let i = 0; i < 19; i++) {
      expect(out.middle[i]).toBeNull();
      expect(out.upper[i]).toBeNull();
      expect(out.lower[i]).toBeNull();
    }
    expect(out.middle[19]).not.toBeNull();
    expect(out.upper[19]).not.toBeNull();
    expect(out.lower[19]).not.toBeNull();
  });

  it('middle = SMA of last `period` values', () => {
    const series = [10, 12, 14, 16, 18];
    const out = computeBollinger(series, 5);
    expect(out.middle[4]).toBeCloseTo((10 + 12 + 14 + 16 + 18) / 5, 5);
  });

  it('upper > middle > lower at populated indices', () => {
    const series = [10, 12, 14, 11, 13, 15, 12, 14, 16, 18];
    const out = computeBollinger(series, 5);
    for (let i = 4; i < series.length; i++) {
      const u = out.upper[i]!;
      const m = out.middle[i]!;
      const l = out.lower[i]!;
      expect(u).toBeGreaterThan(m);
      expect(m).toBeGreaterThan(l);
      // 2-sigma symmetry: distance up == distance down
      expect(u - m).toBeCloseTo(m - l, 5);
    }
  });

  it('zero-variance window collapses bands onto middle', () => {
    const series = [50, 50, 50, 50, 50];
    const out = computeBollinger(series, 5);
    expect(out.middle[4]).toBe(50);
    expect(out.upper[4]).toBe(50);
    expect(out.lower[4]).toBe(50);
  });

  it('multiplier scales the band width', () => {
    const series = [10, 11, 12, 13, 14, 15];
    const sd1 = computeBollinger(series, 5, 1);
    const sd2 = computeBollinger(series, 5, 2);
    const w1 = sd1.upper[4]! - sd1.lower[4]!;
    const w2 = sd2.upper[4]! - sd2.lower[4]!;
    expect(w2).toBeCloseTo(w1 * 2, 5);
  });

  it('output length matches input length', () => {
    for (const n of [0, 1, 5, 19, 20, 21, 100]) {
      const series = Array.from({ length: n }, (_, i) => i);
      const out = computeBollinger(series, 20);
      expect(out.upper.length).toBe(n);
      expect(out.middle.length).toBe(n);
      expect(out.lower.length).toBe(n);
    }
  });

  it('handles non-positive period defensively', () => {
    const series = [1, 2, 3];
    const out = computeBollinger(series, 0);
    expect(out.upper.every((v) => v === null)).toBe(true);
  });
});
