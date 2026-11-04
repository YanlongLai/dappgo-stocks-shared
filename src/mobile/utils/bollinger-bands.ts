/**
 * Compute rolling Bollinger Bands (20-period, 2-sigma) over a price series.
 *
 * Returns three series aligned to input length; leading entries are null
 * until the rolling window is full. Pure function — no React or theme
 * dependency, easy to unit test.
 *
 * Formula:
 *   middle = SMA(close, period)
 *   stddev = sqrt(mean((x - middle)^2))
 *   upper  = middle + multiplier × stddev
 *   lower  = middle - multiplier × stddev
 *
 * Defaults match the standard finance convention (period=20, mult=2).
 */
export interface BollingerSeries {
  upper: (number | null)[];
  middle: (number | null)[];
  lower: (number | null)[];
}

export function computeBollinger(
  closes: number[],
  period = 20,
  multiplier = 2,
): BollingerSeries {
  const n = closes.length;
  const upper: (number | null)[] = new Array(n).fill(null);
  const middle: (number | null)[] = new Array(n).fill(null);
  const lower: (number | null)[] = new Array(n).fill(null);

  if (period <= 0 || n === 0) return { upper, middle, lower };

  for (let i = period - 1; i < n; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += closes[j];
    const mean = sum / period;

    let sqSum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const diff = closes[j] - mean;
      sqSum += diff * diff;
    }
    const sd = Math.sqrt(sqSum / period);

    middle[i] = mean;
    upper[i] = mean + multiplier * sd;
    lower[i] = mean - multiplier * sd;
  }
  return { upper, middle, lower };
}
