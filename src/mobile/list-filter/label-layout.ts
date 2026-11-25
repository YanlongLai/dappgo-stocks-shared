/** Gap between distribution labels on the one-row layout. */
export const LABEL_GAP = 4;

/**
 * Distribution labels (2.0.0): one row when every label fits at its natural
 * width, spread evenly; otherwise a two-column grid, so one label never ends up
 * alone on a second line.
 */
export function labelLayout(natural: readonly number[], width: number, gap = LABEL_GAP): 'row' | 'grid' {
  if (width <= 0 || natural.some((w) => w <= 0)) return 'row';
  const need = natural.reduce((n, w) => n + w, 0) + gap * Math.max(0, natural.length - 1);
  return need <= width ? 'row' : 'grid';
}
