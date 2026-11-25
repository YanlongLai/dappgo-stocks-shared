/**
 * PriceChart — the one daily price chart every DappGo stock app renders.
 *
 * Modes: line (the line only, no fill), area (line + gradient), candle
 * (bodies, wicks, volume). Range buttons, optional MA20/60/200 and Bollinger
 * overlays, and a drag crosshair.
 *
 * When history is short the chart says so instead of drawing nothing:
 * - an MA that cannot be drawn on the visible range shows a dimmed chip; a tap
 *   shows a light toast ("not enough history to draw MA60");
 * - the first range longer than the history is selectable and shows every bar
 *   there is with the real coverage underneath; longer ranges are dimmed and a
 *   tap explains the coverage in the toast.
 *
 * The app supplies theme colours, copy, number/date formatting and its own
 * chip component, so the chart looks native in each app without app imports.
 */

import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { FloatingSlotContext } from '../scroll/FloatingSlotContext';
import { Animated, PanResponder, StyleSheet, Text, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Polyline, Rect, Stop, Text as SvgText } from 'react-native-svg';
import {
  CHART_MODES,
  MA_SPECS,
  areaPath,
  bollingerSeries,
  coverageDays,
  dateTickIndexes,
  defaultModeForFrame,
  frameSliceFrom,
  frameStates,
  fullMaSeries,
  isCompressedBar,
  maAvailable,
  modeLayers,
  normalizeBars,
  periodChangePct,
  priceDomain,
  nicePriceTicks,
  smoothPath,
  type ChartBarInput,
  type ChartFrame,
  type ChartMode,
  type MaKey,
  type MovingAverages,
  type ShowMA,
} from '../../mobile/charts/price-chart';

export type { ChartBarInput, ChartFrame, ChartMode, MovingAverages, ShowMA } from '../../mobile/charts/price-chart';

export interface PriceChartTheme {
  card: string;
  border: string;
  backgroundAlt: string;
  textMuted: string;
  textHeading: string;
  gold: string;
  positive: string;
  negative: string;
  isDark: boolean;
}

export interface PriceChartChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Drawn faded but still tappable — the tap explains why. */
  dimmed?: boolean;
  fill?: boolean;
  icon?: string;
  iconColor?: string;
  accessibilityRole?: 'button' | 'tab';
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

export interface PriceChartLabels {
  /** Accessible names of the three modes. */
  mode: Record<ChartMode, string>;
  /** Accessible name of a range button, e.g. "Time range 3M". */
  frameA11y: (frameLabel: string) => string;
  /** Under the chart when the range is longer than the history. */
  partialHint: (days: number, frameLabel: string) => string;
  /** Toast for a range with nothing more to show. */
  frameUnavailable: (days: number, frameLabel: string) => string;
  /** Toast for an MA that cannot be drawn, e.g. "Not enough history to draw MA60". */
  maUnavailable: (maLabel: string) => string;
  bollingerLegend: string;
  empty: string;
  volume: string;
}

export interface PriceChartProps {
  bars: readonly ChartBarInput[] | null | undefined;
  frames: readonly ChartFrame[];
  initialFrame?: string;
  /** Fixed starting mode; otherwise each range picks its default. */
  initialMode?: ChartMode;
  width: number;
  height?: number;
  /** Daily MA series aligned to `bars`; preferred over computing from closes. */
  movingAverages?: MovingAverages;
  showMA?: ShowMA;
  /** Show the MA chips. Default true. */
  maToggles?: boolean;
  /** Draw the Bollinger envelope. Default true. */
  bollinger?: boolean;
  theme: PriceChartTheme;
  labels: PriceChartLabels;
  Chip: React.ComponentType<PriceChartChipProps>;
  formatPrice: (value: number) => string;
  formatAxisPrice?: (value: number) => string;
  formatDateTick: (isoDate: string, frameKey: string) => string;
  formatPct: (value: number) => string;
  formatVolume?: (value: number) => string;
  scaleFont?: (size: number) => number;
  onHaptic?: () => void;
  reduceMotion?: boolean;
  /** Long history still loading: only the chart area shows a skeleton. */
  loading?: boolean;
  testID?: string;
}

const PAD = { top: 12, right: 52, bottom: 26, left: 6 };
const VOLUME_RATIO = 0.18;
const MODE_ICONS: Record<ChartMode, string> = { line: '〜', candle: '▮', area: '◿' };
const TOAST_MS = 2200;

