import React, { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type LayoutChangeEvent,
  type ListRenderItemInfo,
  useWindowDimensions,
  type TextStyle,
  type RefreshControlProps,
} from 'react-native';
import { VALUATION_ZONES, type ValuationZone } from '../../mobile/valuation/valuation-v2';
import {
  createValuationListSelector,
  favoriteValuationRows,
  summarizeValuationRows,
  valuationIndustries,
  valuationItemOffsets,
  valuationListItems,
  ZONE_TABS,
  type ValuationListItem,
  type ValuationListRow,
  type ValuationListSort,
  type ValuationMarket,
  type ValuationRisk,
  type ZoneTab,
} from '../../mobile/valuation-list/model';

/** Fixed heights: the list never measures a row. They grow with Dynamic Type (capped) so large text never clips. */
export const VALUATION_ROW_HEIGHT = 60;
export const VALUATION_GROUP_HEIGHT = 40;
const MAX_ROW_SCALE = 2;
/** From this text scale a row stacks into two lines instead of truncating. */
export const VALUATION_STACK_SCALE = 1.5;
const MAX_STACK_SCALE = 3.2;

export function valuationRowHeights(fontScale: number): { row: number; group: number; stacked: boolean } {
  const f = Math.max(fontScale || 1, 1);
  if (f >= VALUATION_STACK_SCALE) {
    // Two lines (code + name, then zone + numbers) of roughly 2 text lines each.
    const s = Math.min(f, MAX_STACK_SCALE);
    return { row: Math.round(26 + 4 * 21 * s), group: Math.round(VALUATION_GROUP_HEIGHT * s), stacked: true };
  }
  const scale = Math.min(f, MAX_ROW_SCALE);
  return { row: Math.round(VALUATION_ROW_HEIGHT * scale), group: Math.round(VALUATION_GROUP_HEIGHT * scale), stacked: false };
}
/** Favourites shown before 「顯示全部」. */
const FAVORITES_PREVIEW = 8;
const SEARCH_DEBOUNCE_MS = 200;

export interface ValuationListTheme {
  background: string;
  card: string;
  border: string;
  textHeading: string;
  textMuted: string;
  accent: string;
  /** Text on an accent background. */
  onAccent: string;
  star: string;
  risk: string;
  zone: Record<ValuationZone, string>;
  text: { label: TextStyle; value: TextStyle; sub: TextStyle; body: TextStyle; mono: TextStyle };
}

export interface ValuationListLabels {
  searchPlaceholder: string;
  favoritesTitle: string;
  favoritesEmpty: string;
  favoritesMissing: (count: number) => string;
  showAll: (count: number) => string;
  showLess: string;
  noResults: string;
  clearFilters: string;
  distributionTitle: (total: number) => string;
  unrated: (count: number) => string;
  peMedian: string;
  pbMedian: string;
  yieldMedian: string;
  tab: (tab: ZoneTab) => string;
  zone: (zone: ValuationZone) => string;
  noZone: string;
  sort: (sort: ValuationListSort) => string;
  groupByIndustry: string;
  market: (market: ValuationMarket) => string;
  industry: string;
  allIndustries: string;
  yieldAtLeast: (pct: number) => string;
  riskFilter: string;
  risk: (risk: ValuationRisk) => string;
  /** Right column, second line: 「本益比 14.6 · 殖 3.2%」 or a price. */
  rowFacts: (row: ValuationListRow) => string;
  favoriteAdd: (name: string) => string;
  favoriteRemove: (name: string) => string;
  formatPct: (value: number) => string;
  formatRatio: (value: number) => string;
}

export interface ValuationListFeatures {
  /** 上市 / 上櫃 chips (TW). */
  markets?: boolean;
  /** 產業 chips. */
  industries?: boolean;
  /** 殖利率 ≥ 3% / 5% chips (TW). */
  yieldChips?: boolean;
  /** 處置 / 注意 chip (TW). */
  risk?: boolean;
  /** P/E, P/B, yield medians under the distribution (TW). */
  medians?: boolean;
  /** Collapsible industry groups. */
  groups?: boolean;
}

