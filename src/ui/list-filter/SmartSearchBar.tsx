import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextStyle } from 'react-native';
import { tapHaptic } from '../tiles/PressableCard';

export interface SearchTheme {
  card: string;
  border: string;
  background: string;
  textHeading: string;
  textMuted: string;
  accent: string;
  onAccent: string;
  text: { label: TextStyle; sub: TextStyle; body: TextStyle };
}

export interface SearchLabels {
  placeholder: string;
  /** 「1,097 筆」 */
  resultCount: (n: number) => string;
  /** 「加入後 312 筆」 */
  afterAdd: (n: number) => string;
  recentTitle: string;
  commonTitle: string;
  removeChip: (label: string) => string;
  clear: string;
  /** Shown in the panel on focus before typing, e.g. 「例如：2330、台積電、偏低、殖利率」. */
  examples?: string;
}

export interface ActiveChip { key: string; label: string; onRemove: () => void }
export interface Suggestion { key: string; label: string; count: number; onPress: () => void }
export interface QuickItem { key: string; label: string; onPress: () => void }

/**
 * 智慧搜尋列 (plan §3.3):
 * 1. typing filters, and offers condition chips (「半導體」「偏低」「殖利率」);
 * 2. matches code, name and (TW) 注音首字 — the list does the matching;
 * 3. one short single-line placeholder; examples live in the panel that opens
 *    on focus; the result count sits under the distribution bar (1.12.1);
 * 4. each suggestion shows its count after adding;
 * 5. chips have ×; the distribution bar shares the same state;
 * 6. before typing: recent searches and 3 common conditions;
 * 7. `compact` (while scrolling down): one thin row with the chips and the count.
 */
