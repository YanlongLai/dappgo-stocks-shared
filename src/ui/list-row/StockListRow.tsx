/**
 * One stock row for every list (2.0.1): signals, favorites, search, valuation.
 *
 *   [★ 44] [code / name  flex ≥72] [spark 64×28] [price+change 88 →|] [pill fixed]
 *
 * Every column has a fixed width (only code/name flexes), so the sparkline
 * starts at the same x on every row, prices share one right edge with tabular
 * figures and pills one width — nothing is pushed around by a row's own text.
 * At large text sizes the row becomes two lines (code/name, then the same
 * fixed price and pill columns) and the sparkline is dropped.
 */
import React, { memo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions, type TextStyle } from 'react-native';
import { LIST_ROW, LIST_ROW_STACK_SCALE, priceWidth } from '../../mobile/list-row/columns';
import { FAVORITE_TOGGLE_INSET, FavoriteToggle, SwipeFavoriteRow } from '../favorites/FavoriteToggle';

export interface StockListRowTheme {
  background: string;
  textHeading: string;
  textMuted: string;
  accent: string;
  onAccent: string;
  negative: string;
  /** Optional type overrides; sizes default to the shared row scale. */
  text?: { code?: TextStyle; name?: TextStyle; price?: TextStyle; change?: TextStyle; pill?: TextStyle };
}

export interface StockListRowProps {
  code: string;
  name?: string | null;
  /** Rendered by the app at LIST_ROW.spark (64×28); null leaves the column empty but in place. */
  spark?: ReactNode;
  price?: string | null;
  change?: string | null;
  changeColor?: string;
  /** Verdict / zone pill: fixed width for the whole list (pillWidth). */
  pill?: { label: string; fg: string; bg: string; width: number } | null;
  /** Small note under the pill, inside the same fixed column (e.g. 「was Neutral」). */
  pillNote?: ReactNode;
  /** Small mark after the code (e.g. a hot flame). */
  codeMark?: ReactNode;
  star?: {
    on: boolean;
    onToggle: () => void;
    accessibilityLabel: string;
    /** Swipe-right actions; without them the row does not swipe. */
    swipe?: { add: string; remove: string } | null;
  } | null;
  onPress?: () => void;
  onLongPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  theme: StockListRowTheme;
  /** Row height (≥ 64); lists with getItemLayout pass theirs. */
  height?: number;
  testID?: string;
}

export const StockListRow = memo(function StockListRow(p: StockListRowProps) {
  const { fontScale } = useWindowDimensions();
  const stacked = fontScale >= LIST_ROW_STACK_SCALE;
  const t = p.theme;
  const priceW = priceWidth(fontScale);

  const star = p.star ? (
    <View style={styles.starCol}>
      <FavoriteToggle
        on={p.star.on}
        onToggle={p.star.onToggle}
        accessibilityLabel={p.star.accessibilityLabel}
        accent={t.accent}
        muted={t.textMuted}
        testID={p.testID ? `${p.testID}-star` : undefined}
      />
    </View>
  ) : null;

  const nameCol = (
    <View style={styles.nameCol}>
      <View style={styles.codeLine}>
        <Text style={[styles.code, t.text?.code, { color: t.textHeading }]} numberOfLines={1}>{p.code}</Text>
        {p.codeMark}
      </View>
      {p.name ? <Text style={[styles.name, t.text?.name, { color: t.textMuted }]} numberOfLines={1} ellipsizeMode="tail">{p.name}</Text> : null}
    </View>
  );

  const priceCol = (
    <View style={[styles.priceCol, { width: priceW }]}>
      {p.price != null ? (
        <Text style={[styles.price, t.text?.price, { color: t.textHeading }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>{p.price}</Text>
      ) : null}
      {p.change != null ? (
        <Text style={[styles.change, t.text?.change, { color: p.changeColor ?? t.textMuted }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>{p.change}</Text>
      ) : null}
    </View>
  );

  const pillCol = p.pill ? (
    <View style={[styles.pillCol, { width: p.pill.width }]}>
      <View style={[styles.pill, { backgroundColor: p.pill.bg }]}>
        <Text style={[styles.pillText, t.text?.pill, { color: p.pill.fg }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{p.pill.label}</Text>
      </View>
      {p.pillNote}
    </View>
  ) : null;

  const body = stacked ? (
    <View style={styles.stack}>
      <View style={styles.line}>
        {star}
        {nameCol}
      </View>
      <View style={[styles.line, styles.stackNumbers]}>
        {priceCol}
        {pillCol}
      </View>
    </View>
  ) : (
    <>
      {star}
      {nameCol}
      <View style={styles.sparkCol}>{p.spark}</View>
      {priceCol}
      {pillCol}
    </>
  );

  const rowStyle = [styles.row, stacked && styles.rowStacked, { backgroundColor: t.background, paddingLeft: p.star ? FAVORITE_TOGGLE_INSET : LIST_ROW.edge }, p.height ? { minHeight: p.height } : null];
  const label = p.accessibilityLabel ?? [p.code, p.name, p.price, p.change, p.pill?.label].filter(Boolean).join(', ');
  const content = p.onPress || p.onLongPress ? (
    <Pressable
      onPress={p.onPress}
      onLongPress={p.onLongPress}
      delayLongPress={500}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={p.accessibilityHint}
      style={({ pressed }) => [...rowStyle, pressed && styles.pressed]}
      testID={p.testID}
    >
      {body}
    </Pressable>
  ) : (
    <View style={rowStyle} accessible accessibilityLabel={label} testID={p.testID}>{body}</View>
  );
  if (!p.star?.swipe) return content;
  return (
    <SwipeFavoriteRow
      on={p.star.on}
      onToggle={p.star.onToggle}
      labels={p.star.swipe}
      theme={{ accent: t.accent, onAccent: t.onAccent, negative: t.negative, background: t.background }}
      testID={p.testID ? `${p.testID}-swipe` : undefined}
    >
      {content}
    </SwipeFavoriteRow>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 64, paddingRight: LIST_ROW.edge, paddingVertical: 8, gap: LIST_ROW.gap },
  rowStacked: { paddingVertical: 10 },
  pressed: { opacity: 0.6 },
  // The star target already holds the 12pt to the code: no extra gap after it.
  starCol: { width: LIST_ROW.star, marginRight: -LIST_ROW.gap },
  nameCol: { flex: 1, minWidth: LIST_ROW.nameMin, gap: 2 },
  codeLine: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  code: { fontSize: 17, fontWeight: '700', flexShrink: 1 },
  name: { fontSize: 13 },
  sparkCol: { width: LIST_ROW.spark.width, height: LIST_ROW.spark.height, justifyContent: 'center' },
  priceCol: { alignItems: 'flex-end', gap: 2 },
  price: { fontSize: 17, fontWeight: '600', fontVariant: ['tabular-nums'], textAlign: 'right' },
  change: { fontSize: 14, fontWeight: '600', fontVariant: ['tabular-nums'], textAlign: 'right' },
  pillCol: { alignItems: 'stretch', gap: 4 },
  pill: { borderRadius: 999, paddingVertical: 4, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
  pillText: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  stack: { flex: 1, gap: 6 },
  line: { flexDirection: 'row', alignItems: 'center', gap: LIST_ROW.gap },
  stackNumbers: { justifyContent: 'flex-end' },
});
