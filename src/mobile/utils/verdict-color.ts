/**
 * Maps a verdict string to theme-aware bg/fg color pairs.
 * Used by VerdictHistorySpark and any other component needing
 * verdict-level color coding without hardcoded values.
 */

export type Verdict = 'BUY' | 'HOLD' | 'WATCH' | 'AVOID' | 'SELL';

export interface VerdictColors {
  bg: string;
  fg: string;
}

export function verdictColor(
  verdict: string | null | undefined,
  colors: { positive: string; accent: string; gold: string; negative: string; textMuted: string },
): VerdictColors {
  switch (verdict) {
    case 'BUY':
      return { bg: colors.positive, fg: '#ffffff' };
    case 'HOLD':
      return { bg: colors.accent, fg: '#ffffff' };
    case 'WATCH':
      return { bg: colors.gold, fg: '#ffffff' };
    case 'AVOID':
      return { bg: '#ff8c42', fg: '#ffffff' };
    case 'SELL':
      return { bg: colors.negative, fg: '#ffffff' };
    default:
      return { bg: colors.textMuted, fg: '#ffffff' };
  }
}

/**
 * Single-color accent for compact row widgets (e.g. StockSignalRow's
 * left-edge verdict rail) that want a one-color verdict signal without
 * rendering the full badge. Falls back to `colors.textMuted` on unknown
 * codes so an unexpected upstream verdict never crashes the row.
 */
export function verdictAccentColor(
  verdict: string | null | undefined,
  colors: { positive: string; accent: string; gold: string; negative: string; textMuted: string },
): string {
  switch (verdict) {
    // Stock-level
    case 'BUY':
      return colors.positive;
    case 'HOLD':
      return colors.accent;
    case 'WATCH':
      return colors.gold;
    case 'AVOID':
      return colors.negative;
    case 'SELL':
      return colors.negative;
    // Sector-level (rarely used in row context but supported for safety)
    case 'HOT':
      return colors.negative;
    case 'WARM':
      return colors.positive;
    case 'NEUTRAL':
      return colors.textMuted;
    case 'COOL':
      return colors.accent;
    case 'COLD':
      return colors.accent;
    default:
      return colors.textMuted;
  }
}
