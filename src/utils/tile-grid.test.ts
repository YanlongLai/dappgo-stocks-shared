import { tileGridColumns, tileSpan, tileWidth } from './tile-grid';

describe('tileGridColumns', () => {
  it('uses 2 columns on phones', () => {
    expect(tileGridColumns(343)).toBe(2);
    expect(tileGridColumns(399)).toBe(2);
  });
  it('uses 3 columns from 400 and 4 from 600', () => {
    expect(tileGridColumns(400)).toBe(3);
    expect(tileGridColumns(599)).toBe(3);
    expect(tileGridColumns(600)).toBe(4);
    expect(tileGridColumns(1000)).toBe(4);
  });
  it('falls back to 2 for bad input', () => {
    expect(tileGridColumns(Number.NaN)).toBe(2);
    expect(tileGridColumns(-1)).toBe(2);
  });
});

describe('tileSpan', () => {
  it('maps sizes to spans', () => {
    expect(tileSpan('small', 4)).toBe(1);
    expect(tileSpan('wide', 4)).toBe(2);
    expect(tileSpan('wide', 1)).toBe(1);
  });
});

describe('tileWidth', () => {
  it('fills a phone row with two small tiles', () => {
    const w = tileWidth('small', 343);
    expect(w * 2 + 8).toBeLessThanOrEqual(343);
    expect(w).toBe(167);
  });
  it('makes a wide tile span the full phone row', () => {
    expect(tileWidth('wide', 343)).toBe(343);
  });
  it('fits four small tiles on a wide screen', () => {
    const w = tileWidth('small', 640);
    expect(w * 4 + 8 * 3).toBeLessThanOrEqual(640);
  });
  it('respects a custom gap and returns 0 for no width', () => {
    expect(tileWidth('small', 210, { gap: 10 })).toBe(100);
    expect(tileWidth('small', 0)).toBe(0);
  });
});
