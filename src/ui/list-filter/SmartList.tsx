import React, { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import {
  FlatList, Pressable, ScrollView, StyleSheet, Text, View,
  type LayoutChangeEvent, type ListRenderItemInfo, type NativeScrollEvent, type NativeSyntheticEvent, type RefreshControlProps,
  type StyleProp, type ViewStyle,
} from 'react-native';
import { chipKey, groupItems, type FilterChip, type ListConfig, type ListFilter, type ListItem, type SortKey } from '../../mobile/list-filter/model';
import { tapHaptic } from '../tiles/PressableCard';
import { DistributionBar, type DistributionTheme } from './DistributionBar';
import { SmartSearchBar, type SearchLabels, type SearchTheme } from './SmartSearchBar';
import { useListFilter } from './useListFilter';

export type SmartListTheme = Omit<SearchTheme, 'text'> & Omit<DistributionTheme, 'text'> & { text: SearchTheme['text'] & DistributionTheme['text'] };

export interface SmartListLabels extends SearchLabels {
  favorites: string;
  noResults: string;
  clearFilters: string;
  /** 「再看 N 檔」 */
  showMore: (n: number) => string;
  showLess: string;
  otherGroup: string;
}

type Item =
  | { type: 'group'; key: string; title: string; total: number }
  | { type: 'row'; key: string; item: ListItem }
  | { type: 'more'; key: string; group: string; hidden: number; open: boolean };

/**
 * A big list with the 1.12.0 controls (plan §3.3–3.4): distribution bar and
 * smart search sharing one filter, sort chips, optional industry sections of
 * 5 with 「再看 N 檔」 and a side index, a thin bar while scrolling down, and
 * the filter + scroll position handed back to be remembered.
 */
export function SmartList({
  items, cfg, segments, defaultSort, sortOptions, renderRow, rowHeight, fixedRows = true, groupBy, theme, labels, header, footer, refreshControl,
  initialFilter, initialOffset, onStateChange, recentSearches = [], commonChips = [], rankChip, onSearchSubmit, onUse, contentContainerStyle, onScrollExtra, testID = 'smart-list',
}: {
  items: readonly ListItem[];
  cfg: ListConfig;
  segments: readonly { key: string; label: string; color: string }[];
  defaultSort: SortKey;
  sortOptions: readonly { key: SortKey; label: string }[];
  renderRow: (item: ListItem) => ReactElement;
  /** Row height: exact when `fixedRows` (getItemLayout), else an estimate for index jumps. */
  rowHeight: number;
  /** Rows all have rowHeight (fast scrolling); false for rows that size themselves. */
  fixedRows?: boolean;
  groupBy?: { dim: string; perGroup?: number; title?: (v: string) => string } | null;
  theme: SmartListTheme;
  labels: SmartListLabels;
  header?: ReactElement | null;
  footer?: ReactElement | null;
  refreshControl?: ReactElement<RefreshControlProps>;
  initialFilter?: ListFilter | null;
  initialOffset?: number;
  onStateChange?: (filter: ListFilter, offset: number) => void;
  recentSearches?: readonly string[];
  commonChips?: readonly { chip: FilterChip; label: string }[];
  rankChip?: (chip: FilterChip) => number;
  onSearchSubmit?: (query: string) => void;
  onUse?: (key: string) => void;
  /** e.g. a collapsible screen header's padding and scroll handler. */
  contentContainerStyle?: StyleProp<ViewStyle>;
  onScrollExtra?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  testID?: string;
}) {
  const f = useListFilter(items, cfg, { initial: initialFilter, defaultSort, rankChip, onUse });
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const [headerHeight, setHeaderHeight] = useState(0);
  const [compact, setCompact] = useState(false);
  const listRef = useRef<FlatList<Item>>(null);
  const offset = useRef(initialOffset ?? 0);
  const lastY = useRef(0);

  const GROUP_H = 40;
  const MORE_H = 44;
  const rowsAndGroups = useMemo<Item[]>(() => {
    if (!groupBy) return f.results.map((it) => ({ type: 'row' as const, key: it.symbol, item: it }));
    const out: Item[] = [];
    for (const g of groupItems(f.results, groupBy.dim, { perGroup: groupBy.perGroup ?? 5, expanded, otherTitle: labels.otherGroup, title: groupBy.title })) {
      out.push({ type: 'group', key: `g:${g.key}`, title: g.title, total: g.total });
      for (const it of g.items) out.push({ type: 'row', key: it.symbol, item: it });
      if (g.total > (groupBy.perGroup ?? 5)) out.push({ type: 'more', key: `m:${g.key}`, group: g.key, hidden: g.hidden, open: expanded.has(g.key) });
    }
    return out;
  }, [f.results, groupBy, expanded, labels.otherGroup]);

  const offsets = useMemo(() => {
    const o = [0];
    for (const it of rowsAndGroups) o.push(o[o.length - 1] + (it.type === 'row' ? rowHeight : it.type === 'group' ? GROUP_H : MORE_H));
    return o;
  }, [rowsAndGroups, rowHeight]);

  const groupIndex = useMemo(() => rowsAndGroups.flatMap((it, index) => (it.type === 'group' ? [{ title: it.title, index }] : [])), [rowsAndGroups]);

  // Hand the filter and scroll offset back (debounced by the caller's store being cheap).
  useEffect(() => { onStateChange?.(f.filter, offset.current); }, [f.filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const restored = useRef(false);
  const onContentSizeChange = useCallback(() => {
    if (restored.current || !initialOffset) return;
    restored.current = true;
    listRef.current?.scrollToOffset({ offset: initialOffset, animated: false });
  }, [initialOffset]);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const down = y > lastY.current;
    lastY.current = y;
    offset.current = y;
    // Thin bar while reading down the list; the full bar comes back when scrolling up.
    setCompact(y > headerHeight && down);
    onScrollExtra?.(e);
  }, [headerHeight, onScrollExtra]);
  const onScrollEnd = useCallback(() => { onStateChange?.(f.filter, offset.current); }, [onStateChange, f.filter]);

  const toggleGroup = useCallback((group: string) => {
    setExpanded((cur) => { const next = new Set(cur); if (next.has(group)) next.delete(group); else next.add(group); return next; });
  }, []);

  const renderItem = useCallback(({ item }: ListRenderItemInfo<Item>) => {
    if (item.type === 'row') return renderRow(item.item);
    if (item.type === 'group') {
      return (
        <View style={[styles.group, { height: GROUP_H, backgroundColor: theme.background, borderBottomColor: theme.border }]} testID={`${testID}-group-${item.title}`}>
          <Text style={[theme.text.body, styles.groupTitle, { color: theme.textHeading }]} numberOfLines={1}>{item.title}</Text>
          <Text style={[theme.text.label, { color: theme.textMuted }]}>{item.total}</Text>
        </View>
      );
    }
    return (
      <Pressable onPress={() => { tapHaptic(); toggleGroup(item.group); }} accessibilityRole="button" style={[styles.more, { height: MORE_H }]} testID={`${testID}-more-${item.group}`}>
        <Text style={[theme.text.label, styles.moreText, { color: theme.accent }]}>{item.open ? labels.showLess : labels.showMore(item.hidden)}</Text>
      </Pressable>
    );
  }, [renderRow, theme, labels, toggleGroup, testID]);

  const getItemLayout = useCallback((_: unknown, index: number) => ({
    length: offsets[index + 1] - offsets[index], offset: headerHeight + offsets[index], index,
  }), [offsets, headerHeight]);

  const search = (
    <SmartSearchBar
      query={f.filter.query}
      onChangeQuery={f.setQuery}
      onSubmit={(q) => onSearchSubmit?.(q)}
      chips={f.activeChips.map((c) => ({ key: c.key, label: c.label, onRemove: () => f.remove(c.chip) }))}
      suggestions={f.suggestions.map((s) => ({ key: chipKey(s.chip), label: s.label, count: s.count, onPress: () => f.add(s.chip) }))}
      resultCount={f.results.length}
      recent={recentSearches.map((q) => ({ key: q, label: q, onPress: () => f.setQuery(q) }))}
      common={commonChips.map((c) => ({ key: chipKey(c.chip), label: c.label, onPress: () => f.add(c.chip) }))}
      theme={theme}
      labels={labels}
      testID={`${testID}-search`}
    />
  );
  const listHeader = (
    <View onLayout={(e: LayoutChangeEvent) => setHeaderHeight(e.nativeEvent.layout.height)}>
      {header}
      <View style={styles.controls}>
        {search}
        <DistributionBar
          segments={f.segments.map((s) => {
            const spec = segments.find((x) => x.key === s.segment);
            return { key: s.segment, label: spec?.label ?? s.segment, color: spec?.color ?? theme.textMuted, count: s.count };
          })}
          selected={f.filter.segment}
          onSelect={f.selectSegment}
          favorites={{ label: labels.favorites, count: f.favorites, on: f.filter.favoritesOnly, onToggle: f.toggleFavorites }}
          theme={theme}
          testID={`${testID}-bar`}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sorts} testID={`${testID}-sorts`}>
          {sortOptions.map((o) => {
            const on = f.filter.sort === o.key;
            return (
              <Pressable key={o.key} onPress={() => { tapHaptic(); f.setSort(o.key); }} accessibilityRole="button" accessibilityState={{ selected: on }}
                style={[styles.sort, on ? { backgroundColor: theme.accent, borderColor: theme.accent } : { backgroundColor: theme.card, borderColor: theme.border }]}
                testID={`${testID}-sort-${o.key}`}>
                <Text style={[theme.text.label, styles.sortText, { color: on ? theme.onAccent : theme.textHeading }]} numberOfLines={1}>{o.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
  const empty = (
    <View style={styles.empty} testID={`${testID}-empty`}>
      <Text style={[theme.text.body, { color: theme.textMuted }]}>{labels.noResults}</Text>
      <Pressable onPress={f.reset} accessibilityRole="button" style={styles.clear}>
        <Text style={[theme.text.label, { color: theme.accent }]}>{labels.clearFilters}</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.flex} testID={testID}>
      <FlatList
        ref={listRef}
        data={rowsAndGroups}
        keyExtractor={(it) => it.key}
        renderItem={renderItem}
        getItemLayout={fixedRows ? getItemLayout : undefined}
        onScrollToIndexFailed={({ index }) => listRef.current?.scrollToOffset({ offset: headerHeight + (offsets[index] ?? 0), animated: false })}
        ListHeaderComponent={listHeader}
        ListFooterComponent={footer}
        ListEmptyComponent={empty}
        refreshControl={refreshControl}
        onScroll={onScroll}
        onMomentumScrollEnd={onScrollEnd}
        onScrollEndDrag={onScrollEnd}
        onContentSizeChange={onContentSizeChange}
        scrollEventThrottle={32}
        initialNumToRender={14}
        maxToRenderPerBatch={20}
        windowSize={9}
        removeClippedSubviews
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        style={{ backgroundColor: theme.background }}
        contentContainerStyle={contentContainerStyle}
      />
      {compact ? (
        <View style={styles.compactWrap} pointerEvents="box-none">
          <SmartSearchBar {...search.props} compact onExpand={() => listRef.current?.scrollToOffset({ offset: 0, animated: true })} />
        </View>
      ) : null}
      {groupBy && groupIndex.length > 5 ? (
        <View style={styles.index} pointerEvents="box-none" testID={`${testID}-index`}>
          <ScrollView contentContainerStyle={styles.indexInner} showsVerticalScrollIndicator={false}>
            {groupIndex.map((g) => (
              <Pressable key={g.index} onPress={() => { tapHaptic(); listRef.current?.scrollToIndex({ index: g.index, animated: false }); }}
                accessibilityRole="button" accessibilityLabel={g.title} hitSlop={{ left: 12, right: 4 }} testID={`${testID}-index-${g.title}`}>
                <Text style={[styles.indexText, { color: theme.accent }]} numberOfLines={1}>{[...g.title].slice(0, 2).join('')}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  controls: { gap: 10, paddingHorizontal: 16, paddingBottom: 8 },
  sorts: { gap: 6, paddingVertical: 2 },
  sort: { borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, paddingVertical: 6 },
  sortText: { fontWeight: '600' },
  group: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth, gap: 8 },
  groupTitle: { flex: 1, fontWeight: '700' },
  more: { justifyContent: 'center', paddingHorizontal: 16 },
  moreText: { fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  clear: { minHeight: 40, justifyContent: 'center' },
  compactWrap: { position: 'absolute', top: 0, left: 0, right: 0 },
  index: { position: 'absolute', right: 0, top: 120, bottom: 80, width: 30, justifyContent: 'center' },
  indexInner: { alignItems: 'center', gap: 2, paddingVertical: 4 },
  indexText: { fontSize: 10, fontWeight: '700' },
});
