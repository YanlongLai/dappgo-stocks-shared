/**
 * Pure helpers for the dashboard search-history chip strip.
 *
 * State lives in the screen (useState) — these helpers are pure so they're
 * easy to test in isolation, and so the screen doesn't pull in another
 * Zustand store just for ~5 strings.
 */

/** Maximum number of past queries to remember. */
export const SEARCH_HISTORY_LIMIT = 5;

/**
 * Push `query` to the front of `history`. Trims, dedupes (case-insensitive)
 * and caps at SEARCH_HISTORY_LIMIT. Empty/whitespace or < 2-char queries
 * are silently ignored.
 */
export function pushHistory(history: string[], query: string): string[] {
  const trimmed = query.trim();
  if (trimmed.length < 2) return history;
  const lower = trimmed.toLowerCase();
  const without = history.filter((h) => h.toLowerCase() !== lower);
  return [trimmed, ...without].slice(0, SEARCH_HISTORY_LIMIT);
}

/** Remove a single entry (case-insensitive match). */
export function removeFromHistory(history: string[], query: string): string[] {
  const lower = query.trim().toLowerCase();
  return history.filter((h) => h.toLowerCase() !== lower);
}
