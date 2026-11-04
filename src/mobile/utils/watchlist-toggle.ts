/**
 * Pure helper for toggling a symbol in/out of a watchlist array.
 * Framework-agnostic so it can be unit-tested without React or stores.
 */

export type WatchlistToggleAction = 'added' | 'removed';

export interface WatchlistToggleResult {
  next: string[];
  action: WatchlistToggleAction;
}

/**
 * Returns the next watchlist state after toggling `symbol`.
 * Does not mutate `current`.
 *
 * @param current - array of symbol strings currently in the watchlist
 * @param symbol  - symbol to add or remove
 */
export function nextWatchlist(current: string[], symbol: string): WatchlistToggleResult {
  if (current.includes(symbol)) {
    return {
      next: current.filter((s) => s !== symbol),
      action: 'removed',
    };
  }
  return {
    next: [...current, symbol],
    action: 'added',
  };
}
