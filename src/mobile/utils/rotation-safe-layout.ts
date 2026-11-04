/**
 * Layout dimensions used by rendered surfaces must remain valid while the
 * native window is between portrait and landscape measurements.
 */
export function normalizeLayoutDimension(
  value: number,
  fallback: number,
  minimum = 1,
): number {
  const safeMinimum = Number.isFinite(minimum) && minimum > 0 ? minimum : 1;
  const candidate = Number.isFinite(value) && value > 0 ? value : fallback;
  return Math.max(
    safeMinimum,
    Number.isFinite(candidate) ? candidate : safeMinimum,
  );
}

export function resolveChartWidth(
  measuredWidth: number,
  windowWidth: number,
  horizontalPadding = 32,
): number {
  const availableWidth = normalizeLayoutDimension(windowWidth - horizontalPadding, 1);
  // A previous wider measurement can survive one frame of a fold/rotation.
  return Math.min(normalizeLayoutDimension(measuredWidth, availableWidth), availableWidth);
}
