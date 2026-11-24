import React from 'react';
import { Pressable, StyleSheet, Text, View, type TextStyle } from 'react-native';
import { SIGNAL_TONES, type SignalsOverview as Overview, type SignalTone } from '../../mobile/signals/model';

/** Colours and text styles the app passes in (from its own theme and the shared TILE_TYPE scale). */
export interface SignalsUiTheme {
  card: string;
  border: string;
  textHeading: string;
  textMuted: string;
  accent: string;
  up: string;
  down: string;
  tone: Record<SignalTone, string>;
  text: { label: TextStyle; value: TextStyle; sub: TextStyle };
}

export interface OverviewTile {
  key: string;
  label: string;
  value: string;
  sub?: string | null;
  valueColor?: string;
  subColor?: string;
  onPress?: () => void;
}

export interface SignalsOverviewProps {
  overview: Overview;
  theme: SignalsUiTheme;
  /** Tone labels in the app's language (「偏多」…). */
  toneLabel: (tone: SignalTone) => string;
  /** Title of the distribution tile, e.g. 「訊號分布（101 檔）」. */
  distributionTitle: string;
  /** Up to three small tiles after the distribution (up/down, top mover, app-specific). */
  tiles: OverviewTile[];
  /** Hide the distribution bar (Options has no verdicts). */
  hideDistribution?: boolean;
  testID?: string;
}

/**
 * 個股訊號 overview, built like 市場概覽: one wide distribution tile and a row
 * of small tiles. Two columns on a phone; the row wraps on wider screens.
 */
export function SignalsOverview({ overview, theme, toneLabel, distributionTitle, tiles, hideDistribution, testID }: SignalsOverviewProps) {
  const parts = SIGNAL_TONES.filter((tone) => overview.counts[tone] > 0);
  const legend = parts.map((tone) => `${toneLabel(tone)} ${overview.counts[tone]}`).join(' · ');
  return (
    <View style={styles.wrap} testID={testID ?? 'signals-overview'}>
      {!hideDistribution && parts.length > 0 ? (
        <View style={[styles.tile, styles.wide, { backgroundColor: theme.card }]} accessible accessibilityLabel={`${distributionTitle}. ${legend}`}>
          <Text style={[theme.text.label, { color: theme.textMuted }]} numberOfLines={1}>{distributionTitle}</Text>
          <View style={[styles.bar, { backgroundColor: theme.border }]} testID="signals-overview-bar">
            {parts.map((tone) => (
              <View key={tone} style={{ flex: overview.counts[tone], backgroundColor: theme.tone[tone] }} />
            ))}
          </View>
          <Text style={[theme.text.sub, { color: theme.textMuted }]} numberOfLines={2}>{legend}</Text>
        </View>
      ) : null}
      <View style={styles.row}>
        {tiles.map((tile) => {
          const body = (
            <>
              <Text style={[theme.text.label, { color: theme.textMuted }]} numberOfLines={1}>{tile.label}</Text>
              <Text style={[theme.text.value, styles.value, { color: tile.valueColor ?? theme.textHeading }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                {tile.value}
              </Text>
              {tile.sub ? <Text style={[theme.text.sub, { color: tile.subColor ?? theme.textMuted }]} numberOfLines={1}>{tile.sub}</Text> : null}
            </>
          );
          const style = [styles.tile, styles.small, { backgroundColor: theme.card }];
          return tile.onPress ? (
            <Pressable key={tile.key} style={({ pressed }) => [...style, pressed && styles.pressed]} onPress={tile.onPress}
              accessibilityRole="button" accessibilityLabel={[tile.label, tile.value, tile.sub].filter(Boolean).join(', ')} testID={`signals-overview-${tile.key}`}>
              {body}
            </Pressable>
          ) : (
            <View key={tile.key} style={style} accessible accessibilityLabel={[tile.label, tile.value, tile.sub].filter(Boolean).join(', ')} testID={`signals-overview-${tile.key}`}>
              {body}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8, marginBottom: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: { borderRadius: 16, paddingHorizontal: 12, paddingVertical: 10, minWidth: 0 },
  wide: { gap: 4 },
  small: { flexGrow: 1, flexBasis: '30%' },
  value: { marginTop: 2 },
  bar: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', marginTop: 2 },
  pressed: { opacity: 0.7 },
});
