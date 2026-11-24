import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions, type TextStyle } from 'react-native';
import { tapHaptic } from '../tiles/PressableCard';

export interface IndustryGroup {
  key: string;
  title: string;
  count: number;
}

export interface IndustryJumpTheme {
  card: string;
  border: string;
  background: string;
  textHeading: string;
  textMuted: string;
  accent: string;
  onAccent: string;
  text: { label: TextStyle; body: TextStyle };
}

export interface IndustryJumpLabels {
  /** 「全部產業」 */
  allIndustries: string;
  /** 「找產業」 */
  findIndustry: string;
  close: string;
  /** 「半導體 103」 accessibility, e.g. 「半導體，103 檔，跳到這一段」 */
  jumpA11y: (title: string, count: number) => string;
}

/**
 * Industry chips under the sort line (1.12.1): 「全部產業」 first, then every
 * industry by size with its full name and count. A tap jumps to that section
 * and highlights it; a second tap clears the highlight. Horizontally
 * scrollable; the list pins it to the top while scrolling.
 */
export function IndustryChipRow({ groups, active, onJump, onOpenAll, theme, labels, testID = 'industry-chips' }: {
  groups: readonly IndustryGroup[];
  active: string | null;
  onJump: (key: string | null) => void;
  onOpenAll: () => void;
  theme: IndustryJumpTheme;
  labels: IndustryJumpLabels;
  testID?: string;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      keyboardShouldPersistTaps="handled"
      style={{ backgroundColor: theme.background }}
      testID={testID}
    >
      <Pressable
        onPress={() => { tapHaptic(); onOpenAll(); }}
        accessibilityRole="button"
        style={[styles.chip, styles.allChip, { borderColor: theme.accent }]}
        testID={`${testID}-all`}
      >
        <Text style={[theme.text.label, styles.chipText, { color: theme.accent }]} numberOfLines={1}>{`${labels.allIndustries} ▾`}</Text>
      </Pressable>
      {groups.map((g) => {
        const on = active === g.key;
        return (
          <Pressable
            key={g.key}
            onPress={() => { tapHaptic(); onJump(on ? null : g.key); }}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            accessibilityLabel={labels.jumpA11y(g.title, g.count)}
            style={[styles.chip, on ? { backgroundColor: theme.accent, borderColor: theme.accent } : { backgroundColor: theme.card, borderColor: theme.border }]}
            testID={`${testID}-${g.key}`}
          >
            <Text style={[theme.text.label, styles.chipText, { color: on ? theme.onAccent : theme.textHeading }]} numberOfLines={1}>
              {g.title}
              <Text style={{ color: on ? theme.onAccent : theme.textMuted, fontWeight: '500' }}>{` ${g.count}`}</Text>
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/**
 * 「全部產業」 bottom sheet: a 「找產業」 search on top, then a two-column grid of
 * full names and counts, each cell at least 44pt. Choosing one jumps there.
 */
export function IndustrySheet({ visible, groups, onPick, onClose, theme, labels, testID = 'industry-sheet' }: {
  visible: boolean;
  groups: readonly IndustryGroup[];
  onPick: (key: string) => void;
  onClose: () => void;
  theme: IndustryJumpTheme;
  labels: IndustryJumpLabels;
  testID?: string;
}) {
  const [q, setQ] = useState('');
  // Large text: one column so full names fit.
  const big = useWindowDimensions().fontScale >= 1.5;
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return needle ? groups.filter((g) => g.title.toLowerCase().includes(needle)) : groups;
  }, [groups, q]);
  const close = () => { setQ(''); onClose(); };
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close} testID={testID}>
      <Pressable style={styles.scrim} onPress={close} accessibilityRole="button" accessibilityLabel={labels.close} testID={`${testID}-scrim`} />
      <View style={[styles.sheet, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={[styles.grabber, { backgroundColor: theme.border }]} />
        <View style={styles.sheetHead}>
          <Text style={[theme.text.body, styles.sheetTitle, { color: theme.textHeading }]} numberOfLines={1}>{labels.allIndustries}</Text>
          <Pressable onPress={close} accessibilityRole="button" hitSlop={12} style={styles.closeBtn} testID={`${testID}-close`}>
            <Text style={[theme.text.label, { color: theme.accent, fontWeight: '700' }]}>{labels.close}</Text>
          </Pressable>
        </View>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder={labels.findIndustry}
          placeholderTextColor={theme.textMuted}
          style={[theme.text.body, styles.find, { color: theme.textHeading, borderColor: theme.border, backgroundColor: theme.background }]}
          autoCorrect={false}
          accessibilityLabel={labels.findIndustry}
          testID={`${testID}-find`}
        />
        <ScrollView contentContainerStyle={styles.grid} keyboardShouldPersistTaps="handled">
          {shown.map((g) => (
            <Pressable
              key={g.key}
              onPress={() => { tapHaptic(); setQ(''); onPick(g.key); }}
              accessibilityRole="button"
              accessibilityLabel={labels.jumpA11y(g.title, g.count)}
              style={[styles.cell, big && styles.cellFull, { borderColor: theme.border, backgroundColor: theme.background }]}
              testID={`${testID}-${g.key}`}
            >
              <Text style={[theme.text.body, styles.cellTitle, { color: theme.textHeading }]} numberOfLines={big ? 3 : 2}>{g.title}</Text>
              <Text style={[theme.text.label, { color: theme.textMuted, fontVariant: ['tabular-nums'] }]}>{g.count}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  row: { gap: 6, paddingHorizontal: 16, paddingVertical: 6 },
  chip: { borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, minHeight: 34, justifyContent: 'center' },
  allChip: { borderWidth: 1 },
  chipText: { fontWeight: '600' },
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { maxHeight: '75%', borderTopLeftRadius: 16, borderTopRightRadius: 16, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, paddingBottom: 28 },
  grabber: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, marginTop: 8, marginBottom: 4 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', minHeight: 44 },
  sheetTitle: { flex: 1, fontWeight: '700' },
  closeBtn: { minHeight: 44, justifyContent: 'center', paddingLeft: 12 },
  find: { minHeight: 44, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 8, paddingBottom: 8 },
  // Name on top with the full cell width (long English names never break mid-word), count below.
  cell: { width: '48.5%', minHeight: 44, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, paddingVertical: 8, justifyContent: 'center', gap: 2 },
  cellTitle: { minWidth: 0 },
  cellFull: { width: '100%' },
});
