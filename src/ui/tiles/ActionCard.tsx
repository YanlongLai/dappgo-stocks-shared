import React, { type ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { CardFooter, LIST_PREVIEW_ROWS, PressableCard, TapHint, type CardKind } from './PressableCard';

export interface ActionCardTheme {
  card: string;
  /** Pressed background: a touch lighter than `card`. */
  cardPressed: string;
  border: string;
  textHeading: string;
  textMuted: string;
  accent: string;
  text: { label: TextStyle; rowTitle: TextStyle; sub: TextStyle; value: TextStyle };
}

export interface PreviewRow {
  key: string;
  title: string;
  sub?: string | null;
  value?: string | null;
  valueColor?: string;
  /** e.g. 「自選」 or a zone tag, shown before the value. */
  tag?: string | null;
  tagColor?: string;
}

/**
 * One dashboard card under the tap rule (plan §3.2):
 * - list:   title 「›」, up to 3 preview rows of real content, footer 「還有 N 筆 ›」;
 * - detail: title 「›」, the body, footer such as 「查看完整報告 ›」;
 * - static: title and body only, not tappable.
 */
export function ActionCard({
  kind, title, titleRight, onPress, accessibilityHint, accessibilityLabel, rows, footer, theme, accentColor, children, style, testID,
}: {
  kind: CardKind;
  title: string;
  /** Small text right of the title (e.g. a trial badge), before the 「›」. */
  titleRight?: ReactNode;
  onPress?: () => void;
  accessibilityHint?: string;
  accessibilityLabel?: string;
  /** list cards: preview rows (only the first 3 are shown). */
  rows?: readonly PreviewRow[];
  /** list: 「還有 N 筆 ›」; detail: 「查看完整報告 ›」. */
  footer?: string | null;
  theme: ActionCardTheme;
  accentColor?: string | null;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const tappable = kind !== 'static' && !!onPress;
  const body = (
    <>
      <View style={styles.titleRow}>
        <Text style={[theme.text.label, styles.flex, { color: theme.textMuted }]} numberOfLines={1}>{title}</Text>
        {titleRight ?? null}
        {tappable ? <TapHint color={theme.textMuted} /> : null}
      </View>
      {children}
      {kind === 'list' && rows?.length ? (
        <View style={styles.rows}>
          {rows.slice(0, LIST_PREVIEW_ROWS).map((r, i) => (
            <View key={r.key} style={[styles.row, i > 0 && { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth }]} testID={`${testID ?? 'action-card'}-row-${r.key}`}>
              <View style={styles.flex}>
                <Text style={[theme.text.rowTitle, { color: theme.textHeading }]} numberOfLines={1}>{r.title}</Text>
                {r.sub ? <Text style={[theme.text.sub, { color: theme.textMuted }]} numberOfLines={1}>{r.sub}</Text> : null}
              </View>
              {r.tag ? <Text style={[theme.text.label, styles.tag, { color: r.tagColor ?? theme.textMuted }]} numberOfLines={1}>{r.tag}</Text> : null}
              {r.value ? <Text style={[theme.text.rowTitle, styles.value, { color: r.valueColor ?? theme.textHeading }]} numberOfLines={1}>{r.value}</Text> : null}
            </View>
          ))}
        </View>
      ) : null}
      {tappable && footer ? <CardFooter text={footer} color={theme.accent} borderColor={theme.border} /> : null}
    </>
  );
  const frame = [styles.card, { backgroundColor: theme.card }, style];
  if (!tappable) {
    return <View style={frame} accessible={!children} accessibilityLabel={accessibilityLabel ?? title} testID={testID}>{body}</View>;
  }
  return (
    <PressableCard
      onPress={onPress!}
      accessibilityHint={accessibilityHint ?? title}
      accessibilityLabel={accessibilityLabel ?? [title, footer?.replace(/\s*›$/, '')].filter(Boolean).join(', ')}
      style={frame}
      pressedColor={theme.cardPressed}
      accentColor={accentColor}
      testID={testID}
    >
      {body}
    </PressableCard>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 18, padding: 14, gap: 8, marginBottom: 8 },
  flex: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rows: { gap: 0 },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 44, paddingVertical: 6, gap: 8 },
  tag: { fontWeight: '700' },
  value: { fontVariant: ['tabular-nums'], textAlign: 'right' },
});
