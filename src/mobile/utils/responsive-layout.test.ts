import { getLayoutMode, getResponsiveValues } from './responsive-layout';

describe('responsive tablet layout', () => {
  it('keeps phone layouts unconstrained', () => {
    const layout = getResponsiveValues(390, 844);

    expect(layout.mode).toBe('phone');
    expect(layout.isTablet).toBe(false);
    expect(layout.contentMaxWidth).toBe(Infinity);
    expect(layout.numColumns).toBe(1);
  });

  it('uses a centered two-column portrait tablet canvas', () => {
    const layout = getResponsiveValues(820, 1180);

    expect(getLayoutMode(820)).toBe('tablet-portrait');
    expect(layout.isTablet).toBe(true);
    expect(layout.contentMaxWidth).toBe(720);
    expect(layout.numColumns).toBe(2);
  });

  it('uses a centered three-column landscape tablet canvas', () => {
    const layout = getResponsiveValues(1180, 820);

    expect(getLayoutMode(1180)).toBe('tablet-landscape');
    expect(layout.isTablet).toBe(true);
    expect(layout.isLandscape).toBe(true);
    expect(layout.contentMaxWidth).toBe(860);
    expect(layout.numColumns).toBe(3);
  });
});
