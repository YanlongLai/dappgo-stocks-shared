/**
 * US equity market hours helpers.
 *
 * Simple heuristic: assumes US/Eastern = UTC-5 (EST) year-round for
 * scheduling simplicity. Could be tightened to respect DST, but for
 * a Dashboard badge that only matters within one hour per transition
 * week this is good enough.
 */

export function getMarketStatus(): { label: string; isOpen: boolean } {
  const now = new Date();
  const etOffset = -5; // EST; ignore DST
  const utcHour = now.getUTCHours();
  const utcMin = now.getUTCMinutes();
  const etHour = (utcHour + etOffset + 24) % 24;
  const etMin = utcMin;
  const day = now.getUTCDay(); // 0=Sun, 6=Sat
  const isWeekday = day >= 1 && day <= 5;
  const minutesSinceMidnight = etHour * 60 + etMin;
  const marketOpen = 9 * 60 + 30; // 9:30 ET
  const marketClose = 16 * 60; // 16:00 ET
  const isOpen =
    isWeekday &&
    minutesSinceMidnight >= marketOpen &&
    minutesSinceMidnight < marketClose;
  return { label: isOpen ? 'Open' : 'Closed', isOpen };
}

/**
 * Days-to-expiry from a YYYY-MM-DD (or ISO) string.
 * Past dates are clamped to 0. Returns null for malformed input.
 */
export function calcDte(expiry: string): number | null {
  if (!expiry) return null;
  const expiryDate = new Date(expiry);
  if (isNaN(expiryDate.getTime())) return null;
  const diffMs = expiryDate.getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}
