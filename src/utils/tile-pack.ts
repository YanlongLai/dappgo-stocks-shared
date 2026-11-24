/**
 * Row packing for tile grids: no empty slot at the end of any row.
 *
 * Tiles are placed in order. When the next tile does not fit in what is left
 * of the current row (or the list ends), the last tile already in that row is
 * widened to fill the row. Works for any column count, so a phone (2), an
 * iPhone Pro Max (3) and an unfolded iPhone Duo or iPad (4) all get full rows.
 */
import { tileSpan, type TileSize } from './tile-grid';

export interface PackedTile {
  /** Columns this tile takes after packing (≥ its natural span). */
  span: number;
  /** Zero-based row index. */
  row: number;
}

export function packTiles(sizes: readonly TileSize[], columns: number): PackedTile[] {
  const cols = Math.max(1, Math.floor(columns));
  const out: PackedTile[] = [];
  let row = 0;
  let used = 0;
  let rowStart = 0;
  const closeRow = () => {
    if (used > 0 && used < cols && out.length > rowStart) {
      out[out.length - 1].span += cols - used;
    }
  };
  for (const size of sizes) {
    const span = tileSpan(size, cols);
    if (used + span > cols) {
      closeRow();
      row += 1;
      used = 0;
      rowStart = out.length;
    }
    out.push({ span, row });
    used += span;
    if (used === cols) {
      row += 1;
      used = 0;
      rowStart = out.length;
    }
  }
  closeRow();
  return out;
}

/** Pixel width for a tile spanning `span` columns in a grid of `columns` across `width`. */
export function spanWidth(span: number, columns: number, width: number, gap = 8): number {
  if (!Number.isFinite(width) || width <= 0) return 0;
  const cols = Math.max(1, Math.floor(columns));
  const column = (width - gap * (cols - 1)) / cols;
  const s = Math.max(1, Math.min(cols, Math.floor(span)));
  return Math.max(0, Math.floor(column * s + gap * (s - 1)));
}

/** Up / down / flat counts of a set of daily changes (non-numbers skipped). */
export function advanceDecline(changes: Iterable<number | null | undefined>): { up: number; down: number; flat: number; total: number } {
  let up = 0;
  let down = 0;
  let flat = 0;
  for (const c of changes) {
    if (typeof c !== 'number' || !Number.isFinite(c)) continue;
    if (c > 1e-9) up += 1;
    else if (c < -1e-9) down += 1;
    else flat += 1;
  }
  return { up, down, flat, total: up + down + flat };
}
