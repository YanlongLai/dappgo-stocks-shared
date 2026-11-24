import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import type { SignalsUiTheme } from './SignalsOverview';

export interface FilterChip {
  key: string;
  label: string;
  count?: number | null;
}

export interface FilterBarProps {
  chips: FilterChip[];
  selected: string;
  onSelect: (key: string) => void;
  theme: SignalsUiTheme;
  testID?: string;
}

/** One horizontally scrolling row of filter chips; labels never truncate. */
export function FilterBar({ chips, selected, onSelect, theme, testID }: FilterBarProps) {
  return (
    <ScrollView scrollsToTop={false} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row} testID={testID ?? 'signals-filter-bar'}>
      {chips.map((chip) => {
        const on = chip.key === selected;
        const label = chip.count != null ? `${chip.label} ${chip.count}` : chip.label;
        return (
          <Pressable
            key={chip.key}
            onPress={() => onSelect(chip.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            accessibilityLabel={label}
            style={[styles.chip, on ? { backgroundColor: theme.accent, borderColor: theme.accent } : { backgroundColor: theme.card, borderColor: theme.border }]}
            testID={`signals-filter-${chip.key}`}
          >
            <Text style={[theme.text.sub, styles.text, { color: on ? '#ffffff' : theme.textHeading }]} numberOfLines={1}>{label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 6, paddingVertical: 4, paddingRight: 8 },
  chip: { borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, paddingVertical: 6 },
  text: { fontWeight: '600' },
});
