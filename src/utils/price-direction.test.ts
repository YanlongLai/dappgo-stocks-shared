import { directionArrow, directionTone, MARKET_COLOR_CONVENTION, priceDirection } from './price-direction';

describe('priceDirection', () => {
  it('classifies moves', () => {
    expect(priceDirection(1.2)).toBe('up');
    expect(priceDirection(-0.01)).toBe('down');
    expect(priceDirection(0)).toBe('flat');
    expect(priceDirection(1e-12)).toBe('flat');
  });
  it('treats missing values as flat', () => {
    expect(priceDirection(null)).toBe('flat');
    expect(priceDirection(undefined)).toBe('flat');
    expect(priceDirection(Number.NaN)).toBe('flat');
  });
});

describe('directionTone', () => {
  it('uses red for up in Taiwan', () => {
    expect(directionTone('up', MARKET_COLOR_CONVENTION.tw)).toBe('red');
    expect(directionTone('down', MARKET_COLOR_CONVENTION.tw)).toBe('green');
  });
  it('uses green for up in the US', () => {
    expect(directionTone('up', MARKET_COLOR_CONVENTION.us)).toBe('green');
    expect(directionTone('down', MARKET_COLOR_CONVENTION.us)).toBe('red');
  });
  it('keeps flat neutral', () => {
    expect(directionTone('flat', 'red-up')).toBe('neutral');
  });
});

describe('directionArrow', () => {
  it('returns arrows', () => {
    expect(directionArrow('up')).toBe('▲');
    expect(directionArrow('down')).toBe('▼');
    expect(directionArrow('flat')).toBe('');
  });
});
