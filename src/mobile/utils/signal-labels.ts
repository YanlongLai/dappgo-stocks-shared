/**
 * signal-labels.ts
 *
 * Translate raw engine signal tokens (trend_label / momentum_label /
 * volume_label / chip_label / ownership_label) into user-facing strings
 * via the i18n table. The engine emits English token slugs like
 * `strong_up`, `oversold`, `accumulating`; those slugs must never leak
 * into the UI (would show raw English in both zh and en modes).
 *
 * Field axes:
 *   - trend     : strong_up | up | flat | down | strong_down
 *   - momentum  : bullish | oversold | neutral | overbought | bearish
 *   - volume    : surge | active | normal | quiet
 *   - chip      : accumulating | distributing | balanced | unknown   (TW)
 *   - ownership : balanced | dominated_buy | dominated_sell | unknown (US)
 *
 * Falls back to an em-dash when the i18n key is missing. Showing the raw
 * engine token would leak English slugs into zh mode (and makes missing
 * translations look like valid UI copy).
 */

export type SignalLabelField =
  | 'trend'
  | 'momentum'
  | 'volume'
  | 'chip'
  | 'ownership';

export function signalLabel(
  field: SignalLabelField,
  token: string | undefined | null,
  t: (k: string) => string,
): string {
  if (!token) return '—';
  const key = `signalLabel.${field}.${token}`;
  const translated = t(key);
  // useT() returns the key itself when not found. Fail closed instead of
  // surfacing the raw token in either locale.
  if (translated === key) return '—';
  return translated;
}
