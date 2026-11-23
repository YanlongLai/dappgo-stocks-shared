import { formatPercent } from './formatters';
import { directionArrow, priceDirection } from './price-direction';

/** "▲ +1.20%" style change text; missing values give "—". */
export function formatChangeText(changePercent: number | null | undefined, decimals = 2): string {
  const direction = priceDirection(changePercent);
  const pct = formatPercent(changePercent, { decimals, showSign: true });
  const arrow = directionArrow(direction);
  return arrow ? `${arrow} ${pct}` : pct;
}

/** Pick the theme colour for a change value (`up`/`down` already follow the market convention). */
export function changeToneColor<T extends string>(
  changePercent: number | null | undefined,
  colors: { up: T; down: T; flat: T },
): T {
  const direction = priceDirection(changePercent);
  if (direction === 'up') return colors.up;
  if (direction === 'down') return colors.down;
  return colors.flat;
}
