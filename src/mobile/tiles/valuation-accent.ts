/**
 * Left accent bar on the valuation card: the colour of the overall zone.
 * Below the range is green, inside it slate blue, above it orange; with no
 * data the bar is not drawn. Valuation colours do not follow the price
 * convention (TW red-up), so they are the same in all three apps.
 */
export type OverallZone = 'below' | 'within' | 'above';
export type ColorScheme = 'light' | 'dark';

export const VALUATION_ACCENT: Record<ColorScheme, Record<OverallZone, string>> = {
  light: { below: '#2E9E5B', within: '#6B8199', above: '#E07B2A' },
  dark: { below: '#4CC27E', within: '#8FA3B8', above: '#F29A4A' },
};

/** Width of the bar in points. */
export const ACCENT_BAR_WIDTH = 3;

export interface ZoneCounts { below: number; within: number; above: number }

const n = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0);

/** The zone holding the most stocks; a tie goes to 'within'. Null when nothing is covered. */
export function overallValuationZone(counts: Partial<ZoneCounts> | null | undefined): OverallZone | null {
  const below = n(counts?.below);
  const within = n(counts?.within);
  const above = n(counts?.above);
  if (below + within + above === 0) return null;
  if (below > within && below > above) return 'below';
  if (above > within && above > below) return 'above';
  return 'within';
}

export function valuationAccent(zone: OverallZone | null, scheme: ColorScheme): string | null {
  return zone ? VALUATION_ACCENT[scheme][zone] : null;
}
