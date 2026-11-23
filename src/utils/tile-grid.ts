/**
 * Tile grid layout math for the Control-Center style dashboards.
 *
 * Tiles come in two sizes: `small` takes one column, `wide` takes two.
 * The column count follows the usable width so the same tile list reflows
 * on a phone (2), a half-open foldable or small tablet (3) and an unfolded
 * iPhone Duo or iPad (4).
 */

export type TileSize = 'small' | 'wide';

export interface TileGridOptions {
  /** Space between tiles in points. Defaults to 8. */
  gap?: number;
}

export const TILE_GRID_BREAKPOINTS = { three: 400, four: 600 } as const;

/** Column count for a usable content width (points, padding already removed). */
export function tileGridColumns(width: number): 2 | 3 | 4 {
  if (!Number.isFinite(width) || width < TILE_GRID_BREAKPOINTS.three) return 2;
  if (width < TILE_GRID_BREAKPOINTS.four) return 3;
  return 4;
}

/** Columns a tile occupies; never more than the grid has. */
export function tileSpan(size: TileSize, columns: number): number {
  const span = size === 'wide' ? 2 : 1;
  return Math.max(1, Math.min(span, Math.floor(columns)));
}

/**
 * Pixel width of a tile so that `columns` tiles plus their gaps fill `width`.
 * Rounded down to whole points to avoid wrapping from float drift.
 */
export function tileWidth(
  size: TileSize,
  width: number,
  options: TileGridOptions = {},
): number {
  const gap = options.gap ?? 8;
  if (!Number.isFinite(width) || width <= 0) return 0;
  const columns = tileGridColumns(width);
  const column = (width - gap * (columns - 1)) / columns;
  const span = tileSpan(size, columns);
  return Math.max(0, Math.floor(column * span + gap * (span - 1)));
}