const id = (n: number) => n;

export const PriceChart = React.memo(function PriceChart({
  bars: rawBars,
  frames,
  initialFrame,
  initialMode,
  width,
  height = 220,
  movingAverages,
  showMA,
  maToggles = true,
  bollinger = true,
  theme,
  labels,
  Chip,
  formatPrice,
  formatAxisPrice,
  formatDateTick,
  formatPct,
  formatVolume,
  scaleFont = id,
  onHaptic,
  reduceMotion = false,
  loading = false,
  testID = 'price-chart',
}: PriceChartProps) {
  const all = useMemo(() => normalizeBars(rawBars), [rawBars]);
  const states = useMemo(() => frameStates(frames, all.length), [frames, all.length]);

  const startFrame = useMemo(() => {
    const wanted = frames.find((f) => f.key === initialFrame);
    if (wanted && states[wanted.key] !== 'unavailable') return wanted.key;
    const firstOk = frames.find((f) => states[f.key] !== 'unavailable');
    return (firstOk ?? frames[0])?.key ?? '';
  }, [frames, initialFrame, states]);

  const [frameKey, setFrameKey] = useState(startFrame);
  const [userMode, setUserMode] = useState<ChartMode | null>(initialMode ?? null);
  const [activeMA, setActiveMA] = useState<ShowMA>({ ma20: !!showMA?.ma20, ma60: !!showMA?.ma60, ma200: !!showMA?.ma200 });
  const [touchX, setTouchX] = useState<number | null>(null);
  const [measured, setMeasured] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => { if (states[frameKey] === 'unavailable' || !frames.some((f) => f.key === frameKey)) setFrameKey(startFrame); }, [states, frameKey, frames, startFrame]);

  const frame = frames.find((f) => f.key === frameKey) ?? frames[0];
  const mode: ChartMode = userMode ?? defaultModeForFrame(frame?.key ?? '');
  const layers = modeLayers(mode);
  const chartWidth = Math.max(1, measured || width);

  const sliceFrom = frame ? frameSliceFrom(all.length, frame) : 0;
  const bars = useMemo(() => all.slice(sliceFrom), [all, sliceFrom]);
  const fullMa = useMemo(() => fullMaSeries(all, movingAverages), [all, movingAverages]);
  const ma = useMemo(() => ({
    ma20: fullMa.ma20.slice(sliceFrom),
    ma60: fullMa.ma60.slice(sliceFrom),
    ma200: fullMa.ma200.slice(sliceFrom),
  }), [fullMa, sliceFrom]);
  const maOk = useMemo(() => ({ ma20: maAvailable(ma.ma20), ma60: maAvailable(ma.ma60), ma200: maAvailable(ma.ma200) }), [ma]);
  const bb = useMemo(() => {
    if (!bollinger) return null;
    const full = bollingerSeries(all);
    const s = { upper: full.upper.slice(sliceFrom), middle: full.middle.slice(sliceFrom), lower: full.lower.slice(sliceFrom) };
    return s.upper.some((v) => v != null) ? s : null;
  }, [all, sliceFrom, bollinger]);

  // ── Toast ──
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback((text: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(text);
    toastOpacity.setValue(1);
    toastTimer.current = setTimeout(() => {
      if (reduceMotion) { toastOpacity.setValue(0); setToast(null); return; }
      Animated.timing(toastOpacity, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => setToast(null));
    }, TOAST_MS);
  }, [toastOpacity, reduceMotion]);
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  // ── Fade on range / mode change ──
  const fade = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (reduceMotion) { fade.setValue(1); return; }
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  }, [frameKey, mode, fade, reduceMotion]);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) setMeasured(w);
  }, []);
  useEffect(() => { setMeasured(0); setTouchX(null); }, [width]);

  // ── Geometry ──
  const plotW = Math.max(1, chartWidth - PAD.left - PAD.right);
  const plotH = Math.max(1, height - PAD.top - PAD.bottom);
  const volH = plotH * VOLUME_RATIO;
  const areaH = layers.volume ? plotH - volH - 6 : plotH;

  const overlays = useMemo(() => {
    const list: (number | null)[][] = [];
    if (bb) list.push(bb.upper, bb.lower);
    for (const spec of MA_SPECS) if (activeMA[spec.key] && maOk[spec.key]) list.push(ma[spec.key]);
    return list;
  }, [bb, activeMA, maOk, ma]);
  const dom = useMemo(() => priceDomain(bars, mode, overlays), [bars, mode, overlays]);
  const range = dom.max - dom.min || 1;
  const yAt = useCallback((p: number) => PAD.top + areaH - ((p - dom.min) / range) * areaH, [areaH, dom.min, range]);
  // Candles get half a slot of room at each end so the first and last bodies are not clipped.
  const edge = layers.candles ? Math.min(16, plotW / (Math.max(1, bars.length) * 2)) : 0;
  const xAt = useCallback((i: number, n: number) => PAD.left + edge + (i / Math.max(1, n - 1)) * (plotW - edge * 2), [plotW, edge]);

  const points = useMemo(() => bars.map((b, i) => ({ x: xAt(i, bars.length), y: yAt(b.close) })), [bars, xAt, yAt]);
  const linePath = useMemo(() => smoothPath(points), [points]);
  const fillPath = useMemo(() => (layers.fill ? areaPath(linePath, points, PAD.top + areaH) : ''), [layers.fill, linePath, points, areaH]);
  const ticks = useMemo(() => nicePriceTicks(dom.min, dom.max, areaH, PAD.top, 4), [dom, areaH]);
  const dateIdx = useMemo(() => dateTickIndexes(bars.length, 4), [bars.length]);
  const maxVol = useMemo(() => Math.max(1, ...bars.map((b) => b.volume)), [bars]);

  const changePct = periodChangePct(bars);
  const lineColor = changePct >= 0 ? theme.positive : theme.negative;
  const gradId = `${testID}-grad`;

  // ── Crosshair ── (the floating 「↑」 steps aside while a finger is on the chart)
  const floating = useContext(FloatingSlotContext);
  // The whole chart card (chips, plot, ranges, MA row) is off limits for the floating 「↑」.
  const cardRef = useRef<View | null>(null);
  useEffect(() => {
    if (!floating) return undefined;
    floating.avoid(testID, cardRef.current);
    return () => floating.avoid(testID, null);
  }, [floating, testID]);
  const raf = useRef<number | null>(null);
  const setTouchThrottled = useCallback((x: number) => {
    if (raf.current != null) return;
    raf.current = requestAnimationFrame(() => { raf.current = null; setTouchX(x); });
  }, []);
  const cancelPending = useCallback(() => {
    if (raf.current != null) { cancelAnimationFrame(raf.current); raf.current = null; }
  }, []);
  useEffect(() => cancelPending, [cancelPending]);
  const pan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > Math.abs(g.dy),
    onPanResponderGrant: (e: GestureResponderEvent) => { floating?.suppress(true); setTouchX(e.nativeEvent.locationX); },
    onPanResponderMove: (e: GestureResponderEvent) => setTouchThrottled(e.nativeEvent.locationX),
    // A move queued for the next frame must not bring the crosshair back after the
    // finger lifts or the page scroll takes the gesture over.
    onPanResponderRelease: () => { cancelPending(); floating?.suppress(false); setTouchX(null); },
    onPanResponderTerminate: () => { cancelPending(); floating?.suppress(false); setTouchX(null); },
  }), [setTouchThrottled, cancelPending, floating]);
  const cross = useMemo(() => {
    if (touchX == null || bars.length < 2) return null;
    const idx = Math.max(0, Math.min(bars.length - 1, Math.round(((touchX - PAD.left) / plotW) * (bars.length - 1))));
    const b = bars[idx];
    const prev = idx > 0 ? bars[idx - 1].close : undefined;
    return { x: xAt(idx, bars.length), y: yAt(b.close), bar: b, pct: prev ? ((b.close - prev) / prev) * 100 : null };
  }, [touchX, bars, plotW, xAt, yAt]);

  // ── Handlers ──
  const pickFrame = useCallback((f: ChartFrame) => {
    onHaptic?.();
    if (states[f.key] === 'unavailable') { showToast(labels.frameUnavailable(coverageDays(all), f.label)); return; }
    setFrameKey(f.key);
    setUserMode(initialMode ?? null);
    setTouchX(null);
  }, [states, showToast, labels, all, initialMode, onHaptic]);

  const toggleMA = useCallback((key: MaKey, label: string) => {
    onHaptic?.();
    if (!maOk[key]) { showToast(labels.maUnavailable(label)); return; }
    setActiveMA((s) => ({ ...s, [key]: !s[key] }));
  }, [maOk, showToast, labels, onHaptic]);

  if (loading) return <ChartSkeleton height={height} theme={theme} reduceMotion={reduceMotion} testID={`${testID}-skeleton`} />;

  if (all.length < 2 || !frame) {
    return (
      <View testID={testID} style={[styles.empty, { backgroundColor: theme.backgroundAlt, height }]}>
        <Text style={[styles.emptyText, { color: theme.textMuted, fontSize: scaleFont(12) }]}>{labels.empty}</Text>
      </View>
    );
  }

  const partial = states[frame.key] === 'partial';
  const axisPrice = formatAxisPrice ?? formatPrice;

  return (
    <View ref={(n) => { cardRef.current = n; floating?.avoid(testID, n); }} testID={testID} style={[styles.container, { backgroundColor: theme.card }]}>
      <View style={styles.header}>
        <Text testID={`${testID}-change`} style={[styles.change, { color: lineColor, fontSize: scaleFont(12) }]}>
          {`${formatPct(changePct)} (${frame.label})`}
        </Text>
        <View style={styles.modeRow}>
          {CHART_MODES.map((m) => (
            <Chip
              key={m}
              label={MODE_ICONS[m]}
              selected={mode === m}
              onPress={() => { onHaptic?.(); setUserMode(m); }}
              accessibilityLabel={labels.mode[m]}
              testID={`${testID}-mode-${m}`}
            />
          ))}
        </View>
      </View>

      <Animated.View style={{ opacity: fade }} onLayout={onLayout} {...pan.panHandlers}>
        <Svg width={chartWidth} height={height} testID={`${testID}-svg`}>
          <Defs>
            <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={lineColor} stopOpacity="0.40" />
              <Stop offset="0.65" stopColor={lineColor} stopOpacity="0.10" />
              <Stop offset="1" stopColor={lineColor} stopOpacity="0" />
            </LinearGradient>
          </Defs>

          {bb && (
            <G testID={`${testID}-bollinger`}>
              <Polyline points={bandPoints(bb.upper, bb.lower, xAt, yAt)} fill={theme.isDark ? 'rgba(245,158,11,0.10)' : 'rgba(245,158,11,0.08)'} stroke="none" />
              <Polyline points={seriesPoints(bb.upper, xAt, yAt)} fill="none" stroke={`${theme.gold}55`} strokeWidth={0.8} />
              <Polyline points={seriesPoints(bb.lower, xAt, yAt)} fill="none" stroke={`${theme.gold}55`} strokeWidth={0.8} />
              <Polyline points={seriesPoints(bb.middle, xAt, yAt)} fill="none" stroke={`${theme.gold}88`} strokeWidth={1} strokeDasharray="4 4" />
            </G>
          )}

          {ticks.map((tk, i) => (
            <G key={`grid-${i}`}>
              <Line x1={PAD.left} y1={tk.y} x2={chartWidth - PAD.right} y2={tk.y} stroke={theme.border} strokeWidth={0.5} strokeOpacity={0.5} strokeDasharray="4,5" />
              <SvgText x={chartWidth - PAD.right + 4} y={tk.y + 4} fill={theme.textMuted} fontSize={scaleFont(9.5)}>{axisPrice(tk.price)}</SvgText>
            </G>
          ))}

          {dateIdx.map((idx, i) => (
            <SvgText
              key={`date-${i}`}
              x={xAt(idx, bars.length)}
              y={height - 4}
              fill={theme.textMuted}
              fontSize={scaleFont(9)}
              textAnchor={i === 0 ? 'start' : i === dateIdx.length - 1 ? 'end' : 'middle'}
            >
              {formatDateTick(bars[idx].time, frame.key)}
            </SvgText>
          ))}


          {layers.volume && bars.map((b, i) => {
            const w = Math.max(2, (plotW / bars.length) * 0.65);
            const h = (b.volume / maxVol) * volH;
            return (
              <Rect
                key={`vol-${i}`}
                x={xAt(i, bars.length) - w / 2}
                y={PAD.top + areaH + 6 + (volH - h)}
                width={w}
                height={Math.max(1, h)}
                fill={b.close >= b.open ? theme.positive : theme.negative}
                opacity={0.3}
                rx={1}
              />
            );
          })}

          {layers.candles && bars.map((b, i) => {
            const w = Math.max(3, (plotW / bars.length) * 0.55);
            const cx = xAt(i, bars.length);
            const color = b.close >= b.open ? theme.positive : theme.negative;
            if (isCompressedBar(b)) {
              const cy = yAt(b.close);
              return <Line key={`c-${i}`} x1={cx - w / 2} y1={cy} x2={cx + w / 2} y2={cy} stroke={color} strokeWidth={1.5} />;
            }
            const top = yAt(Math.max(b.open, b.close));
            const bottom = yAt(Math.min(b.open, b.close));
            return (
              <G key={`c-${i}`} testID={i === 0 ? `${testID}-candles` : undefined}>
                <Line x1={cx} y1={yAt(b.high)} x2={cx} y2={yAt(b.low)} stroke={color} strokeWidth={1} />
                <Rect x={cx - w / 2} y={top} width={w} height={Math.max(1, bottom - top)} fill={color} rx={1} />
              </G>
            );
          })}

          {layers.fill && fillPath ? <Path testID={`${testID}-fill`} d={fillPath} fill={`url(#${gradId})`} /> : null}
          {layers.line && linePath ? (
            <Path
              testID={`${testID}-line`}
              d={linePath}
              fill="none"
              stroke={lineColor}
              strokeWidth={mode === 'area' ? 1.5 : 2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ) : null}

          {/* MA lines on top of the Bollinger band and the price line, so an active MA is always visible. */}
          {MA_SPECS.map((spec) => {
            if (!activeMA[spec.key] || !maOk[spec.key]) return null;
            return (
              <Polyline
                key={spec.key}
                testID={`${testID}-ma-line-${spec.key}`}
                points={seriesPoints(ma[spec.key], xAt, yAt)}
                fill="none"
                stroke={spec.color}
                strokeWidth={Math.max(1.5, spec.strokeWidth)}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            );
          })}
          {cross && (
            <G>
              <Line x1={cross.x} y1={PAD.top} x2={cross.x} y2={PAD.top + areaH} stroke={theme.textMuted} strokeWidth={0.8} strokeDasharray="3,3" />
              <Line x1={PAD.left} y1={cross.y} x2={chartWidth - PAD.right} y2={cross.y} stroke={theme.textMuted} strokeWidth={0.5} strokeDasharray="3,3" />
              <Circle cx={cross.x} cy={cross.y} r={5} fill={lineColor} stroke="#ffffff" strokeWidth={2} />
            </G>
          )}
        </Svg>

        {cross && (
          <View pointerEvents="none" style={[styles.tooltip, { backgroundColor: theme.backgroundAlt, borderColor: theme.border }]}>
            <Text style={[styles.tipPrice, { color: theme.textHeading, fontSize: scaleFont(14) }]}>{formatPrice(cross.bar.close)}</Text>
            {cross.pct != null && (
              <Text style={[styles.tipPct, { color: cross.pct >= 0 ? theme.positive : theme.negative, fontSize: scaleFont(11) }]}>{formatPct(cross.pct)}</Text>
            )}
            <Text style={[styles.tipMeta, { color: theme.textMuted, fontSize: scaleFont(11) }]}>{cross.bar.time}</Text>
            {formatVolume && cross.bar.volume > 0 && (
              <Text style={[styles.tipMeta, { color: theme.textMuted, fontSize: scaleFont(11) }]}>{`${labels.volume} ${formatVolume(cross.bar.volume)}`}</Text>
            )}
          </View>
        )}

        {toast && (
          <Animated.View
            testID={`${testID}-toast`}
            pointerEvents="none"
            accessibilityLiveRegion="polite"
            style={[styles.toast, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.92)' : 'rgba(20,20,24,0.88)', opacity: toastOpacity }]}
          >
            <Text style={[styles.toastText, { color: theme.isDark ? '#111' : '#fff', fontSize: scaleFont(12) }]}>{toast}</Text>
          </Animated.View>
        )}
      </Animated.View>

      {partial && (
        <View style={[styles.hint, { borderColor: theme.border }]}>
          <Text testID={`${testID}-partial-hint`} style={[styles.hintText, { color: theme.textMuted, fontSize: scaleFont(11) }]}>
            {labels.partialHint(coverageDays(bars), frame.label)}
          </Text>
        </View>
      )}

      <View style={styles.frameRow}>
        {frames.map((f) => (
          <Chip
            key={f.key}
            label={f.label}
            selected={f.key === frame.key}
            dimmed={states[f.key] !== 'full' && f.key !== frame.key}
            fill
            onPress={() => pickFrame(f)}
            accessibilityRole="tab"
            accessibilityLabel={labels.frameA11y(f.label)}
            accessibilityHint={states[f.key] === 'unavailable' ? labels.frameUnavailable(coverageDays(all), f.label) : undefined}
            testID={`${testID}-frame-${f.key}`}
          />
        ))}
      </View>

      {maToggles && (
        <View style={styles.maRow}>
          {MA_SPECS.map((spec) => (
            <Chip
              key={spec.key}
              label={spec.label}
              // Off: hollow grey dot. On: filled in the line's colour (the chip itself is highlighted too).
              icon={activeMA[spec.key] && maOk[spec.key] ? 'ellipse' : 'ellipse-outline'}
              iconColor={activeMA[spec.key] && maOk[spec.key] ? spec.color : theme.textMuted}
              selected={!!activeMA[spec.key] && maOk[spec.key]}
              dimmed={!maOk[spec.key]}
              onPress={() => toggleMA(spec.key, spec.label)}
              accessibilityHint={maOk[spec.key] ? undefined : labels.maUnavailable(spec.label)}
              testID={`${testID}-ma-${spec.key}`}
            />
          ))}
        </View>
      )}

      {bb && (
        <Text style={[styles.legend, { color: theme.textMuted, fontSize: scaleFont(10) }]}>{labels.bollingerLegend}</Text>
      )}
    </View>
  );
});

