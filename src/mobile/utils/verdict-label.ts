/**
 * Map verdict / sector-verdict English codes to 繁中 display labels.
 *
 * Labels are research-toned model signals (偏多/偏空/中性), never
 * trade instructions such as 買進/賣出 (Owner decision 2026-11-18).
 *
 * Pure function — no React or theme dependency, so it can be unit
 * tested without spinning up the RN test environment. The visual
 * VerdictBadge component re-exports this for convenience.
 */

const VERDICT_LABEL: Record<string, string> = {
  // Stock-level
  BUY: '偏多訊號',
  HOLD: '溫和偏多',
  WATCH: '中性',
  AVOID: '溫和偏空',
  SELL: '偏空訊號',
  // Sector-level
  HOT: '熱絡',
  WARM: '偏多',
  NEUTRAL: '中性',
  COOL: '偏空',
  COLD: '冷清',
};

export function verdictLabel(code: string): string {
  return VERDICT_LABEL[code] ?? code;
}
