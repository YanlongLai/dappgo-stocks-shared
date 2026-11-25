import { LIST_ROW, pillWidth, priceWidth } from './columns';

describe('list row columns', () => {
  it('uses the agreed fixed widths', () => {
    expect(LIST_ROW).toMatchObject({ star: 44, nameMin: 72, spark: { width: 64, height: 28 }, price: 88 });
  });
  it('one pill width per language, from its widest label', () => {
    const en = pillWidth(['Bullish', 'Mild bull', 'Neutral', 'Mild bear', 'Bearish']);
    const zh = pillWidth(['偏多', '溫多', '中性', '溫空', '偏空']);
    const es = pillWidth(['Alcista', 'Lig. alcista', 'Neutral', 'Lig. bajista', 'Bajista']);
    expect(zh).toBeLessThan(en);
    expect(en).toBeLessThan(es);
    expect(zh).toBeGreaterThanOrEqual(44);
    expect(en).toBeLessThanOrEqual(90);
    expect(pillWidth(['Neutral'])).toBe(pillWidth(['Neutral', 'Bearish'])); // same-length labels: same width
  });
  it('scales with the text size', () => {
    expect(pillWidth(['Neutral'], 13, 1.4)).toBeGreaterThan(pillWidth(['Neutral'], 13, 1));
    expect(priceWidth(1)).toBe(88);
    expect(priceWidth(2)).toBe(119);
  });
});