export interface ValuationListProps {
  rows: readonly ValuationListRow[];
  /** Symbols in the app's 我的最愛 store, in its order. */
  favorites: readonly string[];
  /** One-tap ☆ on every row; without it rows show no star (Options keeps contracts, not stocks). */
  onToggleFavorite?: (symbol: string) => void;
  onOpen: (row: ValuationListRow) => void;
  theme: ValuationListTheme;
  labels: ValuationListLabels;
  sorts: readonly ValuationListSort[];
  features?: ValuationListFeatures;
  /** Above the search bar (screen title, trial banner). */
  header?: ReactElement | null;
  /** Below the rows (disclosure, funds without a range). */
  footer?: ReactElement | null;
  refreshControl?: ReactElement<RefreshControlProps>;
  /** Perf builds only: render every row at once to measure the old page. */
  virtualize?: boolean;
  /** Called once, when the first rows are on screen. */
  onFirstRows?: () => void;
  testID?: string;
}

export function useDebouncedValue<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

interface RowProps {
  row: ValuationListRow;
  favorite: boolean;
  theme: ValuationListTheme;
  labels: ValuationListLabels;
  onOpen: (row: ValuationListRow) => void;
  onToggleFavorite?: (symbol: string) => void;
  /** Rows straight in the list (not inside a card) keep the page's side margin. */
  inset?: boolean;
  /** Row height for the current Dynamic Type size. */
  height?: number;
  /** Large text: code + name on one line, zone + numbers on the next. */
  stacked?: boolean;
}

