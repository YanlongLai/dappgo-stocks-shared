import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, useWindowDimensions, type LayoutChangeEvent, type TextStyle } from 'react-native';
import { tapHaptic } from '../tiles/PressableCard';
import { LABEL_GAP, labelLayout } from '../../mobile/list-filter/label-layout';

export interface DistributionSegment {
  key: string;
  label: string;
  count: number;
  color: string;
}

export interface DistributionTheme {
  card: string;
  border: string;
  textHeading: string;
  textMuted: string;
  accent: string;
  /** Text on a coloured segment. */
  onSegment: string;
  text: { label: TextStyle; sub: TextStyle };
}

export const BAR_HEIGHT = 10;
/** Only the colour block fades when another segment is selected. */
export const DIM_OPACITY = 0.25;

/**
 * 分布條 (1.12.1): a thin 10pt colour bar, each block as wide as its share;
 * below it, one label per segment ("Fair 590") spread evenly, so a narrow block
 * never cuts its label, with 「自選 N」 at the right end of the same row.
 * Tap a label (or block) to show only that group — the other blocks fade, the
 * labels keep full contrast; tap again for all.
 */
export function DistributionBar({ segments, selected, onSelect, favorites, theme, a11yLabel, testID = 'distribution-bar' }: {
  segments: readonly DistributionSegment[];
  selected: string | null;
  onSelect: (key: string) => void;
  /** @deprecated 2.0.0: 「自選 N」 lives on the result line now; ignored here. */
  favorites?: { label: string; count: number; on: boolean; onToggle: () => void } | null;
  theme: DistributionTheme;
  /** e.g. (s) => `${s.label} ${s.count} 檔` */
  a11yLabel?: (s: DistributionSegment) => string;
  testID?: string;
}) {
  const total = segments.reduce((n, s) => n + s.count, 0);
  const fade = useRef(new Animated.Value(1)).current;
  const signature = segments.map((s) => `${s.key}:${s.count}`).join('|');
  useEffect(() => {
    fade.setValue(0.4);
    Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  }, [signature, fade]);
  const visible = segments.filter((s) => s.count > 0);
  // Large text: one label per line, so names and counts are never broken up.
  const big = useWindowDimensions().fontScale >= 1.5;
  // Natural label widths come from an invisible copy laid out without wrapping.
  const [rowWidth, setRowWidth] = useState(0);
  const [natural, setNatural] = useState<Record<string, number>>({});
  const layout = big ? 'column' : labelLayout(visible.map((s) => natural[s.key] ?? 0), rowWidth);
  const renderLabel = (s: DistributionSegment, measureOnly = false) => (
    <View style={styles.labelInner}>
      <View style={[styles.dot, { backgroundColor: s.color }]} />
      <Text style={[theme.text.label, styles.labelText, { color: theme.textHeading }]} numberOfLines={big ? 2 : 1} accessible={!measureOnly}>
        {s.label}
        <Text style={styles.count}>{` ${s.count.toLocaleString('en-US')}`}</Text>
      </Text>
    </View>
  );

  return (
    <View style={styles.wrap} testID={testID}>
      <Animated.View style={[styles.bar, { opacity: fade }]}>
        {total === 0 ? <View style={[styles.empty, { backgroundColor: theme.border }]} /> : visible.map((s) => {
          const dim = selected !== null && selected !== s.key;
          return (
            <Pressable
              key={s.key}
              onPress={() => { tapHaptic(); onSelect(s.key); }}
              accessible={false}
              hitSlop={{ top: 12, bottom: 4 }}
              style={[styles.block, { flex: s.count, backgroundColor: s.color, opacity: dim ? DIM_OPACITY : 1 }]}
              testID={`${testID}-block-${s.key}`}
            />
          );
        })}
      </Animated.View>
      {!big ? (
        <View style={styles.measure} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {visible.map((s) => (
            <View key={s.key} style={styles.label} onLayout={(e: LayoutChangeEvent) => {
              const w = Math.ceil(e.nativeEvent.layout.width);
              setNatural((n) => (n[s.key] === w ? n : { ...n, [s.key]: w }));
            }}>
              {renderLabel(s, true)}
            </View>
          ))}
        </View>
      ) : null}
      <View
        style={[styles.labels, layout === 'column' && styles.labelsColumn, layout === 'grid' && styles.labelsGrid]}
        onLayout={(e: LayoutChangeEvent) => setRowWidth(Math.floor(e.nativeEvent.layout.width))}
        testID={`${testID}-labels-${layout}`}
      >
        {visible.map((s) => {
          const on = selected === s.key;
          return (
            <Pressable
              key={s.key}
              onPress={() => { tapHaptic(); onSelect(s.key); }}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={a11yLabel ? a11yLabel(s) : `${s.label} ${s.count}`}
              style={[styles.label, big && styles.labelBig, layout === 'grid' && styles.labelGrid, on ? { borderColor: s.color, backgroundColor: theme.card } : { borderColor: 'transparent' }]}
              testID={`${testID}-${s.key}`}
            >
              {renderLabel(s)}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  bar: { flexDirection: 'row', height: BAR_HEIGHT, borderRadius: BAR_HEIGHT / 2, overflow: 'hidden', gap: 2 },
  block: { minWidth: 4 },
  empty: { flex: 1 },
  // One row spread evenly when all labels fit (「● Below 1,097」 …); otherwise a two-column grid.
  labels: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', columnGap: LABEL_GAP },
  labelsGrid: { flexWrap: 'wrap', justifyContent: 'flex-start', rowGap: 2 },
  label: { minHeight: 32, paddingVertical: 4, borderRadius: 8, borderWidth: 1, paddingHorizontal: 4, justifyContent: 'center' },
  labelInner: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  labelGrid: { width: '49%' },
  labelsColumn: { flexDirection: 'column', alignItems: 'stretch' },
  labelBig: { alignSelf: 'stretch', paddingHorizontal: 8 },
  measure: { position: 'absolute', left: 0, top: 0, width: 4000, flexDirection: 'row', alignItems: 'flex-start', opacity: 0 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  labelText: { fontWeight: '600', flexShrink: 1 },
  count: { fontWeight: '700', fontVariant: ['tabular-nums'] },
});
