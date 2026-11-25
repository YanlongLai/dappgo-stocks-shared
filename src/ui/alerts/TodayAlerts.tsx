import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, type TextStyle } from 'react-native';
import { tapHaptic } from '../tiles/PressableCard';
import { FavoriteToggle } from '../favorites/FavoriteToggle';

export interface TodayAlertRow {
  key: string;
  symbol: string;
  name?: string | null;
  /** 「跌破估值下緣 · 182.30」 */
  line: string;
  lineColor?: string;
  /** 「自選」 / 「常看」 */
  tag: string;
  onPress: () => void;
  /** Leading shared star (2.0.1): add a 常看 stock or remove a 自選 one in place. */
  favorite?: { on: boolean; onToggle: () => void; accessibilityLabel: string } | null;
}

export interface TodayAlertsTheme {
  card: string;
  border: string;
  background: string;
  textHeading: string;
  textMuted: string;
  accent: string;
  /** Pale capsule behind the tag. */
  tagBackground: string;
  text: { label: TextStyle; body: TextStyle; sub: TextStyle };
}

export interface TodayAlertsLabels {
  /** 「今日提醒」 */
  title: string;
  /** 「你關注的股票，今天有 N 檔有變化」 */
  subtitle: (n: number) => string;
  /** 「還有 N 則提醒」 */
  more: (n: number) => string;
  close: string;
  openHint: string;
}

/**
 * 今日提醒 (2.0.0): a reminder, not a second favorites list. Each row is
 * 「代號 名稱 + concrete change + 自選/常看」; tapping a row opens that stock.
 * More than `preview` alerts adds 「還有 N 則提醒 ›」, which opens the full
 * list in a sheet. The caller hides the card when there are no alerts.
 */
export function TodayAlerts({ rows, preview = 3, theme, labels, testID = 'today-alerts' }: {
  rows: readonly TodayAlertRow[];
  preview?: number;
  theme: TodayAlertsTheme;
  labels: TodayAlertsLabels;
  testID?: string;
}) {
  const [open, setOpen] = useState(false);
  if (!rows.length) return null;
  const shown = rows.slice(0, preview);
  const hidden = rows.length - shown.length;
  return (
    <View testID={testID}>
      <View style={styles.head}>
        <Text style={[theme.text.body, styles.title, { color: theme.textHeading }]} accessibilityRole="header">{labels.title}</Text>
        <Text style={[theme.text.sub, { color: theme.textMuted }]} testID={`${testID}-subtitle`}>{labels.subtitle(rows.length)}</Text>
      </View>
      <View style={[styles.card, { backgroundColor: theme.card }]}>
        {shown.map((r, i) => (
          <AlertRow key={r.key} row={r} theme={theme} labels={labels} first={i === 0} testID={`${testID}-row-${r.symbol}`} />
        ))}
        {hidden > 0 ? (
          <Pressable
            onPress={() => { tapHaptic(); setOpen(true); }}
            accessibilityRole="button"
            style={[styles.footer, { borderTopColor: theme.border }]}
            testID={`${testID}-more`}
          >
            <Text style={[theme.text.label, styles.footerText, { color: theme.accent }]}>{`${labels.more(hidden)} ›`}</Text>
          </Pressable>
        ) : null}
      </View>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.scrim} onPress={() => setOpen(false)} accessibilityRole="button" accessibilityLabel={labels.close} />
        <View style={[styles.sheet, { backgroundColor: theme.card, borderColor: theme.border }]} testID={`${testID}-sheet`}>
          <View style={[styles.grabber, { backgroundColor: theme.border }]} />
          <View style={styles.sheetHead}>
            <View style={styles.flex}>
              <Text style={[theme.text.body, styles.title, { color: theme.textHeading }]}>{labels.title}</Text>
              <Text style={[theme.text.sub, { color: theme.textMuted }]}>{labels.subtitle(rows.length)}</Text>
            </View>
            <Pressable onPress={() => setOpen(false)} accessibilityRole="button" hitSlop={12} style={styles.close} testID={`${testID}-close`}>
              <Text style={[theme.text.label, { color: theme.accent, fontWeight: '700' }]}>{labels.close}</Text>
            </Pressable>
          </View>
          <ScrollView scrollsToTop={false}>
            {rows.map((r, i) => (
              <AlertRow key={r.key} row={{ ...r, onPress: () => { setOpen(false); r.onPress(); } }} theme={theme} labels={labels} first={i === 0} testID={`${testID}-sheet-row-${r.symbol}`} />
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function AlertRow({ row, theme, labels, first, testID }: { row: TodayAlertRow; theme: TodayAlertsTheme; labels: TodayAlertsLabels; first: boolean; testID: string }) {
  return (
    <Pressable
      onPress={() => { tapHaptic(); row.onPress(); }}
      accessibilityRole="button"
      accessibilityLabel={[row.symbol, row.name, row.line, row.tag].filter(Boolean).join(', ')}
      accessibilityHint={labels.openHint}
      style={({ pressed }) => [styles.row, !first && { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth }, pressed && styles.pressed]}
      testID={testID}
    >
      {row.favorite ? (
        // Card padding is 16: pull the 44pt target in so the star sits 16pt from the edge, 12pt before the code.
        <View style={styles.starSlot}>
          <FavoriteToggle on={row.favorite.on} onToggle={row.favorite.onToggle} accessibilityLabel={row.favorite.accessibilityLabel}
            accent={theme.accent} muted={theme.textMuted} testID={`${testID}-star`} />
        </View>
      ) : null}
      <View style={styles.flex}>
        <Text style={[theme.text.body, styles.symbol, { color: theme.textHeading }]} numberOfLines={1}>
          {row.symbol}
          {row.name && row.name !== row.symbol ? <Text style={[theme.text.sub, { color: theme.textMuted, fontWeight: '400' }]}>{`  ${row.name}`}</Text> : null}
        </Text>
        <Text style={[theme.text.sub, { color: row.lineColor ?? theme.textHeading }]} numberOfLines={2} testID={`${testID}-line`}>{row.line}</Text>
      </View>
      <View style={[styles.tag, { backgroundColor: theme.tagBackground }]}>
        <Text style={[theme.text.label, styles.tagText, { color: theme.textMuted }]} numberOfLines={1} testID={`${testID}-tag`}>{row.tag}</Text>
      </View>
      <Text style={[theme.text.label, { color: theme.textMuted }]} accessible={false}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  starSlot: { marginLeft: -12, marginRight: -10 },
  head: { gap: 2, marginBottom: 8 },
  title: { fontWeight: '700' },
  card: { borderRadius: 16, paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 56, paddingVertical: 10 },
  pressed: { opacity: 0.6 },
  symbol: { fontWeight: '700' },
  tag: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  tagText: { fontWeight: '600' },
  footer: { minHeight: 44, justifyContent: 'center', borderTopWidth: StyleSheet.hairlineWidth },
  footerText: { fontWeight: '700' },
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { maxHeight: '75%', borderTopLeftRadius: 16, borderTopRightRadius: 16, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, paddingBottom: 28 },
  grabber: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, marginTop: 8, marginBottom: 4 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', minHeight: 56, gap: 8 },
  close: { minHeight: 44, justifyContent: 'center', paddingLeft: 12 },
});
