import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, type TextStyle } from 'react-native';
import { tapHaptic } from '../tiles/PressableCard';

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
      <View style={styles.labels}>
        {visible.map((s) => {
          const on = selected === s.key;
          return (
            <Pressable
              key={s.key}
              onPress={() => { tapHaptic(); onSelect(s.key); }}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={a11yLabel ? a11yLabel(s) : `${s.label} ${s.count}`}
              style={[styles.label, on ? { borderColor: s.color, backgroundColor: theme.card } : { borderColor: 'transparent' }]}
              testID={`${testID}-${s.key}`}
            >
              <View style={[styles.dot, { backgroundColor: s.color }]} />
              <Text style={[theme.text.label, styles.labelText, { color: theme.textHeading }]} numberOfLines={2}>
                {s.label}
                <Text style={styles.count}>{` ${s.count.toLocaleString('en-US')}`}</Text>
              </Text>
            </Pressable>
          );
        })}
        {favorites && favorites.count > 0 ? (
          <Pressable
            onPress={() => { tapHaptic(); favorites.onToggle(); }}
            accessibilityRole="button"
            accessibilityState={{ selected: favorites.on }}
            accessibilityLabel={`${favorites.label} ${favorites.count}`}
            style={[styles.fav, favorites.on ? { backgroundColor: theme.accent, borderColor: theme.accent } : { backgroundColor: theme.card, borderColor: theme.border }]}
            testID={`${testID}-favorites`}
          >
            <Text style={[theme.text.label, styles.labelText, { color: favorites.on ? theme.onSegment : theme.textHeading }]} numberOfLines={1}>
              {`★ ${favorites.label} ${favorites.count}`}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  bar: { flexDirection: 'row', height: BAR_HEIGHT, borderRadius: BAR_HEIGHT / 2, overflow: 'hidden', gap: 2 },
  block: { minWidth: 4 },
  empty: { flex: 1 },
  labels: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  label: { flex: 1, minWidth: 0, minHeight: 36, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 8, borderWidth: 1, paddingHorizontal: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  labelText: { fontWeight: '600', flexShrink: 1, textAlign: 'center' },
  count: { fontWeight: '700', fontVariant: ['tabular-nums'] },
  fav: { minHeight: 36, borderRadius: 8, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 10, justifyContent: 'center' },
});
