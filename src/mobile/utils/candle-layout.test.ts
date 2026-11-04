import { layoutCandles } from './candle-layout';
import type { CandleBar } from './candle-layout';

const W = 300;
const H = 148; // innerH (height - padY*2 where padY=16, height=180)
const PAD = 36;
const Y_MIN = 90;
const Y_MAX = 110;

function makeBar(o: number, h: number, l: number, c: number, date = '2024-01-01'): CandleBar {
  return { date, open: o, high: h, low: l, close: c };
}

describe('layoutCandles', () => {
  it('returns empty array for empty input', () => {
    const result = layoutCandles([], W, H, PAD, Y_MIN, Y_MAX);
    expect(result).toHaveLength(0);
  });

  it('single candle: visible, centered x, correct y values', () => {
    const bars = [makeBar(100, 105, 95, 102)];
    const [c] = layoutCandles(bars, W, H, PAD, Y_MIN, Y_MAX);

    expect(c.visible).toBe(true);
    // x should be padding + half the inner width (only 1 bar → step = innerW)
    const innerW = W - PAD * 2;
    expect(c.x).toBeCloseTo(PAD + innerW / 2, 1);

    // close=102 is above open=100 → bullish
    expect(c.bullish).toBe(true);

    // y_high < y_low (SVG y increases downward)
    expect(c.y_high).toBeLessThan(c.y_low);
    // y_close < y_open (close 102 > open 100 → closer to top)
    expect(c.y_close).toBeLessThan(c.y_open);
  });

  it('all flat OHLC: visible and body has zero height (y_open === y_close)', () => {
    const bars = [makeBar(100, 100, 100, 100)];
    const [c] = layoutCandles(bars, W, H, PAD, Y_MIN, Y_MAX);
    expect(c.visible).toBe(true);
    expect(c.y_open).toBeCloseTo(c.y_close, 5);
    expect(c.y_high).toBeCloseTo(c.y_low, 5);
  });

  it('missing data (NaN open) → visible=false', () => {
    const bar = { date: '2024-01-01', open: NaN, high: 105, low: 95, close: 100 };
    const [c] = layoutCandles([bar], W, H, PAD, Y_MIN, Y_MAX);
    expect(c.visible).toBe(false);
  });

  it('bullish vs bearish detection', () => {
    const bullish = makeBar(98, 106, 97, 104);
    const bearish = makeBar(104, 106, 97, 98);
    const [b, be] = layoutCandles([bullish, bearish], W, H, PAD, Y_MIN, Y_MAX);
    expect(b.bullish).toBe(true);
    expect(be.bullish).toBe(false);
  });

  it('x-spacing: each candle is one step apart', () => {
    const bars = [
      makeBar(100, 102, 99, 101, '2024-01-01'),
      makeBar(101, 103, 100, 102, '2024-01-02'),
      makeBar(102, 104, 101, 103, '2024-01-03'),
    ];
    const result = layoutCandles(bars, W, H, PAD, Y_MIN, Y_MAX);
    const step = (W - PAD * 2) / 3;
    // Centers should be evenly spaced by `step`
    expect(result[1].x - result[0].x).toBeCloseTo(step, 5);
    expect(result[2].x - result[1].x).toBeCloseTo(step, 5);
  });

  it('typical multi-bar: all visible, y_high <= y_open and y_low >= y_close for bearish', () => {
    const bars = [
      makeBar(105, 108, 99, 100), // bearish
      makeBar(100, 107, 98, 106), // bullish
    ];
    const result = layoutCandles(bars, W, H, PAD, Y_MIN, Y_MAX);
    expect(result.every((c) => c.visible)).toBe(true);
    // bearish: close < open → y_close > y_open (lower on screen = higher y)
    const [bear, bull] = result;
    expect(bear.bullish).toBe(false);
    expect(bear.y_close).toBeGreaterThan(bear.y_open);
    // bullish: close > open → y_close < y_open
    expect(bull.bullish).toBe(true);
    expect(bull.y_close).toBeLessThan(bull.y_open);
  });
});
