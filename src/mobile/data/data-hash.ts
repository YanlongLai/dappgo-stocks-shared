/**
 * Pure helper for data_hash-based cache invalidation.
 * Both hashes must be non-empty strings for a skip to be safe.
 */

export function shouldSkipUpdate(
  currentHash: string | null | undefined,
  newHash: string | null | undefined,
): boolean {
  if (!currentHash || !newHash) return false;
  return currentHash === newHash;
}
