import { FONT_SIZE, FONT_WEIGHT } from './typography';

/**
 * One type scale for every tile-system surface (dashboard tiles, list rows,
 * news rows, stock-detail summary). Base sizes; apps apply their reading
 * scale once. Numbers always use tabular digits so columns line up.
 */
export const TILE_TYPE = {
  /** Small label at the top of a tile or section ("Valuation"). */
  label: { size: FONT_SIZE.micro, weight: FONT_WEIGHT.semibold },
  /** Main number or word of a tile. */
  value: { size: FONT_SIZE.title3, weight: FONT_WEIGHT.bold },
  /** Hero number (stock detail price). */
  hero: { size: FONT_SIZE.title1, weight: FONT_WEIGHT.bold },
  /** One status line under the value. */
  sub: { size: FONT_SIZE.small, weight: FONT_WEIGHT.medium },
  /** Row title (symbol, headline). */
  rowTitle: { size: FONT_SIZE.body, weight: FONT_WEIGHT.semibold },
  /** Row metadata (name, source, time). */
  rowMeta: { size: FONT_SIZE.small, weight: FONT_WEIGHT.regular },
  /** Right-aligned row number (price). */
  rowNumber: { size: FONT_SIZE.body, weight: FONT_WEIGHT.semibold },
} as const;

export type TileTypeToken = keyof typeof TILE_TYPE;

/** Minimum row height (points, before reading scale) for tile-system lists. */
export const TILE_ROW_MIN_HEIGHT = 56;
