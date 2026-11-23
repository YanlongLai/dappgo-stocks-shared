import { changeToneColor, formatChangeText } from './change-text';

describe('formatChangeText', () => {
  it('adds an arrow and sign', () => {
    expect(formatChangeText(1.2)).toBe('▲ +1.20%');
    expect(formatChangeText(-0.5, 1)).toBe('▼ -0.5%');
    expect(formatChangeText(0)).toBe('0.00%');
    expect(formatChangeText(null)).toBe('—');
  });
});

describe('changeToneColor', () => {
  const c = { up: 'U', down: 'D', flat: 'F' };
  it('maps direction to the market-aware colours', () => {
    expect(changeToneColor(2, c)).toBe('U');
    expect(changeToneColor(-2, c)).toBe('D');
    expect(changeToneColor(undefined, c)).toBe('F');
  });
});
