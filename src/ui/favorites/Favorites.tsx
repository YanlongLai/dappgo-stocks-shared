import React, { memo, type ReactElement } from 'react';
import { PressableCard, TapHint } from '../tiles/PressableCard';
import { Pressable, ScrollView, StyleSheet, Text, View, type TextStyle } from 'react-native';
import type { FavoriteEvent } from '../../mobile/favorites/history';
import {
  FAVORITE_SORTS,
  pcHeaviness,
  type FavoriteSort,
  type FavoriteTone,
  type FavoriteView,
  type FavoriteZone,
} from '../../mobile/favorites/model';

/** Colours and text styles the app passes in (its theme + the shared TILE_TYPE scale). */
export interface FavoritesTheme {
  card: string;
  border: string;
  textHeading: string;
  textMuted: string;
  accent: string;
  onAccent: string;
  up: string;
  down: string;
  risk: string;
  tone: Record<FavoriteTone, string>;
  zone: Record<FavoriteZone, string>;
  text: { label: TextStyle; value: TextStyle; sub: TextStyle; rowTitle: TextStyle; mono: TextStyle };
}

export interface FavoritesLabels {
  sinceLastVisit: (at: string | null) => string;
  noChanges: (at: string | null) => string;
  firstVisit: string;
  event: (event: FavoriteEvent, name: string) => string;
  eventTag: (event: FavoriteEvent) => string;
  sort: (sort: FavoriteSort) => string;
  added: (date: string) => string;
  days: (n: number) => string;
  sinceAdded: (pct: string) => string;
  sinceAddedUnknown: string;
  tone: (tone: FavoriteTone) => string;
  zone: (zone: FavoriteZone) => string;
  risk: (risk: 'disposition' | 'attention') => string;
  pc: (ratio: string, heavy: 'put' | 'call' | null) => string;
  news: (count: number) => string;
  recentTitle: string;
  addRecent: (symbol: string) => string;
  formatPct: (value: number) => string;
  formatPrice: (value: number) => string;
  formatDate: (iso: string) => string;
}

const signColor = (theme: FavoritesTheme, v: number | null) => (v === null || v === 0 ? theme.textMuted : v > 0 ? theme.up : theme.down);

