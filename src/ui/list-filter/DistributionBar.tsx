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

/** Narrower than this, a segment shows only its count. */
const LABEL_MIN_SHARE = 0.18;

/**
 * 分布條 (plan §3.3): each segment as wide as its share, label and count
 * inside. Tap a segment to show only that group (the others dim); tap again for
 * all. 「自選 N」 is a separate toggle, not a segment. Fades on new data; one
 * light haptic per change.
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

  return (
    <View style={styles.row} testID={testID}>
      <Animated.View style={[styles.bar, { opacity: fade, borderColor: theme.border }]}>
        {total === 0 ? <View style={[styles.empty, { backgroundColor: theme.border }]} /> : segments.filter((s) => s.count > 0).map((s) => {
          const share = s.count / total;
          const on = selected === s.key;
          const dim = selected !== null && !on;
          return (
            <Pressable
              key={s.key}
              onPress={() => { tapHaptic(); onSelect(s.key); }}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={a11yLabel ? a11yLabel(s) : `${s.label} ${s.count}`}
              style={[styles.segment, { flex: s.count, backgroundColor: s.color, opacity: dim ? 0.3 : 1 }]}
              testID={`${testID}-${s.key}`}
            >
              <Text style={[theme.text.label, styles.segText, { color: theme.onSegment }]} numberOfLines={1}>
                {share >= LABEL_MIN_SHARE ? `${s.label} ${s.count}` : String(s.count)}
              </Text>
            </Pressable>
          );
        })}
      </Animated.View>
      {favorites && favorites.count > 0 ? (
        <Pressable
          onPress={() => { tapHaptic(); favorites.onToggle(); }}
          accessibilityRole="button"
          accessibilityState={{ selected: favorites.on }}
          accessibilityLabel={`${favorites.label} ${favorites.count}`}
          style={[styles.fav, favorites.on ? { backgroundColor: theme.accent, borderColor: theme.accent } : { backgroundColor: theme.card, borderColor: theme.border }]}
          testID={`${testID}-favorites`}
        >
          <Text style={[theme.text.label, styles.favText, { color: favorites.on ? theme.onSegment : theme.textHeading }]} numberOfLines={1}>
            {`${favorites.label} ${favorites.count}`}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bar: { flex: 1, flexDirection: 'row', height: 36, borderRadius: 10, overflow: 'hidden', gap: 2 },
  segment: { minWidth: 28, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  segText: { fontWeight: '700', fontVariant: ['tabular-nums'] },
  empty: { flex: 1 },
  fav: { height: 36, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 10, justifyContent: 'center' },
  favText: { fontWeight: '700' },
});
