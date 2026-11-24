import React from 'react';
import { Pressable, StyleSheet, Text, View, type TextStyle } from 'react-native';

/** Colours and text styles the app passes in (its theme + its reading type scale). */
export interface KeyPointsTheme {
  textHeading: string;
  textMuted: string;
  accent: string;
  text: { label: TextStyle; body: TextStyle };
}

/**
 * 重點: up to three short lines with figures, shown first when an AI summary
 * opens. The whole text sits behind {@link FullTextToggle}.
 */
export function KeyPoints({ points, title, theme, testID = 'ai-key-points' }: {
  points: readonly string[];
  title: string;
  theme: KeyPointsTheme;
  testID?: string;
}) {
  if (!points.length) return null;
  return (
    <View style={styles.box} testID={testID} accessibilityRole="summary">
      <Text style={[theme.text.label, { color: theme.accent }]} numberOfLines={1}>{title}</Text>
      {points.map((point, i) => (
        <View key={`${i}-${point}`} style={styles.row} testID={`${testID}-${i}`}>
          <View style={[styles.dot, { backgroundColor: theme.accent }]} />
          <Text style={[theme.text.body, styles.flex, { color: theme.textHeading }]}>{point}</Text>
        </View>
      ))}
    </View>
  );
}

/** 「看全文」/「收合全文」 under the key points. */
export function FullTextToggle({ expanded, onToggle, showLabel, hideLabel, theme, testID = 'ai-full-text-toggle' }: {
  expanded: boolean;
  onToggle: () => void;
  showLabel: string;
  hideLabel: string;
  theme: KeyPointsTheme;
  testID?: string;
}) {
  const label = expanded ? hideLabel : showLabel;
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ expanded }}
      hitSlop={8}
      style={({ pressed }) => [styles.toggle, pressed && styles.pressed]}
      testID={testID}
    >
      <Text style={[theme.text.label, styles.toggleText, { color: theme.accent }]} numberOfLines={1}>
        {label} {expanded ? '▴' : '▾'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  box: { gap: 6 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  // Centred on the first line of a 15–17 pt body.
  dot: { width: 5, height: 5, borderRadius: 3, marginTop: 9 },
  toggle: { alignSelf: 'flex-start', minHeight: 36, justifyContent: 'center', paddingRight: 8 },
  toggleText: { fontWeight: '700' },
  pressed: { opacity: 0.6 },
});