/** 上次之後: the few things that changed for the user's stocks, most consequential first. */
export function SinceLastVisitTile({ events, lastVisitAt, names, theme, labels, onPressSymbol, limit = 5 }: {
  events: readonly FavoriteEvent[];
  lastVisitAt: string | null;
  names: Record<string, string>;
  theme: FavoritesTheme;
  labels: FavoritesLabels;
  onPressSymbol?: (symbol: string) => void;
  limit?: number;
}) {
  const shown = events.slice(0, limit);
  return (
    <View style={[styles.tile, { backgroundColor: theme.card }]} testID="favorites-since-last-visit">
      <Text style={[theme.text.label, { color: theme.accent }]} numberOfLines={1}>
        {events.length ? labels.sinceLastVisit(lastVisitAt) : lastVisitAt ? labels.noChanges(lastVisitAt) : labels.firstVisit}
      </Text>
      {shown.map((event, i) => {
        const tag = labels.eventTag(event);
        const tagColor = event.kind === 'bigMove' && typeof event.to === 'number' ? signColor(theme, event.to)
          : event.kind === 'risk' ? theme.risk : theme.accent;
        return (
          <Pressable
            key={`${event.symbol}-${event.kind}-${i}`}
            onPress={onPressSymbol ? () => onPressSymbol(event.symbol) : undefined}
            accessibilityRole={onPressSymbol ? 'button' : undefined}
            style={({ pressed }) => [styles.eventRow, pressed && styles.pressed]}
            testID={`favorites-event-${event.symbol}-${event.kind}`}
          >
            <Text style={[theme.text.sub, styles.eventTag, { color: tagColor }]} numberOfLines={1}>{tag}</Text>
            <Text style={[theme.text.sub, styles.flex, { color: theme.textHeading }]} numberOfLines={2}>
              {labels.event(event, names[event.symbol] ?? event.symbol)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** One line of the user's own record plus today's key readings, as small tags. */
export function FavoriteFacts({ item, theme, labels }: { item: FavoriteView; theme: FavoritesTheme; labels: FavoritesLabels }) {
  const record = [
    item.addedAt ? labels.added(labels.formatDate(item.addedAt)) : null,
    item.daysHeld !== null ? labels.days(item.daysHeld) : null,
  ].filter(Boolean).join(' · ');
  const heavy = pcHeaviness(item.pcRatio);
  const tags: Array<{ key: string; text: string; color: string }> = [];
  if (item.risk) tags.push({ key: 'risk', text: labels.risk(item.risk), color: theme.risk });
  if (item.tone) tags.push({ key: 'tone', text: labels.tone(item.tone), color: theme.tone[item.tone] });
  if (item.zone) tags.push({ key: 'zone', text: labels.zone(item.zone), color: theme.zone[item.zone] });
  if (item.pcRatio !== null) tags.push({ key: 'pc', text: labels.pc(item.pcRatio.toFixed(2), heavy), color: heavy === 'put' ? theme.down : heavy === 'call' ? theme.up : theme.textMuted });
  if (item.newsCount > 0) tags.push({ key: 'news', text: labels.news(item.newsCount), color: theme.textMuted });
  return (
    <View style={styles.facts}>
      <View style={styles.recordLine}>
        <Text style={[theme.text.label, styles.flex, { color: theme.textMuted }]} numberOfLines={1}>{record}</Text>
        <Text
          style={[theme.text.label, styles.sinceAdded, { color: signColor(theme, item.sinceAddedPct) }]}
          numberOfLines={1}
          testID={`favorite-since-added-${item.symbol}`}
        >
          {item.sinceAddedPct !== null ? labels.sinceAdded(labels.formatPct(item.sinceAddedPct)) : labels.sinceAddedUnknown}
        </Text>
      </View>
      {tags.length ? (
        <View style={styles.tags}>
          {tags.map((tag) => (
            <View key={tag.key} style={[styles.tag, { borderColor: tag.color }]}>
              <Text style={[theme.text.label, { color: tag.color }]} numberOfLines={1}>{tag.text}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** A favorite as one tile: symbol, name and price, the record line, tags, and the latest headline. */
export const FavoriteTile = memo(function FavoriteTile({ item, theme, labels, onPress, trailing, accessibilityHint }: {
  item: FavoriteView;
  theme: FavoritesTheme;
  labels: FavoritesLabels;
  onPress: (symbol: string) => void;
  /** e.g. the app's star toggle. */
  trailing?: ReactElement | null;
  /** Where a tap goes (screen readers), e.g. 「打開台積電個股頁」. */
  accessibilityHint?: string;
}) {
  return (
    <PressableCard
      onPress={() => onPress(item.symbol)}
      accessibilityLabel={`${item.symbol} ${item.name}`}
      accessibilityHint={accessibilityHint ?? item.name}
      style={[styles.itemTile, { backgroundColor: theme.card }]}
      testID={`favorite-tile-${item.symbol}`}
    >
      <View style={styles.head}>
        <View style={styles.names}>
          <Text style={[theme.text.rowTitle, styles.symbol, { color: theme.textHeading }]} numberOfLines={1}>{item.symbol}</Text>
          <Text style={[theme.text.sub, { color: theme.textMuted }]} numberOfLines={1}>{item.name}</Text>
        </View>
        <View style={styles.price}>
          <Text style={[theme.text.mono, { color: theme.textHeading }]} numberOfLines={1}>{item.price !== null ? labels.formatPrice(item.price) : '—'}</Text>
          <Text style={[theme.text.label, { color: signColor(theme, item.changePct) }]} numberOfLines={1}>
            {item.changePct !== null ? labels.formatPct(item.changePct) : '—'}
          </Text>
        </View>
        {trailing ?? null}
        <TapHint color={theme.textMuted} />
      </View>
      <FavoriteFacts item={item} theme={theme} labels={labels} />
      {item.headline ? (
        <Text style={[theme.text.sub, { color: theme.textMuted }]} numberOfLines={1}>{item.headline}</Text>
      ) : null}
    </PressableCard>
  );
});

export function FavoriteSortChips({ value, onChange, theme, labels, sorts = FAVORITE_SORTS }: {
  value: FavoriteSort;
  onChange: (sort: FavoriteSort) => void;
  theme: FavoritesTheme;
  labels: FavoritesLabels;
  sorts?: readonly FavoriteSort[];
}) {
  return (
    <ScrollView scrollsToTop={false} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} testID="favorites-sort">
      {sorts.map((sort) => {
        const on = sort === value;
        return (
          <Pressable
            key={sort}
            onPress={() => onChange(sort)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={[styles.chip, on ? { backgroundColor: theme.accent, borderColor: theme.accent } : { backgroundColor: theme.card, borderColor: theme.border }]}
            testID={`favorites-sort-${sort}`}
          >
            <Text style={[theme.text.sub, styles.chipText, { color: on ? theme.onAccent : theme.textHeading }]} numberOfLines={1}>{labels.sort(sort)}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/** 最近看過: stocks viewed but not in 我的最愛; one tap adds, a long press opens. */
export function RecentlyViewed({ symbols, onAdd, onOpen, theme, labels }: {
  symbols: readonly string[];
  onAdd: (symbol: string) => void;
  onOpen?: (symbol: string) => void;
  theme: FavoritesTheme;
  labels: FavoritesLabels;
}) {
  if (!symbols.length) return null;
  return (
    <View style={styles.recent} testID="favorites-recent">
      <Text style={[theme.text.label, { color: theme.textMuted }]}>{labels.recentTitle}</Text>
      <View style={styles.recentChips}>
        {symbols.map((symbol) => (
          <Pressable
            key={symbol}
            onPress={() => onAdd(symbol)}
            onLongPress={onOpen ? () => onOpen(symbol) : undefined}
            accessibilityRole="button"
            accessibilityLabel={labels.addRecent(symbol)}
            style={({ pressed }) => [styles.chip, { backgroundColor: theme.card, borderColor: theme.border }, pressed && styles.pressed]}
            testID={`favorites-recent-${symbol}`}
          >
            <Text style={[theme.text.sub, styles.chipText, { color: theme.textHeading }]}>{symbol} ＋</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.6 },
  tile: { borderRadius: 18, padding: 12, gap: 6, marginBottom: 8 },
  eventRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 2 },
  eventTag: { minWidth: 52, fontWeight: '700' },
  itemTile: { borderRadius: 18, padding: 12, gap: 6, marginBottom: 8 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  names: { flex: 1, minWidth: 0, gap: 1 },
  symbol: { fontWeight: '700' },
  price: { alignItems: 'flex-end', gap: 1, flexShrink: 0 },
  facts: { gap: 6 },
  recordLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sinceAdded: { fontWeight: '700', flexShrink: 0 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  chips: { gap: 6, paddingVertical: 4, paddingRight: 8 },
  chip: { borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { fontWeight: '600' },
  recent: { gap: 6, marginTop: 4, marginBottom: 8 },
  recentChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
