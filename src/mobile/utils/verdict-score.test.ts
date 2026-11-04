import { verdictToScore, scoreToVerdict } from './verdict-score';

describe('verdictToScore', () => {
  it('BUY → 4', () => expect(verdictToScore('BUY')).toBe(4));
  it('HOLD → 3', () => expect(verdictToScore('HOLD')).toBe(3));
  it('WATCH → 2', () => expect(verdictToScore('WATCH')).toBe(2));
  it('AVOID → 1', () => expect(verdictToScore('AVOID')).toBe(1));
  it('SELL → 0', () => expect(verdictToScore('SELL')).toBe(0));
  it('unknown/null → 2 (neutral)', () => {
    expect(verdictToScore(null)).toBe(2);
    expect(verdictToScore(undefined)).toBe(2);
    expect(verdictToScore('GARBAGE')).toBe(2);
  });
});

describe('scoreToVerdict', () => {
  it('4 → BUY', () => expect(scoreToVerdict(4)).toBe('BUY'));
  it('3 → HOLD', () => expect(scoreToVerdict(3)).toBe('HOLD'));
  it('2 → WATCH', () => expect(scoreToVerdict(2)).toBe('WATCH'));
  it('1 → AVOID', () => expect(scoreToVerdict(1)).toBe('AVOID'));
  it('0 → SELL', () => expect(scoreToVerdict(0)).toBe('SELL'));
  it('5 (above max) → BUY', () => expect(scoreToVerdict(5)).toBe('BUY'));
});
