import { useCallback, useMemo, useState } from 'react';
import {
  addChip, chipKey, chipLabel, emptyFilter, favoriteCount, filterItems, removeChip, segmentCounts, sortItems, suggestChips, toggleSegment,
  type FilterChip, type ListConfig, type ListFilter, type ListItem, type SortKey,
} from '../../mobile/list-filter/model';

/**
 * One list's filter state, shared by the distribution bar and the smart
 * search bar (plan §3.3). Everything the UI counts comes from filterItems.
 */
export function useListFilter(items: readonly ListItem[], cfg: ListConfig, opts: {
  initial?: ListFilter | null;
  defaultSort: SortKey;
  /** Personalization: higher ranks first in suggestions. */
  rankChip?: (chip: FilterChip) => number;
  /** Personalization: called when a chip or segment is applied. */
  onUse?: (key: string) => void;
}) {
  const [filter, setFilter] = useState<ListFilter>(() => opts.initial ?? emptyFilter(opts.defaultSort));
  const results = useMemo(() => sortItems(filterItems(items, filter, cfg), filter.sort, cfg), [items, filter, cfg]);
  const segments = useMemo(() => segmentCounts(items, filter, cfg), [items, filter, cfg]);
  const suggestions = useMemo(
    () => suggestChips(items, filter, cfg, filter.query, { rank: opts.rankChip }),
    // rankChip identity changes are not worth recomputing for.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, filter, cfg],
  );
  const favorites = useMemo(() => favoriteCount(items), [items]);
  const { onUse } = opts;

  const setQuery = useCallback((query: string) => setFilter((f) => ({ ...f, query })), []);
  const selectSegment = useCallback((segment: string) => {
    setFilter((f) => toggleSegment(f, segment));
    onUse?.(`seg:${segment}`);
  }, [onUse]);
  const add = useCallback((chip: FilterChip) => {
    setFilter((f) => addChip(f, chip));
    onUse?.(chipKey(chip));
  }, [onUse]);
  const remove = useCallback((chip: FilterChip) => setFilter((f) => removeChip(f, chip)), []);
  const toggleFavorites = useCallback(() => setFilter((f) => ({ ...f, favoritesOnly: !f.favoritesOnly })), []);
  const setSort = useCallback((sort: SortKey) => setFilter((f) => ({ ...f, sort })), []);
  const reset = useCallback(() => setFilter((f) => emptyFilter(f.sort)), []);

  const activeChips = useMemo(
    () => filter.chips.map((c) => ({ chip: c, key: chipKey(c), label: chipLabel(c, cfg) })),
    [filter.chips, cfg],
  );

  return { filter, setFilter, results, segments, suggestions, favorites, activeChips, setQuery, selectSegment, add, remove, toggleFavorites, setSort, reset };
}
