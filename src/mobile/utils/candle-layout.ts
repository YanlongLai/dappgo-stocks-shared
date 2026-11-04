export interface CandleBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface CandleGeometry {
  /** Center x of the candle */
  x: number;
  y_high: number;
  y_low: number;
  y_open: number;
  y_close: number;
  /** true when close >= open */
  bullish: boolean;
  /** false when any of o/h/l/c is null or NaN — skip rendering */
  visible: boolean;
}

/**
 * Compute pixel geometry for each candle bar.
 *
 * @param bars    Raw OHLC bars (may have null/NaN values)
 * @param chartWidth  Total SVG width (including left/right padding)
 * @param chartHeight Total SVG height (including top/bottom padding)
 * @param padding Symmetric left/right padding in pixels
 * @param yMin    Bottom of the price range (already padded)
 * @param yMax    Top of the price range (already padded)
 */
export function layoutCandles(
  bars: CandleBar[],
  chartWidth: number,
  chartHeight: number,
  padding: number,
  yMin: number,
  yMax: number
): CandleGeometry[] {
  const n = bars.length;
  if (n === 0) return [];

  const innerW = chartWidth - padding * 2;
  const innerH = chartHeight;
  const totalRange = yMax - yMin || 1;

  // x step: divide inner width by number of bars; center each bar at its slot
  const step = n > 1 ? innerW / n : innerW;

  const toY = (price: number): number =>
    innerH - ((price - yMin) / totalRange) * innerH;

  return bars.map((bar, i) => {
    const { open, high, low, close } = bar;

    const anyBad = (v: number | undefined | null) =>
      v == null || !Number.isFinite(v);

    if (anyBad(open) || anyBad(high) || anyBad(low) || anyBad(close)) {
      return {
        x: padding + step * i + step / 2,
        y_high: 0,
        y_low: 0,
        y_open: 0,
        y_close: 0,
        bullish: true,
        visible: false,
      };
    }

    return {
      x: padding + step * i + step / 2,
      y_high: toY(high),
      y_low: toY(low),
      y_open: toY(open),
      y_close: toY(close),
      bullish: close >= open,
      visible: true,
    };
  });
}
