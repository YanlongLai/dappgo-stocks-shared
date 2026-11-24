import { VALUATION_ACCENT, overallValuationZone, valuationAccent } from './valuation-accent';

describe('overallValuationZone', () => {
  it('picks the zone with the most stocks (11-24 TW: 1,097 below of 1,836)', () => {
    expect(overallValuationZone({ below: 1097, within: 590, above: 149 })).toBe('below');
    expect(overallValuationZone({ below: 2, within: 3, above: 9 })).toBe('above');
    expect(overallValuationZone({ below: 8, within: 6, above: 6 })).toBe('below');
  });
  it('ties go to within; no data gives null', () => {
    expect(overallValuationZone({ below: 5, within: 1, above: 5 })).toBe('within');
    expect(overallValuationZone({ below: 0, within: 0, above: 0 })).toBeNull();
    expect(overallValuationZone(null)).toBeNull();
    expect(overallValuationZone({ below: Number.NaN, within: -1 })).toBeNull();
  });
});

describe('valuationAccent', () => {
  it('has a light and a dark colour for every zone, and none without data', () => {
    for (const scheme of ['light', 'dark'] as const) {
      for (const zone of ['below', 'within', 'above'] as const) expect(valuationAccent(zone, scheme)).toMatch(/^#[0-9A-F]{6}$/);
    }
    expect(VALUATION_ACCENT.light.below).not.toBe(VALUATION_ACCENT.dark.below);
    expect(valuationAccent(null, 'dark')).toBeNull();
  });
});
