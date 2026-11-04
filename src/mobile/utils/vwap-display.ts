/**
 * Pure helpers for anchored VWAP display.
 * No React imports — safe to use in tests without mocking.
 */

/**
 * Map a VWAP distance percentage to a display tone.
 * > +5%  → positive (green):  price is well above VWAP anchor
 * < -5%  → negative (red):    price is well below VWAP anchor
 * -5..+5 → neutral:            price is near the anchor
 */
export function vwapDistanceTone(
  distancePct: number | null | undefined,
): 'positive' | 'neutral' | 'negative' {
  if (distancePct == null) return 'neutral';
  if (distancePct > 5) return 'positive';
  if (distancePct < -5) return 'negative';
  return 'neutral';
}
