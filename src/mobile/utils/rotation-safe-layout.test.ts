import { normalizeLayoutDimension, resolveChartWidth } from './rotation-safe-layout';

describe('rotation-safe layout dimensions', () => {
  it('recomputes a portrait → landscape → portrait fallback sequence', () => {
    expect(resolveChartWidth(0, 390)).toBe(358);
    expect(resolveChartWidth(0, 844)).toBe(812);
    expect(resolveChartWidth(0, 390)).toBe(358);
  });

  it('prefers a measured container width when it is available', () => {
    expect(resolveChartWidth(312, 844)).toBe(312);
  });

  it('never returns a non-positive render dimension', () => {
    expect(normalizeLayoutDimension(0, 0)).toBe(1);
    expect(normalizeLayoutDimension(-20, Number.NaN)).toBe(1);
    expect(normalizeLayoutDimension(0, 10, 24)).toBe(24);
  });
});