/** One compact row: ☆ · code/name · zone · gap% over P/E/yield. Fixed height, no charts. */
export const ValuationRow = memo(function ValuationRow({ row, favorite, theme, labels, onOpen, onToggleFavorite, inset, height, stacked }: RowProps) {
  const color = row.zone ? theme.zone[row.zone] : theme.textMuted;
  const zoneText = row.zone ? labels.zone(row.zone) : labels.noZone;
  return (
    <Pressable
      onPress={() => onOpen(row)}
      style={({ pressed }) => [styles.row, height ? { height } : null, inset && styles.inset, { borderBottomColor: theme.border }, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={[row.symbol, row.name, zoneText, row.gapPct !== null ? labels.formatPct(row.gapPct) : null, row.risk ? labels.risk(row.risk) : null].filter(Boolean).join(' ')}
      testID={`valuation-list-row-${row.symbol}`}
    >
      {onToggleFavorite ? (
      <Pressable
        onPress={() => onToggleFavorite(row.symbol)}
        hitSlop={10}
        style={styles.star}
        accessibilityRole="button"
        accessibilityState={{ selected: favorite }}
        accessibilityLabel={favorite ? labels.favoriteRemove(row.name) : labels.favoriteAdd(row.name)}
        testID={`valuation-list-star-${row.symbol}`}
      >
        <Text style={[styles.starGlyph, { color: favorite ? theme.star : theme.textMuted }]}>{favorite ? '★' : '☆'}</Text>
      </Pressable>
      ) : null}
      {stacked ? (
        <View style={styles.stack}>
          <View style={styles.codeLine}>
            <Text style={[theme.text.body, styles.code, { color: theme.textHeading }]} numberOfLines={1}>{row.symbol}</Text>
            <Text style={[theme.text.sub, styles.flex, { color: theme.textMuted }]} numberOfLines={1}>{row.name}</Text>
          </View>
          <View style={styles.stackLine}>
            <View style={[styles.badgeStacked, { borderColor: color }]}>
              <Text style={[theme.text.label, { color }]} numberOfLines={1}>{zoneText}</Text>
            </View>
            <Text style={[theme.text.mono, styles.gap, { color }]} numberOfLines={1}>{row.gapPct !== null ? labels.formatPct(row.gapPct) : '—'}</Text>
            {row.risk ? (
              <Text style={[theme.text.label, styles.riskTag, { color: theme.risk, borderColor: theme.risk }]} numberOfLines={1}>{labels.risk(row.risk)}</Text>
            ) : null}
          </View>
          <Text style={[theme.text.label, { color: theme.textMuted }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{labels.rowFacts(row)}</Text>
        </View>
      ) : (
      <>
      <View style={styles.names}>
          <View style={styles.codeLine}>
            <Text style={[theme.text.body, styles.code, { color: theme.textHeading }]} numberOfLines={1}>{row.symbol}</Text>
            {row.risk ? (
              <Text style={[theme.text.label, styles.riskTag, { color: theme.risk, borderColor: theme.risk }]} numberOfLines={1}>{labels.risk(row.risk)}</Text>
            ) : null}
          </View>
          <Text style={[theme.text.sub, { color: theme.textMuted }]} numberOfLines={1}>{row.name}</Text>
        </View>
        <View style={[styles.badge, { borderColor: color }]}>
          <Text style={[theme.text.label, { color }]} numberOfLines={1}>{zoneText}</Text>
        </View>
        <View style={styles.numbers}>
          <Text style={[theme.text.mono, styles.gap, { color }]} numberOfLines={1}>{row.gapPct !== null ? labels.formatPct(row.gapPct) : '—'}</Text>
          <Text style={[theme.text.label, styles.right, { color: theme.textMuted }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{labels.rowFacts(row)}</Text>
        </View>
      </>
      )}
    </Pressable>
  );
});

const GroupHeader = memo(function GroupHeader({ industry, count, collapsed, theme, onToggle, height }: {
  industry: string; count: number; collapsed: boolean; theme: ValuationListTheme; onToggle: (industry: string) => void; height?: number;
}) {
  return (
    <Pressable
      onPress={() => onToggle(industry)}
      style={[styles.group, height ? { height } : null, styles.inset, { backgroundColor: theme.background, borderBottomColor: theme.border }]}
      accessibilityRole="button"
      accessibilityState={{ expanded: !collapsed }}
      testID={`valuation-list-group-${industry}`}
    >
      <Text style={[theme.text.body, styles.flex, { color: theme.textHeading, fontWeight: '700' }]} numberOfLines={1}>{industry || '—'}</Text>
      <Text style={[theme.text.mono, { color: theme.textMuted }]}>{count}</Text>
      <Text style={[theme.text.sub, styles.chevron, { color: theme.textMuted }]}>{collapsed ? '▸' : '▾'}</Text>
    </Pressable>
  );
});

function Chip({ label, on, onPress, theme, testID }: { label: string; on: boolean; onPress: () => void; theme: ValuationListTheme; testID?: string }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      style={[styles.chip, on ? { backgroundColor: theme.accent, borderColor: theme.accent } : { backgroundColor: theme.card, borderColor: theme.border }]}
      testID={testID}
    >
      <Text style={[theme.text.sub, styles.chipText, { color: on ? theme.onAccent : theme.textHeading }]} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

/** Zone distribution bar, legend and (TW) the P/E, P/B, yield medians. */
export function ValuationOverview({ rows, theme, labels, medians }: { rows: readonly ValuationListRow[]; theme: ValuationListTheme; labels: ValuationListLabels; medians?: boolean }) {
  const overview = useMemo(() => summarizeValuationRows(rows), [rows]);
  const parts = VALUATION_ZONES.filter((zone) => overview.counts[zone] > 0);
  const legend = parts.map((zone) => `${labels.zone(zone)} ${overview.counts[zone]}`).join(' · ');
  const unrated = overview.total - overview.rated;
  const ratios = medians
    ? ([
        [labels.peMedian, overview.peMedian, labels.formatRatio],
        [labels.pbMedian, overview.pbMedian, labels.formatRatio],
        [labels.yieldMedian, overview.dividendYieldMedian, (value: number) => `${labels.formatRatio(value)}%`],
      ] as const)
    : [];
  return (
    <View style={styles.overview} testID="valuation-list-overview">
      <View style={[styles.tile, { backgroundColor: theme.card }]} accessible accessibilityLabel={`${labels.distributionTitle(overview.total)}. ${legend}`}>
        <Text style={[theme.text.label, { color: theme.textMuted }]} numberOfLines={1}>{labels.distributionTitle(overview.total)}</Text>
        <View style={[styles.bar, { backgroundColor: theme.border }]}>
          {parts.map((zone) => <View key={zone} style={{ flex: overview.counts[zone], backgroundColor: theme.zone[zone] }} />)}
        </View>
        <Text style={[theme.text.sub, { color: theme.textMuted }]} numberOfLines={2}>
          {legend}{unrated > 0 ? ` · ${labels.unrated(unrated)}` : ''}
        </Text>
      </View>
      {ratios.length ? (
        <View style={styles.medians}>
          {ratios.map(([label, value, format]) => (
            <View key={label} style={[styles.tile, styles.median, { backgroundColor: theme.card }]}>
              <Text style={[theme.text.label, { color: theme.textMuted }]} numberOfLines={1}>{label}</Text>
              <Text style={[theme.text.value, { color: theme.textHeading }]} numberOfLines={1}>{value !== null ? format(value) : '—'}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

/**
 * The 估值區間 list: search → overview → 自選 → zone tabs → chips → sort →
 * virtualized rows. Filtering, sorting and counting are pure and memoised;
 * search is debounced; rows have one fixed height (getItemLayout).
 */
export function ValuationList({
  rows, favorites, onToggleFavorite, onOpen, theme, labels, sorts, features = {}, header, footer, refreshControl,
  virtualize = true, onFirstRows, testID,
}: ValuationListProps) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const [tab, setTab] = useState<ZoneTab>('all');
  const [sort, setSort] = useState<ValuationListSort>(sorts[0] ?? 'gap');
  const [market, setMarket] = useState<ValuationMarket | null>(null);
  const [industry, setIndustry] = useState<string | null>(null);
  const [industryOpen, setIndustryOpen] = useState(false);
  const [minYield, setMinYield] = useState<number | null>(null);
  const [risk, setRisk] = useState(false);
  const [grouped, setGrouped] = useState(false);
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);

  const { fontScale } = useWindowDimensions();
  const heights = useMemo(() => valuationRowHeights(fontScale), [fontScale]);
  const select = useMemo(() => createValuationListSelector(), []);
  const { rows: shown, counts } = useMemo(
    () => select(rows, { query: debouncedQuery, tab, sort, market, industry, minYield, risk }),
    [select, rows, debouncedQuery, tab, sort, market, industry, minYield, risk],
  );
  const favoriteSet = useMemo(() => new Set(favorites), [favorites]);
  const favoriteList = useMemo(() => favoriteValuationRows(rows, favorites), [rows, favorites]);
  const industries = useMemo(() => (features.industries ? valuationIndustries(rows) : []), [rows, features.industries]);
  const items = useMemo(
    () => valuationListItems(shown, { groupBy: grouped ? 'industry' : null, collapsed }),
    [shown, grouped, collapsed],
  );
  const offsets = useMemo(() => valuationItemOffsets(items, heights.row, heights.group), [items, heights]);

  const toggleGroup = useCallback((name: string) => {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);
  const filtered = Boolean(debouncedQuery.trim() || market || industry || minYield !== null || risk || tab !== 'all');
  const clearFilters = useCallback(() => {
    setQuery('');
    setTab('all');
    setMarket(null);
    setIndustry(null);
    setMinYield(null);
    setRisk(false);
  }, []);

  const reported = useRef(false);
  const onContentSizeChange = useCallback(() => {
    if (!reported.current && rows.length > 0) {
      reported.current = true;
      onFirstRows?.();
    }
  }, [onFirstRows, rows.length]);

  const renderItem = useCallback(({ item }: ListRenderItemInfo<ValuationListItem>) => (
    item.type === 'group' ? (
      <GroupHeader industry={item.industry} count={item.count} collapsed={item.collapsed} theme={theme} onToggle={toggleGroup} height={heights.group} />
    ) : (
      <ValuationRow row={item.row} favorite={favoriteSet.has(item.row.symbol)} theme={theme} labels={labels} onOpen={onOpen} onToggleFavorite={onToggleFavorite} inset height={heights.row} stacked={heights.stacked} />
    )
  ), [theme, labels, onOpen, onToggleFavorite, favoriteSet, toggleGroup, heights]);
  const getItemLayout = useCallback((_: unknown, index: number) => ({
    length: offsets[index + 1] - offsets[index],
    offset: headerHeight + offsets[index],
    index,
  }), [offsets, headerHeight]);
  const onHeaderLayout = useCallback((event: LayoutChangeEvent) => setHeaderHeight(event.nativeEvent.layout.height), []);

  const shownFavorites = favoritesOpen ? favoriteList.rows : favoriteList.rows.slice(0, FAVORITES_PREVIEW);
  const listHeader = (
    <View onLayout={onHeaderLayout}>
      {header}
      <View style={styles.pad}>
        <View style={[styles.search, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[theme.text.sub, { color: theme.textMuted }]}>⌕</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={labels.searchPlaceholder}
            placeholderTextColor={theme.textMuted}
            style={[theme.text.body, styles.searchInput, { color: theme.textHeading }]}
            autoCorrect={false}
            autoCapitalize="characters"
            clearButtonMode="while-editing"
            returnKeyType="search"
            accessibilityLabel={labels.searchPlaceholder}
            testID="valuation-list-search"
          />
          {query && Platform.OS === 'android' ? (
            <Pressable onPress={() => setQuery('')} hitSlop={10} accessibilityRole="button" accessibilityLabel={labels.clearFilters}>
              <Text style={[theme.text.body, { color: theme.textMuted }]}>✕</Text>
            </Pressable>
          ) : null}
        </View>

        <ValuationOverview rows={rows} theme={theme} labels={labels} medians={features.medians} />

        <View style={[styles.section, { backgroundColor: theme.card }]} testID="valuation-list-favorites">
          <Text style={[theme.text.label, styles.sectionTitle, { color: theme.textMuted }]}>
            {labels.favoritesTitle}{favoriteList.rows.length ? ` ${favoriteList.rows.length}` : ''}
          </Text>
          {favoriteList.rows.length === 0 ? (
            <Text style={[theme.text.sub, styles.hint, { color: theme.textMuted }]} testID="valuation-list-favorites-empty">{labels.favoritesEmpty}</Text>
          ) : (
            shownFavorites.map((row) => (
              <ValuationRow key={row.symbol} row={row} favorite theme={theme} labels={labels} onOpen={onOpen} onToggleFavorite={onToggleFavorite} height={heights.row} stacked={heights.stacked} />
            ))
          )}
          {favoriteList.rows.length > FAVORITES_PREVIEW ? (
            <Pressable onPress={() => setFavoritesOpen((open) => !open)} accessibilityRole="button" style={styles.more}>
              <Text style={[theme.text.sub, { color: theme.accent }]}>{favoritesOpen ? labels.showLess : labels.showAll(favoriteList.rows.length)}</Text>
            </Pressable>
          ) : null}
          {favoriteList.missing.length ? (
            <Text style={[theme.text.label, styles.hint, { color: theme.textMuted }]}>{labels.favoritesMissing(favoriteList.missing.length)}</Text>
          ) : null}
        </View>

        <View style={[styles.tabs, { borderColor: theme.border }]} accessibilityRole="tablist" testID="valuation-list-tabs">
          {ZONE_TABS.map((key) => {
            const on = key === tab;
            return (
              <Pressable
                key={key}
                onPress={() => setTab(key)}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                style={[styles.tab, on && { backgroundColor: theme.accent }]}
                testID={`valuation-list-tab-${key}`}
              >
                <Text style={[theme.text.sub, styles.chipText, { color: on ? theme.onAccent : theme.textHeading }]} numberOfLines={1}>{labels.tab(key)}</Text>
                <Text style={[theme.text.label, { color: on ? theme.onAccent : theme.textMuted }]} numberOfLines={1}>{counts[key]}</Text>
              </Pressable>
            );
          })}
        </View>

        {features.markets || features.industries || features.yieldChips || features.risk ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} testID="valuation-list-filters" keyboardShouldPersistTaps="handled">
            {features.markets ? (['twse', 'tpex'] as const).map((key) => (
              <Chip key={key} label={labels.market(key)} on={market === key} onPress={() => setMarket(market === key ? null : key)} theme={theme} testID={`valuation-list-market-${key}`} />
            )) : null}
            {features.industries && industries.length > 1 ? (
              <Chip
                label={industry ? `${industry} ▾` : `${labels.industry} ▾`}
                on={industry !== null || industryOpen}
                onPress={() => setIndustryOpen((open) => !open)}
                theme={theme}
                testID="valuation-list-industry"
              />
            ) : null}
            {features.yieldChips ? [3, 5].map((pct) => (
              <Chip key={pct} label={labels.yieldAtLeast(pct)} on={minYield === pct} onPress={() => setMinYield(minYield === pct ? null : pct)} theme={theme} testID={`valuation-list-yield-${pct}`} />
            )) : null}
            {features.risk ? <Chip label={labels.riskFilter} on={risk} onPress={() => setRisk(!risk)} theme={theme} testID="valuation-list-risk" /> : null}
          </ScrollView>
        ) : null}
        {industryOpen && industries.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} testID="valuation-list-industries">
            <Chip label={labels.allIndustries} on={industry === null} onPress={() => { setIndustry(null); setIndustryOpen(false); }} theme={theme} />
            {industries.map(({ industry: name, count }) => (
              <Chip key={name} label={`${name} ${count}`} on={industry === name} onPress={() => { setIndustry(name); setIndustryOpen(false); }} theme={theme} />
            ))}
          </ScrollView>
        ) : null}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} testID="valuation-list-sorts">
          {sorts.map((key) => (
            <Chip key={key} label={labels.sort(key)} on={sort === key} onPress={() => setSort(key)} theme={theme} testID={`valuation-list-sort-${key}`} />
          ))}
          {features.groups ? <Chip label={labels.groupByIndustry} on={grouped} onPress={() => setGrouped(!grouped)} theme={theme} testID="valuation-list-group" /> : null}
        </ScrollView>
      </View>
    </View>
  );
  const empty = (
    <View style={styles.empty} testID="valuation-list-empty">
      <Text style={[theme.text.body, { color: theme.textMuted }]}>{labels.noResults}</Text>
      {filtered ? (
        <Pressable onPress={clearFilters} accessibilityRole="button" style={styles.more}>
          <Text style={[theme.text.sub, { color: theme.accent }]}>{labels.clearFilters}</Text>
        </Pressable>
      ) : null}
    </View>
  );

  if (!virtualize) {
    // The old page: every row mounted inside one ScrollView.
    return (
      <ScrollView style={{ backgroundColor: theme.background }} refreshControl={refreshControl} onContentSizeChange={onContentSizeChange} testID={testID ?? 'valuation-list'}>
        {listHeader}
        <View>{items.length ? items.map((item) => <React.Fragment key={item.key}>{renderItem({ item } as ListRenderItemInfo<ValuationListItem>)}</React.Fragment>) : empty}</View>
        {footer}
      </ScrollView>
    );
  }
  return (
    <FlatList
      data={items}
      keyExtractor={keyOf}
      renderItem={renderItem}
      getItemLayout={getItemLayout}
      ListHeaderComponent={listHeader}
      ListFooterComponent={footer ?? null}
      ListEmptyComponent={empty}
      contentContainerStyle={styles.listContent}
      style={{ backgroundColor: theme.background }}
      refreshControl={refreshControl}
      initialNumToRender={14}
      maxToRenderPerBatch={14}
      windowSize={7}
      updateCellsBatchingPeriod={40}
      removeClippedSubviews={Platform.OS === 'android'}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      onContentSizeChange={onContentSizeChange}
      extraData={favoriteSet}
      testID={testID ?? 'valuation-list'}
    />
  );
}

const keyOf = (item: ValuationListItem) => item.key;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pad: { paddingHorizontal: 16 },
  listContent: { paddingBottom: 32 },
  pressed: { opacity: 0.6 },
  row: { height: VALUATION_ROW_HEIGHT, flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: 4 },
  star: { width: 28, alignItems: 'center', justifyContent: 'center' },
  starGlyph: { fontSize: 18 },
  names: { flex: 1, minWidth: 0, gap: 2 },
  codeLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  code: { fontWeight: '700' },
  riskTag: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 4, paddingHorizontal: 4, overflow: 'hidden' },
  badge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, maxWidth: 88 },
  numbers: { width: 132, alignItems: 'flex-end', gap: 2 },
  stack: { flex: 1, minWidth: 0, gap: 2, justifyContent: 'center' },
  stackLine: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  badgeStacked: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  inset: { marginHorizontal: 16 },
  gap: { fontWeight: '700' },
  right: { textAlign: 'right' },
  group: { height: VALUATION_GROUP_HEIGHT, flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: 4 },
  chevron: { width: 16, textAlign: 'center' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, paddingHorizontal: 12, minHeight: 40, paddingVertical: 6, marginBottom: 12 },
  searchInput: { flex: 1, paddingVertical: 0 },
  overview: { gap: 8, marginBottom: 12 },
  tile: { borderRadius: 14, padding: 12, gap: 6 },
  bar: { height: 10, borderRadius: 5, overflow: 'hidden', flexDirection: 'row' },
  medians: { flexDirection: 'row', gap: 8 },
  median: { flex: 1, minWidth: 0 },
  section: { borderRadius: 14, paddingHorizontal: 8, paddingVertical: 10, marginBottom: 12 },
  sectionTitle: { paddingHorizontal: 4, marginBottom: 2 },
  hint: { paddingHorizontal: 4, paddingVertical: 6 },
  more: { paddingVertical: 8, paddingHorizontal: 4 },
  tabs: { flexDirection: 'row', borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, padding: 3, gap: 3, marginBottom: 8 },
  tab: { flex: 1, alignItems: 'center', borderRadius: 9, paddingVertical: 6, gap: 1 },
  chips: { gap: 6, paddingVertical: 4, paddingRight: 8 },
  chip: { borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: 32, gap: 4 },
});
