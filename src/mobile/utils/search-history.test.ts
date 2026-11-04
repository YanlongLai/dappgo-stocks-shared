import {
  pushHistory,
  removeFromHistory,
  SEARCH_HISTORY_LIMIT,
} from './search-history';

describe('pushHistory', () => {
  it('ignores empty / whitespace queries', () => {
    expect(pushHistory([], '')).toEqual([]);
    expect(pushHistory(['AAPL'], '   ')).toEqual(['AAPL']);
  });

  it('rejects single-char queries', () => {
    expect(pushHistory(['AAPL'], 'A')).toEqual(['AAPL']);
  });

  it('accepts exactly 2-char queries', () => {
    expect(pushHistory([], 'MS')).toEqual(['MS']);
  });

  it('inserts new query at the front', () => {
    expect(pushHistory(['AAPL'], 'MSFT')).toEqual(['MSFT', 'AAPL']);
  });

  it('dedupes case-insensitively, moving the existing entry to the front', () => {
    expect(pushHistory(['Apple', 'AAPL'], 'apple')).toEqual(['apple', 'AAPL']);
  });

  it('caps at SEARCH_HISTORY_LIMIT', () => {
    const seed = ['A1', 'B2', 'C3', 'D4', 'E5'];
    const next = pushHistory(seed, 'F6');
    expect(next).toHaveLength(SEARCH_HISTORY_LIMIT);
    expect(next[0]).toBe('F6');
    expect(next).not.toContain('E5');
  });
});

describe('removeFromHistory', () => {
  it('removes case-insensitively', () => {
    expect(removeFromHistory(['Apple', 'AAPL'], 'APPLE')).toEqual(['AAPL']);
  });

  it('is a no-op when the query is absent', () => {
    expect(removeFromHistory(['AAPL'], 'MSFT')).toEqual(['AAPL']);
  });
});
