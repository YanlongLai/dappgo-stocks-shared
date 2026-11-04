/**
 * weekly-movers-format.ts
 *
 * Pure helpers for the weekly_verdict_movers engine payload.
 * No React dependency — safe to use in tests without a native environment.
 */

export interface VerdictMover {
  symbol: string;
  from: string;
  to: string;
  days_ago: number;
}

export interface WeeklyVerdictMovers {
  upgrades?: VerdictMover[];
  downgrades?: VerdictMover[];
  consistent_buys?: string[];
  consistent_sells?: string[];
}

/**
 * Format a VerdictMover into a display chip string.
 * Example: "AAPL HOLD→BUY (2天前)"
 */
export function moverChipText(m: VerdictMover): string {
  return `${m.symbol} ${m.from}→${m.to} (${m.days_ago}天前)`;
}
