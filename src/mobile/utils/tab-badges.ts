/**
 * Pure helpers for computing tab bar badge values.
 * No side effects — easy to unit-test without mocking stores.
 */

/**
 * Returns a dot string when `currentDate` is newer than what the user last
 * saw, or undefined when there is nothing new to show.
 */
export function reportBadge(
  currentDate: string | null,
  lastSeen: string | null,
): string | undefined {
  if (!currentDate) return undefined;
  if (!lastSeen) return '•';
  return currentDate > lastSeen ? '•' : undefined;
}

/**
 * Returns the count string when there are unseen triggered alerts, or
 * undefined when the current count matches (or is below) what was last seen.
 */
export function alertBadge(
  currentCount: number,
  lastSeen: number,
): string | undefined {
  const unseen = currentCount - lastSeen;
  if (unseen <= 0) return undefined;
  return unseen > 99 ? '99+' : unseen.toString();
}
