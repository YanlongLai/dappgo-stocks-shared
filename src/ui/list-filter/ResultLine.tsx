import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, type TextStyle } from 'react-native';
import { tapHaptic } from '../tiles/PressableCard';

export interface ResultLineTheme {
  card: string;
  border: string;
  textHeading: string;
  textMuted: string;
  accent: string;
  text: { label: TextStyle; body: TextStyle };
}

export interface ResultLineLabels {
  /** 「1,097 檔」 */
  resultCount: (n: number) => string;
  /** 「依離區間邊界排序」 */
  sortedBy: (sortLabel: string) => string;
  sortMenuTitle: string;
  close: string;
}

/**
 * One small line under the distribution bar (1.12.1):
 * 「1,097 檔 · 依離區間邊界排序 ▾」. With more than one sort it opens the sort
 * menu, which replaces the old row of sort buttons.
 */
export function ResultLine({ count, sorts, sort, onSort, theme, labels, testID = 'result-line' }: {
  count: number;
  sorts: readonly { key: string; label: string }[];
  sort: string;
  onSort: (key: string) => void;
  theme: ResultLineTheme;
  labels: ResultLineLabels;
  testID?: string;
}) {
  const [open, setOpen] = useState(false);
  const current = sorts.find((o) => o.key === sort) ?? null;
  const menu = sorts.length > 1;
  return (
    <>
      <Pressable
        onPress={menu ? () => { tapHaptic(); setOpen(true); } : undefined}
        disabled={!menu}
        accessibilityRole={menu ? 'button' : 'text'}
        accessibilityHint={menu ? labels.sortMenuTitle : undefined}
        style={styles.line}
        testID={testID}
      >
        <Text style={[theme.text.label, styles.text, { color: theme.textMuted }]} numberOfLines={2} accessibilityLiveRegion="polite" testID={`${testID}-text`}>
          {labels.resultCount(count)}
          {current ? ` · ${labels.sortedBy(current.label)}${menu ? ' ▾' : ''}` : ''}
        </Text>
      </Pressable>
      {menu ? (
        <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
          <Pressable style={styles.scrim} onPress={() => setOpen(false)} accessibilityRole="button" accessibilityLabel={labels.close} testID={`${testID}-scrim`} />
          <View style={[styles.menu, { backgroundColor: theme.card, borderColor: theme.border }]} testID={`${testID}-menu`}>
            <Text style={[theme.text.label, styles.title, { color: theme.textMuted }]}>{labels.sortMenuTitle}</Text>
            {sorts.map((o) => {
              const on = o.key === sort;
              return (
                <Pressable key={o.key} onPress={() => { tapHaptic(); onSort(o.key); setOpen(false); }} accessibilityRole="button" accessibilityState={{ selected: on }}
                  style={styles.row} testID={`${testID}-sort-${o.key}`}>
                  <Text style={[theme.text.body, styles.flex, { color: on ? theme.accent : theme.textHeading, fontWeight: on ? '700' : '400' }]} numberOfLines={2}>{o.label}</Text>
                  {on ? <Text style={[theme.text.body, { color: theme.accent }]}>✓</Text> : null}
                </Pressable>
              );
            })}
          </View>
        </Modal>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  line: { minHeight: 32, justifyContent: 'center' },
  text: { fontVariant: ['tabular-nums'] },
  flex: { flex: 1, minWidth: 0 },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  menu: { position: 'absolute', left: 16, right: 16, bottom: 40, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, paddingVertical: 6 },
  title: { paddingHorizontal: 16, paddingVertical: 8 },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 48, paddingHorizontal: 16, gap: 8 },
});
