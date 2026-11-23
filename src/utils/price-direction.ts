/**
 * Direction of a price move and the colour it takes in each market.
 *
 * Taiwan convention: red = up, green = down.
 * US convention: green = up, red = down.
 * `flat` and missing values are always neutral.
 */

export type PriceDirection = 'up' | 'down' | 'flat';
export type MarketColorConvention = 'red-up' | 'green-up';
export type DirectionTone = 'red' | 'green' | 'neutral';

export const MARKET_COLOR_CONVENTION = {
  tw: 'red-up',
  us: 'green-up',
} as const satisfies Record<string, MarketColorConvention>;

/** Direction of a change value; tiny float noise and non-numbers are flat. */
export function priceDirection(change: number | null | undefined, epsilon = 1e-9): PriceDirection {
  if (typeof change !== 'number' || !Number.isFinite(change)) return 'flat';
  if (change > epsilon) return 'up';
  if (change < -epsilon) return 'down';
  return 'flat';
}

/** Colour family for a direction under a market's convention. */
export function directionTone(
  direction: PriceDirection,
  convention: MarketColorConvention,
): DirectionTone {
  if (direction === 'flat') return 'neutral';
  const upIsRed = convention === 'red-up';
  if (direction === 'up') return upIsRed ? 'red' : 'green';
  return upIsRed ? 'green' : 'red';
}

/** Arrow glyph for a direction (empty for flat). */
export function directionArrow(direction: PriceDirection): string {
  if (direction === 'up') return '▲';
  if (direction === 'down') return '▼';
  return '';
}
