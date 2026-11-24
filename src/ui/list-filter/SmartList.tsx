import React, { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import {
  Animated, FlatList, Pressable, useWindowDimensions, StyleSheet, Text, View,
  type LayoutChangeEvent, type ListRenderItemInfo, type NativeScrollEvent, type NativeSyntheticEvent, type RefreshControlProps,
  type StyleProp, type ViewStyle, type ViewToken,
} from 'react-native';
import { chipKey, groupItems, type FilterChip, type ListConfig, type ListFilter, type ListItem, type SortKey } from '../../mobile/list-filter/model';
import { tapHaptic } from '../tiles/PressableCard';
import { DistributionBar, type DistributionTheme } from './DistributionBar';
import { ResultLine } from './ResultLine';
import { IndustryChipRow, IndustrySheet, type IndustryGroup, type IndustryJumpLabels } from './IndustryJump';
import { SmartSearchBar, type SearchLabels, type SearchTheme } from './SmartSearchBar';
import { useListFilter } from './useListFilter';

export type SmartListTheme = Omit<SearchTheme, 'text'> & Omit<DistributionTheme, 'text'> & { text: SearchTheme['text'] & DistributionTheme['text'] };

export interface SmartListLabels extends SearchLabels, IndustryJumpLabels {
  /** 「依離區間邊界排序」 */
  sortedBy: (sortLabel: string) => string;
  /** Title of the sort menu, 「排序方式」 */
  sortMenuTitle: string;
  favorites: string;
  noResults: string;
  clearFilters: string;
  /** 「再看 N 檔」 */
  showMore: (n: number) => string;
  showLess: string;
  otherGroup: string;
}

type Item =
  | { type: 'group'; key: string; group: string; title: string; total: number }
  | { type: 'row'; key: string; item: ListItem }
  | { type: 'more'; key: string; group: string; hidden: number; open: boolean };

/**
 * A big list with the shared controls: smart search and distribution bar on
 * one filter; under the bar one small line 「1,097 檔 · 依離區間邊界排序 ▾」 that
 * opens the sort menu; optional industry sections of 5 with 「再看 N 檔」.
 *
 * Industries (1.12.1, replaces the side index): a horizontally scrolling chip
 * row (「全部產業」 + each industry by size, full name and count). A tap jumps to
 * that section and highlights it; a second tap clears it. 「全部產業」 opens a
 * bottom sheet (two-column grid, 「找產業」 search). While scrolling, the chip
 * row and the current section title stay pinned at the top; tapping the title
 * opens the same sheet. Rows use the full width.
 */
export function SmartList({
  items, cfg, segments, defaultSort, sortOptions, renderRow, rowHeight, fixedRows = true, groupBy, theme, labels, header, footer, refreshControl,
  initialFilter, initialOffset, onStateChange, recentSearches = [], commonChips = [], rankChip, onSearchSubmit, onUse, contentContainerStyle, onScrollExtra, pinTop = 0, pinTranslateY, testID = 'smart-list',
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
  /** Where the pinned industry row sits: below a collapsible screen header… */
  pinTop?: number;
  /** …and that header's (native-driven) translateY, so the row follows it. */
  pinTranslateY?: Animated.Value | Animated.AnimatedInterpolation<number>;
  testID?: string;
}) {
  const f = useListFilter(items, cfg, { initial: initialFilter, defaultSort, rankChip, onUse });
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const [headerHeight, setHeaderHeight] = useState(0);
  const [compact, setCompact] = useState(false);
  const [headerY, setHeaderY] = useState(0);
  const [chipsY, setChipsY] = useState<number | null>(null);
  const [pinned, setPinned] = useState(false);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [currentGroup, setCurrentGroup] = useState<number | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [chipsH, setChipsH] = useState(46);
  const listRef = useRef<FlatList<Item>>(null);
  const offset = useRef(initialOffset ?? 0);
  const lastY = useRef(0);

  // Section and 「再看」 rows grow with the text size so titles are never clipped.
  const textScale = Math.min(Math.max(useWindowDimensions().fontScale || 1, 1), 3.2);
  const GROUP_H = Math.round(40 * textScale);
  const MORE_H = Math.round(44 * textScale);
  const rowsAndGroups = useMemo<Item[]>(() => {
    if (!groupBy) return f.results.map((it) => ({ type: 'row' as const, key: it.symbol, item: it }));
    const out: Item[] = [];
    for (const g of groupItems(f.results, groupBy.dim, { perGroup: groupBy.perGroup ?? 5, expanded, otherTitle: labels.otherGroup, title: groupBy.title })) {
      out.push({ type: 'group', key: `g:${g.key}`, group: g.key, title: g.title, total: g.total });
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

  /** Index of each section header in the list, for jumps. */
  const groupIndex = useMemo(() => {
    const m = new Map<string, number>();
    rowsAndGroups.forEach((it, index) => { if (it.type === 'group') m.set(it.group, index); });
    return m;
  }, [rowsAndGroups]);
  /** For every list index, the index of the section it belongs to. */
  const sectionOf = useMemo(() => {
    let cur = -1;
    return rowsAndGroups.map((it, index) => { if (it.type === 'group') cur = index; return cur; });
  }, [rowsAndGroups]);
  const industries = useMemo<IndustryGroup[]>(
    () => rowsAndGroups.flatMap((it) => (it.type === 'group' ? [{ key: it.group, title: it.title, count: it.total }] : [])),
    [rowsAndGroups],
  );
  const showIndustries = !!groupBy && industries.length > 1;
  useEffect(() => { if (activeGroup && !groupIndex.has(activeGroup)) setActiveGroup(null); }, [activeGroup, groupIndex]);

  const jumpTo = useCallback((group: string | null) => {
    setActiveGroup(group);
    if (!group) return;
    const index = groupIndex.get(group);
    if (index == null) return;
    setCurrentGroup(index);
    listRef.current?.scrollToIndex({ index, animated: false, viewOffset: pinTop + chipsH });
  }, [groupIndex, chipsH, pinTop]);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 1 }).current;
  const sectionOfRef = useRef(sectionOf);
  sectionOfRef.current = sectionOf;
  const fixedRef = useRef(fixedRows);
  fixedRef.current = fixedRows;
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (fixedRef.current) return; // exact offsets are used instead (onScroll)
    const first = viewableItems.find((v) => v.index != null);
    if (!first || first.index == null) return;
    const sec = sectionOfRef.current[first.index];
    setCurrentGroup(sec != null && sec >= 0 ? sec : null);
  }).current;

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
    // Industry lists pin the chip row + section title once the row scrolls away;
    // other lists show a thin search bar while reading down.
    if (showIndustries) {
      const pin = chipsY != null && y > headerY + chipsY;
      setPinned(pin);
      // The section under the pinned row's bottom edge is the current one. With
      // fixed rows the offsets are exact; otherwise viewability is the fallback.
      if (pin && fixedRows) {
        const target = y + pinTop + chipsH + GROUP_H - (headerY + headerHeight);
        let lo = 0, hi = offsets.length - 2;
        while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (offsets[mid] <= target) lo = mid; else hi = mid - 1; }
        const sec = sectionOf[lo];
        setCurrentGroup(sec != null && sec >= 0 ? sec : null);
      }
    }
    else setCompact(y > headerHeight && down);
    onScrollExtra?.(e);
  }, [headerHeight, onScrollExtra, showIndustries, chipsY, headerY, fixedRows, pinTop, chipsH, offsets, sectionOf]);
  const onScrollEnd = useCallback(() => { onStateChange?.(f.filter, offset.current); }, [onStateChange, f.filter]);

  const toggleGroup = useCallback((group: string) => {
    setExpanded((cur) => { const next = new Set(cur); if (next.has(group)) next.delete(group); else next.add(group); return next; });
  }, []);

  function sectionHeader(item: Extract<Item, { type: 'group' }>, pinnedCopy = false) {
    const on = activeGroup === item.group;
    return (
      <Pressable
        onPress={showIndustries ? () => { tapHaptic(); setSheetOpen(true); } : undefined}
        disabled={!showIndustries}
        accessibilityRole={showIndustries ? 'button' : 'header'}
        accessibilityLabel={`${item.title} ${item.total}`}
        accessibilityHint={showIndustries ? labels.allIndustries : undefined}
        style={[styles.group, { height: GROUP_H, backgroundColor: on ? theme.card : theme.background, borderBottomColor: on ? theme.accent : theme.border }]}
        testID={pinnedCopy ? `${testID}-pinned-group` : `${testID}-group-${item.title}`}
      >
        {on ? <View style={[styles.groupMark, { backgroundColor: theme.accent }]} /> : null}
        <Text style={[theme.text.body, styles.groupTitle, { color: on ? theme.accent : theme.textHeading }]} numberOfLines={1}>{item.title}</Text>
        <Text style={[theme.text.label, { color: theme.textMuted }]}>{item.total}</Text>
        {showIndustries ? <Text style={[theme.text.label, { color: theme.textMuted }]} accessible={false}>▾</Text> : null}
      </Pressable>
    );
  }

  const renderItem = useCallback(({ item }: ListRenderItemInfo<Item>) => {
    if (item.type === 'row') return renderRow(item.item);
    if (item.type === 'group') return sectionHeader(item);
    return (
      <Pressable onPress={() => { tapHaptic(); toggleGroup(item.group); }} accessibilityRole="button" style={[styles.more, { height: MORE_H }]} testID={`${testID}-more-${item.group}`}>
        <Text style={[theme.text.label, styles.moreText, { color: theme.accent }]}>{item.open ? labels.showLess : labels.showMore(item.hidden)}</Text>
      </Pressable>
    );
  }, [renderRow, theme, labels, toggleGroup, testID, activeGroup, showIndustries]); // eslint-disable-line react-hooks/exhaustive-deps

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
  const chipRow = showIndustries ? (
    <IndustryChipRow groups={industries} active={activeGroup} onJump={jumpTo} onOpenAll={() => setSheetOpen(true)} theme={theme} labels={labels} testID={`${testID}-industries`} />
  ) : null;
  const listHeader = (
    <View onLayout={(e: LayoutChangeEvent) => { setHeaderHeight(e.nativeEvent.layout.height); setHeaderY(e.nativeEvent.layout.y); }}>
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
        <ResultLine count={f.results.length} sorts={sortOptions} sort={f.filter.sort} onSort={(k) => f.setSort(k as SortKey)} theme={theme} labels={labels} testID={`${testID}-result-line`} />
      </View>
      {chipRow ? (
        <View onLayout={(e: LayoutChangeEvent) => { setChipsY(e.nativeEvent.layout.y); setChipsH(e.nativeEvent.layout.height); }}>{chipRow}</View>
      ) : null}
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
        onScrollToIndexFailed={({ index }) => listRef.current?.scrollToOffset({ offset: headerY + headerHeight + (offsets[index] ?? 0) - chipsH, animated: false })}
        ListHeaderComponent={listHeader}
        ListFooterComponent={footer}
        ListEmptyComponent={empty}
        refreshControl={refreshControl}
        onScroll={onScroll}
        onMomentumScrollEnd={onScrollEnd}
        onScrollEndDrag={onScrollEnd}
        onContentSizeChange={onContentSizeChange}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
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
      {pinned && chipRow && pinTop > 0 && !pinTranslateY ? (
        // Nothing sits above the list (its header scrolled away): cover the status bar strip.
        <View style={[styles.pinBackdrop, { height: pinTop, backgroundColor: theme.background }]} pointerEvents="none" />
      ) : null}
      {pinned && chipRow ? (
        <Animated.View style={[styles.pinned, { top: pinTop, transform: pinTranslateY ? [{ translateY: pinTranslateY }] : [] }]} pointerEvents="box-none" testID={`${testID}-pinned`}>
          {chipRow}
          {currentGroup != null && rowsAndGroups[currentGroup]?.type === 'group'
            ? sectionHeader(rowsAndGroups[currentGroup] as Extract<Item, { type: 'group' }>, true)
            : null}
        </Animated.View>
      ) : null}
      {showIndustries ? (
        <IndustrySheet
          visible={sheetOpen}
          groups={industries}
          onPick={(key) => { setSheetOpen(false); jumpTo(key); }}
          onClose={() => setSheetOpen(false)}
          theme={theme}
          labels={labels}
          testID={`${testID}-industry-sheet`}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  controls: { gap: 8, paddingHorizontal: 16, paddingBottom: 2 },
  group: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth, gap: 8 },
  groupTitle: { flex: 1, fontWeight: '700' },
  groupMark: { position: 'absolute', left: 0, top: 8, bottom: 8, width: 3, borderRadius: 2 },
  more: { justifyContent: 'center', paddingHorizontal: 16 },
  moreText: { fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  clear: { minHeight: 40, justifyContent: 'center' },
  compactWrap: { position: 'absolute', top: 0, left: 0, right: 0 },
  pinned: { position: 'absolute', left: 0, right: 0 },
  pinBackdrop: { position: 'absolute', top: 0, left: 0, right: 0 },
});