function seriesPoints(series: readonly (number | null)[], xAt: (i: number, n: number) => number, yAt: (v: number) => number): string {
  const pts: string[] = [];
  for (let i = 0; i < series.length; i++) {
    const v = series[i];
    if (v == null || !Number.isFinite(v)) continue;
    pts.push(`${xAt(i, series.length)},${yAt(v)}`);
  }
  return pts.join(' ');
}

function bandPoints(upper: readonly (number | null)[], lower: readonly (number | null)[], xAt: (i: number, n: number) => number, yAt: (v: number) => number): string {
  const up: string[] = [];
  const down: string[] = [];
  for (let i = 0; i < upper.length; i++) {
    const u = upper[i];
    const l = lower[i];
    if (u == null || l == null || !Number.isFinite(u) || !Number.isFinite(l)) continue;
    up.push(`${xAt(i, upper.length)},${yAt(u)}`);
    down.unshift(`${xAt(i, lower.length)},${yAt(l)}`);
  }
  return up.length > 1 ? `${up.join(' ')} ${down.join(' ')}` : '';
}

/** Same footprint as the chart (header, plot, ranges, MA row), gently pulsing. */
function ChartSkeleton({ height, theme, reduceMotion, testID }: { height: number; theme: PriceChartTheme; reduceMotion: boolean; testID: string }) {
  const pulse = useRef(new Animated.Value(0.55)).current;
  useEffect(() => {
    if (reduceMotion) return undefined;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 0.9, duration: 700, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0.55, duration: 700, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [pulse, reduceMotion]);
  const block = { backgroundColor: theme.backgroundAlt, borderRadius: 8 };
  return (
    <Animated.View testID={testID} accessibilityRole="progressbar" style={[styles.container, { backgroundColor: theme.card, opacity: pulse, gap: 10 }]}>
      <View style={[block, { height: 28, width: '45%' }]} />
      <View style={[block, { height }]} />
      <View style={[block, { height: 36 }]} />
      <View style={[block, { height: 36, width: '70%' }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden', paddingBottom: 4 },
  empty: { borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  emptyText: {},
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 4, gap: 8 },
  change: { fontWeight: '700', fontVariant: ['tabular-nums'], flexShrink: 1 },
  modeRow: { flexDirection: 'row', gap: 4 },
  tooltip: {
    position: 'absolute', top: 4, left: 8, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap',
    gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, maxWidth: 240,
  },
  tipPrice: { fontWeight: '700', fontVariant: ['tabular-nums'] },
  tipPct: { fontWeight: '600', fontVariant: ['tabular-nums'] },
  tipMeta: { fontVariant: ['tabular-nums'] },
  toast: { position: 'absolute', top: 8, alignSelf: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, maxWidth: '90%' },
  toastText: { fontWeight: '500', textAlign: 'center' },
  hint: { alignItems: 'center', paddingVertical: 3, borderTopWidth: StyleSheet.hairlineWidth },
  hintText: { textAlign: 'center' },
  frameRow: { flexDirection: 'row', gap: 4, paddingVertical: 4 },
  maRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 4 },
  legend: { paddingBottom: 4 },
});
