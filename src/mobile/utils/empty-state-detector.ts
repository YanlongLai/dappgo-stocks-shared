/**
 * Pure helper that classifies why the stock list is empty.
 * No side-effects; safe to call on every render.
 */

export type EmptyReason =
  | 'no_data'           // data hasn't loaded at all
  | 'all_filtered_out'  // data exists but active filters hide every row
  | 'empty_watchlist'   // data exists, no filters, but list is truly empty
  | 'normal';           // list has items — nothing to do

export interface DetectEmptyReasonArgs {
  /** Whether the dashboard data has been fetched at least once */
  dataLoaded: boolean;
  /** Total tickers in the raw (unfiltered) dataset */
  totalTickers: number;
  /** Tickers visible after applying all active filters */
  filteredCount: number;
  /** True when any of search / verdict / sector filter is active */
  hasActiveFilter: boolean;
}

export function detectEmptyReason({
  dataLoaded,
  totalTickers,
  filteredCount,
  hasActiveFilter,
}: DetectEmptyReasonArgs): EmptyReason {
  if (!dataLoaded || totalTickers === 0) {
    return 'no_data';
  }
  if (filteredCount > 0) {
    return 'normal';
  }
  if (hasActiveFilter) {
    return 'all_filtered_out';
  }
  return 'empty_watchlist';
}
