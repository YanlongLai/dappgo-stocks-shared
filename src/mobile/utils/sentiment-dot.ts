/**
 * Maps a SentimentLabel (or raw string from SentimentInput.label) to a
 * dot colour token name. Used by StockSignalRow for the at-a-glance sentiment
 * indicator without importing the full badge component.
 *
 * Returns null for 'unknown' / undefined so callers can skip rendering.
 */
export type SentimentDotColor = 'positive' | 'negative' | 'neutral';

export function sentimentDotColor(
  label: string | null | undefined,
): SentimentDotColor | null {
  switch (label) {
    case 'very_positive':
    case 'positive':
      return 'positive';
    case 'very_negative':
    case 'negative':
      return 'negative';
    case 'neutral':
      return 'neutral';
    default:
      return null;
  }
}
