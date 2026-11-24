import { advanceDecline, packTiles, spanWidth } from './tile-pack';
import type { TileSize } from './tile-grid';

const spans = (sizes: TileSize[], cols: number) => packTiles(sizes, cols).map((t) => t.span);
const rowsFull = (sizes: TileSize[], cols: number) => {
  const packed = packTiles(sizes, cols);
  const byRow = new Map<number, number>();
  for (const t of packed) byRow.set(t.row, (byRow.get(t.row) ?? 0) + t.span);
  return [...byRow.values()].every((v) => v === cols);
};

const usSnapshot: TileSize[] = ['wide', 'small', 'small', 'small', 'small', 'small', 'small', 'small', 'small'];

describe('packTiles', () => {
  it('keeps natural spans when rows are already full (phone, 2 columns)', () => {
    expect(spans(usSnapshot, 2)).toEqual([2, 1, 1, 1, 1, 1, 1, 1, 1]);
  });

  it('fills the last row on an iPhone Pro Max (3 columns)', () => {
    // wide+small | small×3 | small×3 | small → last small stretches to 3
    expect(spans(usSnapshot, 3)).toEqual([2, 1, 1, 1, 1, 1, 1, 1, 3]);
    expect(rowsFull(usSnapshot, 3)).toBe(true);
  });

  it('widens the last tile of a row when a wide tile does not fit (phase-2 layout, 3 columns)', () => {
    const phase2: TileSize[] = ['wide', 'small', 'small', 'small', 'small', 'small', 'small', 'wide'];
    expect(spans(phase2, 3)).toEqual([2, 1, 1, 1, 1, 1, 2, 3]);
    expect(rowsFull(phase2, 3)).toBe(true);
  });

  it('fills every row for any column count and tile count', () => {
    const sizes: TileSize[] = ['wide', 'small', 'wide', 'small', 'small', 'wide', 'small'];
    for (const cols of [1, 2, 3, 4, 5]) {
      for (let n = 1; n <= sizes.length; n += 1) expect(rowsFull(sizes.slice(0, n), cols)).toBe(true);
    }
  });

  it('handles an empty list and odd counts on a phone', () => {
    expect(packTiles([], 2)).toEqual([]);
    expect(spans(['small', 'small', 'small'], 2)).toEqual([1, 1, 2]);
  });
});

describe('spanWidth', () => {
  it('matches column math with gaps', () => {
    expect(spanWidth(1, 2, 370)).toBe(181);
    expect(spanWidth(2, 2, 370)).toBe(370);
    expect(spanWidth(3, 3, 408)).toBe(408);
    expect(spanWidth(1, 3, 0)).toBe(0);
  });
});

describe('advanceDecline', () => {
  it('counts up, down and flat and skips missing values', () => {
    expect(advanceDecline([1.2, -0.5, 0, null, undefined, Number.NaN, 3])).toEqual({ up: 2, down: 1, flat: 1, total: 4 });
  });
});
