/**
 * Facts for the stock-detail trend chart: what a reader should see at a glance.
 * Input bars are daily, oldest first. `window` bars are charted; earlier bars
 * only feed the moving average.
 */
export interface TrendBar { date: string; close: number; volume?: number | null }

export interface TrendExtreme { value: number; date: string; index: number }

export interface TrendInsights {
  /** Charted bars (the last `window`), oldest first. */
  bars: TrendBar[];
  /** Change from the first to the last charted close, in percent. */
  changePct: number | null;
  high: TrendExtreme | null;
  low: TrendExtreme | null;
  /** Where the last close sits between the window low (0) and high (100). */
  rangePositionPct: number | null;
  /** Largest absolute one-day move inside the window. */
  biggestMove: { pct: number; date: string; index: number } | null;
  /** Simple moving average aligned with `bars` (null until enough history). */
  ma: (number | null)[];
  /** Volume of each charted bar relative to the window median (1 = median); null without volume. */
  volumeRatio: (number | null)[] | null;
}

const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

export function trendInsights(all: readonly TrendBar[], window = 30, maPeriod = 20): TrendInsights {
  const clean = all.filter((b) => b && typeof b.date === 'string' && finite(b.close));
  const start = Math.max(0, clean.length - window);
  const bars = clean.slice(start);
  const empty: TrendInsights = { bars, changePct: null, high: null, low: null, rangePositionPct: null, biggestMove: null, ma: bars.map(() => null), volumeRatio: null };
  if (bars.length < 2) return empty;

  const first = bars[0].close;
  const last = bars[bars.length - 1].close;
  let high: TrendExtreme = { value: bars[0].close, date: bars[0].date, index: 0 };
  let low: TrendExtreme = { ...high };
  bars.forEach((b, i) => {
    if (b.close > high.value) high = { value: b.close, date: b.date, index: i };
    if (b.close < low.value) low = { value: b.close, date: b.date, index: i };
  });

  let biggestMove: TrendInsights['biggestMove'] = null;
  for (let i = 0; i < bars.length; i += 1) {
    const prev = i === 0 ? clean[start - 1]?.close : bars[i - 1].close;
    if (!finite(prev) || prev === 0) continue;
    const pct = (bars[i].close / prev - 1) * 100;
    if (!biggestMove || Math.abs(pct) > Math.abs(biggestMove.pct)) biggestMove = { pct, date: bars[i].date, index: i };
  }

  const ma = bars.map((_, i) => {
    const end = start + i;
    if (end + 1 < maPeriod) return null;
    let sum = 0;
    for (let k = end - maPeriod + 1; k <= end; k += 1) sum += clean[k].close;
    return sum / maPeriod;
  });

  const volumes = bars.map((b) => (finite(b.volume) && b.volume > 0 ? b.volume : null));
  const known = volumes.filter((v): v is number => v !== null).sort((a, b) => a - b);
  let volumeRatio: (number | null)[] | null = null;
  if (known.length >= Math.min(10, bars.length)) {
    const mid = Math.floor(known.length / 2);
    const median = known.length % 2 ? known[mid] : (known[mid - 1] + known[mid]) / 2;
    volumeRatio = median > 0 ? volumes.map((v) => (v === null ? null : v / median)) : null;
  }

  return {
    bars,
    changePct: first !== 0 ? (last / first - 1) * 100 : null,
    high,
    low,
    rangePositionPct: high.value > low.value ? Math.round(((last - low.value) / (high.value - low.value)) * 100) : null,
    biggestMove,
    ma,
    volumeRatio,
  };
}
