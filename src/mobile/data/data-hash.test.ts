import { shouldSkipUpdate } from './data-hash';

describe('shouldSkipUpdate', () => {
  it('returns true when both hashes match', () => {
    expect(shouldSkipUpdate('abc123def456abcd', 'abc123def456abcd')).toBe(true);
  });

  it('returns false when hashes differ', () => {
    expect(shouldSkipUpdate('abc123def456abcd', 'xyz789uvw012xyzx')).toBe(false);
  });

  it('returns false when both are null', () => {
    expect(shouldSkipUpdate(null, null)).toBe(false);
  });

  it('returns false when current is null and new is present', () => {
    expect(shouldSkipUpdate(null, 'abc123def456abcd')).toBe(false);
  });

  it('returns false when current is present and new is null', () => {
    expect(shouldSkipUpdate('abc123def456abcd', null)).toBe(false);
  });
});
