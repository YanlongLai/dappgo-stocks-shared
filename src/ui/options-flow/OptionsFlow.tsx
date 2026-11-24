import React, { memo, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent, type TextStyle } from 'react-native';
import { heatColor, heatColumns, type FlowRow } from '../../mobile/options-flow/model';

/**
 * 選擇權量能 tiles: one tile per symbol coloured by its put/call ratio
 * (green = call-heavy, red = put-heavy; Options keeps green-up/red-down).
 */
export interface OptionsFlowTheme {
  card: string;
  border: string;
  textHeading: string;
  textMuted: string;
  /** Colour at full call weight (ratio ≤ 0.33). */
  callHeavy: string;
  /** Colour at full put weight (ratio ≥ 3). */
  putHeavy: string;
  text: { label: TextStyle; value: TextStyle; sub: TextStyle };
}

const GAP = 6;

export const FlowHeatGrid = memo(function FlowHeatGrid({ rows, theme, onPress, formatRatio, subLabel, limit, testID = 'flow-heat-grid' }: {
  rows: readonly FlowRow[];
  theme: OptionsFlowTheme;
  onPress?: (symbol: string) => void;
  formatRatio: (ratio: number) => string;
  /** Optional second line, e.g. the call : put volume. */
  subLabel?: (row: FlowRow) => string | null;
  limit?: number;
  testID?: string;
}) {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => {
    const next = Math.round(e.nativeEvent.layout.width);
    if (next !== width) setWidth(next);
  };
  const columns = heatColumns(width);
  const tileWidth = width > 0 ? Math.floor((width - GAP * (columns - 1)) / columns) : 0;
  const shown = limit ? rows.slice(0, limit) : rows;
  return (
    <View style={styles.grid} onLayout={onLayout} testID={testID}>
      {tileWidth > 0 ? shown.map((row) => {
        const sub = subLabel?.(row) ?? null;
        return (
          <Pressable
            key={row.symbol}
            onPress={onPress ? () => onPress(row.symbol) : undefined}
            accessibilityRole={onPress ? 'button' : undefined}
            accessibilityLabel={`${row.symbol} ${formatRatio(row.ratio)}${sub ? ` ${sub}` : ''}`}
            style={({ pressed }) => [styles.tile, { width: tileWidth, backgroundColor: heatColor(row.heat, theme), borderColor: theme.border }, pressed && styles.pressed]}
            testID={`flow-tile-${row.symbol}`}
          >
            <Text style={[theme.text.label, styles.symbol, { color: theme.textHeading }]} numberOfLines={1}>{row.symbol}</Text>
            <Text style={[theme.text.value, styles.ratio, { color: theme.textHeading }]} numberOfLines={1}>{formatRatio(row.ratio)}</Text>
            {sub ? <Text style={[theme.text.label, { color: theme.textMuted }]} numberOfLines={1}>{sub}</Text> : null}
          </Pressable>
        );
      }) : null}
    </View>
  );
});

/** Call-heavy ← 1.0 → put-heavy, drawn as seven steps (no gradient dependency). */
export function FlowLegend({ theme, callLabel, putLabel, testID = 'flow-legend' }: {
  theme: OptionsFlowTheme;
  callLabel: string;
  putLabel: string;
  testID?: string;
}) {
  const steps = [-1, -0.66, -0.33, 0, 0.33, 0.66, 1];
  return (
    <View style={styles.legend} testID={testID} accessible accessibilityLabel={`${callLabel} · 1.0 · ${putLabel}`}>
      <View style={[styles.bar, { borderColor: theme.border }]}>
        {steps.map((h) => <View key={h} style={[styles.step, { backgroundColor: heatColor(h, theme) }]} />)}
      </View>
      <View style={styles.legendLabels}>
        <Text style={[theme.text.label, { color: theme.textMuted }]} numberOfLines={1}>{callLabel}</Text>
        <Text style={[theme.text.label, { color: theme.textMuted }]} numberOfLines={1}>1.0</Text>
        <Text style={[theme.text.label, { color: theme.textMuted }]} numberOfLines={1}>{putLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  tile: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 8, paddingVertical: 7, gap: 1, minHeight: 56 },
  symbol: { fontWeight: '700' },
  ratio: { fontVariant: ['tabular-nums'] },
  pressed: { opacity: 0.6 },
  legend: { gap: 4, marginTop: 8 },
  bar: { flexDirection: 'row', height: 6, borderRadius: 3, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth },
  step: { flex: 1 },
  legendLabels: { flexDirection: 'row', justifyContent: 'space-between' },
});
