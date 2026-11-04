/**
 * Pure helpers that convert between verdict strings and numeric scores.
 * Score range: 0 (SELL) → 4 (BUY), unknown defaults to 2 (neutral/WATCH).
 */

export function verdictToScore(v: string | null | undefined): number {
  switch (v) {
    case 'BUY':   return 4;
    case 'HOLD':  return 3;
    case 'WATCH': return 2;
    case 'AVOID': return 1;
    case 'SELL':  return 0;
    default:      return 2;
  }
}

export function scoreToVerdict(s: number): 'BUY' | 'HOLD' | 'WATCH' | 'AVOID' | 'SELL' {
  if (s >= 4) return 'BUY';
  if (s >= 3) return 'HOLD';
  if (s >= 2) return 'WATCH';
  if (s >= 1) return 'AVOID';
  return 'SELL';
}
