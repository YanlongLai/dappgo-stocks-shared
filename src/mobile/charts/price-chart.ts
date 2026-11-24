/**
 * Pure model for the shared price chart (`ui/charts/PriceChart`).
 *
 * Used by every DappGo stock app. No React Native imports, so the rules the
 * chart draws by (frames, MA availability, coverage, paths, ticks) are unit
 * tested here once instead of per app.
 */

import { computeMA } from '../utils/compute-ma';
import { computeBollinger } from '../utils/bollinger-bands';

export type ChartMode = 'line' | 'candle' | 'area';

export const CHART_MODES: readonly ChartMode[] = ['line', 'candle', 'area'];

/** One daily bar. `open/high/low/volume` may be missing on compressed history. */
export interface ChartBarInput {
  date: string;
  close: number;
  open?: number | null;
  high?: number | null;
  low?: number | null;
  volume?: number | null;
}

export interface ChartBar {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/** A time-range button: `bars` is how many daily bars the range asks for. */
export interface ChartFrame {
  key: string;
  label: string;
  bars: number;
}

export type MaKey = 'ma20' | 'ma60' | 'ma200';

export interface MaSpec {
  key: MaKey;
  label: string;
  window: number;
  color: string;
  strokeWidth: number;
}

export const MA_SPECS: readonly MaSpec[] = [
  { key: 'ma20', label: 'MA20', window: 20, color: '#3b82f6', strokeWidth: 1 },
  { key: 'ma60', label: 'MA60', window: 60, color: '#f97316', strokeWidth: 1 },
  { key: 'ma200', label: 'MA200', window: 200, color: '#a855f7', strokeWidth: 1.5 },
];

export type MovingAverages = Partial<Record<MaKey, (number | null)[]>>;
export type ShowMA = Partial<Record<MaKey, boolean>>;

/** Normalise raw bars: finite closes only, oldest first, one bar per day. */
export function normalizeBars(raw: readonly ChartBarInput[] | null | undefined): ChartBar[] {
  const byDate = new Map<string, ChartBar>();
  for (const b of raw ?? []) {
    if (!b || typeof b.date !== 'string' || !b.date) continue;
    if (typeof b.close !== 'number' || !Number.isFinite(b.close)) continue;
    const num = (v: number | null | undefined) => (typeof v === 'number' && Number.isFinite(v) ? v : b.close);
    byDate.set(b.date.slice(0, 10), {
      time: b.date.slice(0, 10),
      open: num(b.open),
      high: num(b.high),
      low: num(b.low),
      close: b.close,
      volume: typeof b.volume === 'number' && Number.isFinite(b.volume) ? b.volume : 0,
    });
  }
  return [...byDate.values()].sort((a, b) => a.time.localeCompare(b.time));
}

/** A bar stored without wicks (o=h=l=c) is drawn as a thin tick in candle mode. */
export function isCompressedBar(bar: Pick<ChartBar, 'open' | 'high' | 'low' | 'close'>): boolean {
  return bar.open === bar.close && bar.high === bar.low;
}

/**
 * State of each range button against the history on hand:
 * - `full`: enough bars for the range;
 * - `partial`: the range asks for more than exists — still selectable, it
 *   shows everything there is and the chart explains the real coverage;
 * - `unavailable`: fewer than two bars, nothing to draw.
 * Only the first range past the data is `partial`; longer ones would show the
 * same bars, so they are `unavailable` and say so when tapped.
 */
export type FrameState = 'full' | 'partial' | 'unavailable';

export function frameStates(frames: readonly ChartFrame[], barCount: number): Record<string, FrameState> {
  const out: Record<string, FrameState> = {};
  let partialUsed = false;
  for (const f of [...frames].sort((a, b) => a.bars - b.bars)) {
    if (barCount < 2) out[f.key] = 'unavailable';
    else if (barCount >= f.bars) out[f.key] = 'full';
    else if (!partialUsed) { out[f.key] = 'partial'; partialUsed = true; }
    else out[f.key] = 'unavailable';
  }
  return out;
}

/** Index the selected range starts at in the full history. */
export function frameSliceFrom(barCount: number, frame: ChartFrame): number {
  return Math.max(0, barCount - frame.bars);
}

/** Calendar days covered from the first to the last bar (inclusive). */
export function coverageDays(bars: readonly Pick<ChartBar, 'time'>[]): number {
  if (bars.length === 0) return 0;
  const first = Date.parse(`${bars[0].time.slice(0, 10)}T00:00:00Z`);
  const last = Date.parse(`${bars[bars.length - 1].time.slice(0, 10)}T00:00:00Z`);
  if (!Number.isFinite(first) || !Number.isFinite(last)) return bars.length;
  return Math.round((last - first) / 86_400_000) + 1;
}

/**
 * Daily MA series over the FULL history. A caller-provided series (e.g. the
 * report's own daily MA) wins when it is aligned to the bars; otherwise it is
 * computed from closes.
 */
export function fullMaSeries(bars: readonly ChartBar[], provided?: MovingAverages): Record<MaKey, (number | null)[]> {
  const pick = (spec: MaSpec) => {
    const p = provided?.[spec.key];
    return p && p.length === bars.length ? p : computeMA(bars as ChartBar[], spec.window);
  };
  return { ma20: pick(MA_SPECS[0]), ma60: pick(MA_SPECS[1]), ma200: pick(MA_SPECS[2]) };
}

/**
 * An MA counts as drawable on the visible range only when it is a real line:
 * at least 5 values and at least a fifth of the visible bars. A 3-point stub at
 * the right edge (MA60 on ~62 bars of history) reads as "nothing drawn", so the
 * chip is dimmed and explains why instead.
 */
export const MA_MIN_POINTS = 5;
export const MA_MIN_SHARE = 0.2;

export function maAvailable(visible: readonly (number | null)[]): boolean {
  let n = 0;
  for (const v of visible) if (v != null && Number.isFinite(v)) n += 1;
  return n >= Math.max(MA_MIN_POINTS, Math.ceil(visible.length * MA_MIN_SHARE));
}

export function bollingerSeries(bars: readonly ChartBar[]) {
  return computeBollinger(bars.map((b) => b.close), 20, 2);
}

/** Default mode per range: short ranges candle, long ranges area, 1M line. */
export function defaultModeForFrame(key: string): ChartMode {
  if (key === '6M' || key === '1Y' || key === '3Y') return 'area';
  if (key === '1M') return 'line';
  return 'candle';
}

/**
 * Which layers a mode draws. Line mode is the line only — no fill of any kind;
 * area keeps its gradient; candle draws bodies, wicks and volume.
 */
export function modeLayers(mode: ChartMode): { line: boolean; fill: boolean; candles: boolean; volume: boolean } {
  if (mode === 'candle') return { line: false, fill: false, candles: true, volume: true };
  if (mode === 'area') return { line: true, fill: true, candles: false, volume: false };
  return { line: true, fill: false, candles: false, volume: false };
}

/** Catmull-Rom spline through the points, as an SVG path. */
export function smoothPath(points: readonly { x: number; y: number }[], tension = 0.3): string {
  if (points.length < 2) return '';
  if (points.length === 2) return `M${points[0].x},${points[0].y} L${points[1].x},${points[1].y}`;
  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const cp1x = p1.x + ((p2.x - p0.x) * tension) / 3;
    const cp1y = p1.y + ((p2.y - p0.y) * tension) / 3;
    const cp2x = p2.x - ((p3.x - p1.x) * tension) / 3;
    const cp2y = p2.y - ((p3.y - p1.y) * tension) / 3;
    d += ` C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
}

/** Closed area under a line path down to `bottom`. */
export function areaPath(linePath: string, points: readonly { x: number }[], bottom: number): string {
  if (!linePath || points.length < 2) return '';
  return `${linePath} L${points[points.length - 1].x},${bottom} L${points[0].x},${bottom} Z`;
}

/** Price domain for the visible bars, active overlays included, padded 4%. */
export function priceDomain(
  bars: readonly ChartBar[],
  mode: ChartMode,
  overlays: readonly (readonly (number | null)[])[] = [],
): { min: number; max: number } {
  let min = Infinity;
  let max = -Infinity;
  for (const b of bars) {
    const lo = mode === 'candle' ? b.low : b.close;
    const hi = mode === 'candle' ? b.high : b.close;
    if (lo < min) min = lo;
    if (hi > max) max = hi;
  }
  for (const s of overlays) for (const v of s) {
    if (v == null || !Number.isFinite(v)) continue;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) return { min: 0, max: 1 };
  const range = max - min || Math.abs(max) * 0.02 || 1;
  return { min: min - range * 0.04, max: max + range * 0.04 };
}

/** Evenly spaced price ticks (count+1 values) with their y positions. */
export function priceTicks(min: number, max: number, areaHeight: number, top: number, count = 4): { price: number; y: number }[] {
  const range = max - min || 1;
  const out: { price: number; y: number }[] = [];
  for (let i = 0; i <= count; i++) {
    const price = min + (range * i) / count;
    out.push({ price, y: top + areaHeight - ((price - min) / range) * areaHeight });
  }
  return out;
}

/** Up to `count` evenly spaced indexes for date labels. */
export function dateTickIndexes(length: number, count = 4): number[] {
  if (length <= 0) return [];
  const n = Math.min(count, length);
  if (n === 1) return [0];
  return Array.from({ length: n }, (_, i) => Math.round((i / (n - 1)) * (length - 1)));
}

/** Change over the visible range, in percent. */
export function periodChangePct(bars: readonly ChartBar[]): number {
  if (bars.length < 2 || bars[0].close === 0) return 0;
  return ((bars[bars.length - 1].close - bars[0].close) / Math.abs(bars[0].close)) * 100;
}