export function SmartSearchBar({
  query, onChangeQuery, onSubmit, chips, suggestions, resultCount, recent, common, compact, onExpand, theme, labels, testID = 'smart-search',
}: {
  query: string;
  onChangeQuery: (q: string) => void;
  /** Return key: record the search (personalization). */
  onSubmit?: (q: string) => void;
  chips: readonly ActiveChip[];
  suggestions: readonly Suggestion[];
  resultCount: number;
  recent: readonly QuickItem[];
  common: readonly QuickItem[];
  compact?: boolean;
  onExpand?: () => void;
  theme: SearchTheme;
  labels: SearchLabels;
  testID?: string;
}) {
  const [focused, setFocused] = useState(false);
  const count = (
    <Text style={[theme.text.label, styles.count, { color: theme.textMuted }]} numberOfLines={1} testID={`${testID}-count`} accessibilityLiveRegion="polite">
      {labels.resultCount(resultCount)}
    </Text>
  );
  const chipRow = chips.length ? (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} keyboardShouldPersistTaps="handled">
      {chips.map((c) => (
        <Pressable
          key={c.key}
          onPress={() => { tapHaptic(); c.onRemove(); }}
          accessibilityRole="button"
          accessibilityLabel={labels.removeChip(c.label)}
          style={[styles.chip, { backgroundColor: theme.accent }]}
          testID={`${testID}-chip-${c.key}`}
        >
          <Text style={[theme.text.label, styles.chipText, { color: theme.onAccent }]} numberOfLines={1}>{c.label}  ×</Text>
        </Pressable>
      ))}
    </ScrollView>
  ) : null;

  if (compact) {
    return (
      <Pressable onPress={onExpand} accessibilityRole="button" accessibilityLabel={labels.placeholder}
        style={[styles.compact, { backgroundColor: theme.background, borderBottomColor: theme.border }]} testID={`${testID}-compact`}>
        <View style={styles.flex}>{chipRow ?? <Text style={[theme.text.label, { color: theme.textMuted }]} numberOfLines={1}>{query || labels.placeholder}</Text>}</View>
        {count}
      </Pressable>
    );
  }

  const showQuick = focused && !query && (recent.length > 0 || common.length > 0 || !!labels.examples);
  const showSuggest = query.trim().length > 0 && suggestions.length > 0;
  return (
    <View style={styles.wrap} testID={testID}>
      <View style={[styles.box, { backgroundColor: theme.card, borderColor: focused ? theme.accent : theme.border }]}>
        <Text style={[styles.icon, { color: theme.textMuted }]} accessible={false}>⌕</Text>
        <TextInput
          value={query}
          onChangeText={onChangeQuery}
          onSubmitEditing={() => onSubmit?.(query)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={labels.placeholder}
          placeholderTextColor={theme.textMuted}
          style={[theme.text.body, styles.input, { color: theme.textHeading }]}
          returnKeyType="search"
          autoCorrect={false}
          // A search field, not a form: no AutoFill bubble over the examples.
          autoComplete="off"
          textContentType="none"
          autoCapitalize="characters"
          clearButtonMode="while-editing"
          accessibilityLabel={labels.placeholder}
          numberOfLines={1}
          testID={`${testID}-input`}
        />
      </View>
      {chipRow}
      {showSuggest ? (
        <View style={[styles.panel, { backgroundColor: theme.card, borderColor: theme.border }]} testID={`${testID}-suggestions`}>
          {suggestions.map((s) => (
            <Pressable key={s.key} onPress={() => { tapHaptic(); s.onPress(); }} accessibilityRole="button"
              accessibilityLabel={`${s.label}, ${labels.afterAdd(s.count)}`} style={styles.suggestRow} testID={`${testID}-suggest-${s.key}`}>
              <Text style={[theme.text.body, styles.flex, { color: theme.textHeading }]} numberOfLines={1}>＋ {s.label}</Text>
              <Text style={[theme.text.label, { color: theme.textMuted }]} numberOfLines={1}>{labels.afterAdd(s.count)}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      {showQuick ? (
        <View style={[styles.panel, { backgroundColor: theme.card, borderColor: theme.border }]} testID={`${testID}-quick`}>
          {labels.examples ? <Text style={[theme.text.label, styles.examples, { color: theme.textMuted }]} testID={`${testID}-examples`}>{labels.examples}</Text> : null}
          {recent.length ? <Text style={[theme.text.label, styles.panelTitle, { color: theme.textMuted }]}>{labels.recentTitle}</Text> : null}
          {recent.map((r) => (
            <Pressable key={r.key} onPress={r.onPress} accessibilityRole="button" style={styles.suggestRow} testID={`${testID}-recent-${r.key}`}>
              <Text style={[theme.text.body, { color: theme.textHeading }]} numberOfLines={1}>{r.label}</Text>
            </Pressable>
          ))}
          {common.length ? <Text style={[theme.text.label, styles.panelTitle, { color: theme.textMuted }]}>{labels.commonTitle}</Text> : null}
          <View style={styles.commonRow}>
            {common.map((c) => (
              <Pressable key={c.key} onPress={() => { tapHaptic(); c.onPress(); }} accessibilityRole="button"
                style={[styles.chip, { borderColor: theme.border, borderWidth: StyleSheet.hairlineWidth }]} testID={`${testID}-common-${c.key}`}>
                <Text style={[theme.text.label, styles.chipText, { color: theme.textHeading }]} numberOfLines={1}>{c.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  flex: { flex: 1, minWidth: 0 },
  box: { flexDirection: 'row', alignItems: 'center', minHeight: 44, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 10, gap: 6 },
  icon: { fontSize: 18 },
  // No fixed height: the box grows with the text size so nothing is clipped.
  input: { flex: 1, minWidth: 0, paddingVertical: 10 },
  count: { fontVariant: ['tabular-nums'], fontWeight: '600' },
  chips: { gap: 6, paddingVertical: 2 },
  chip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  chipText: { fontWeight: '600' },
  panel: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, paddingVertical: 4, paddingHorizontal: 10 },
  panelTitle: { marginTop: 6, marginBottom: 2 },
  examples: { paddingVertical: 8 },
  suggestRow: { flexDirection: 'row', alignItems: 'center', minHeight: 40, gap: 8 },
  commonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingVertical: 6 },
  compact: { flexDirection: 'row', alignItems: 'center', minHeight: 36, paddingHorizontal: 12, gap: 8, borderBottomWidth: StyleSheet.hairlineWidth },
});
