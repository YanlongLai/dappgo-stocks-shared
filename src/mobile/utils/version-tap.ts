/**
 * Pure logic for the developer-mode version-tap easter egg.
 * Kept separate from the store so it can be tested without mocking AsyncStorage.
 */

export const DEV_MODE_TAP_THRESHOLD = 7;

/**
 * Compute the next tap state given the current count and threshold.
 * Returns `{ nextCount, activated }`.
 *
 * - `nextCount`: the updated counter (0 if threshold reached)
 * - `activated`: true when the threshold was just crossed
 */
export function computeNextTap(
  currentCount: number,
  threshold = DEV_MODE_TAP_THRESHOLD,
): { nextCount: number; activated: boolean } {
  const next = currentCount + 1;
  if (next >= threshold) {
    return { nextCount: 0, activated: true };
  }
  return { nextCount: next, activated: false };
}
