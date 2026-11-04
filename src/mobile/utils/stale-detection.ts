/**
 * Utilities for detecting stale dashboard data.
 *
 * "Stale" is defined by calendar date difference — not wallclock age — so a
 * report published at 18:00 yesterday is still "1 day old" at 00:01 today.
 *
 * Timezone note for US app: the `last_updated` field in us-stocks-daily-report
 * is a US Eastern calendar date. A device in Asia (e.g. UTC+8) may see
 * "today = 2024-05-02" while the latest report is "2024-05-01" (US market
 * closed at 16:00 ET = 04:00 UTC+8 next day) — the banner correctly shows
 * amber for 1 day old. This is intentional: the US market day truly ended
 * yesterday relative to the Asian viewer's calendar. The banner disappears
 * once the engine publishes the new report.
 */

/**
 * Returns whether `lastUpdatedISO` is stale relative to `today`.
 *
 * @param lastUpdatedISO  ISO-8601 date string or null/undefined.
 * @param today           Reference "now" (default: new Date()).
 */
export function isDataStale(
  lastUpdatedISO: string | null | undefined,
  today: Date = new Date(),
): { stale: boolean; daysOld: number } {
  if (!lastUpdatedISO) return { stale: true, daysOld: Infinity };

  // Accept both "YYYY-MM-DD" and full ISO timestamps.
  const datePart = lastUpdatedISO.slice(0, 10);
  const parsed = new Date(datePart + 'T00:00:00');
  if (isNaN(parsed.getTime())) return { stale: true, daysOld: Infinity };

  // Compare calendar days by zeroing the time component of `today`.
  const todayMidnight = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const diffMs = todayMidnight.getTime() - parsed.getTime();
  const daysOld = Math.round(diffMs / (1000 * 60 * 60 * 24));

  // Negative means the timestamp is in the future — treat as fresh.
  return { stale: daysOld > 0, daysOld: Math.max(0, daysOld) };
}

/** Maps a daysOld count to a visual tone for the stale-data banner. */
export function staleTone(daysOld: number): 'fresh' | 'amber' | 'red' {
  if (daysOld <= 0) return 'fresh';
  if (daysOld === 1) return 'amber';
  return 'red';
}
