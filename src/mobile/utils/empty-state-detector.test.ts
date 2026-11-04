import { detectEmptyReason } from './empty-state-detector';

describe('detectEmptyReason', () => {
  it('returns no_data when data has not loaded yet', () => {
    expect(
      detectEmptyReason({
        dataLoaded: false,
        totalTickers: 0,
        filteredCount: 0,
        hasActiveFilter: false,
      }),
    ).toBe('no_data');
  });

  it('returns no_data when data is loaded but dataset is empty', () => {
    expect(
      detectEmptyReason({
        dataLoaded: true,
        totalTickers: 0,
        filteredCount: 0,
        hasActiveFilter: false,
      }),
    ).toBe('no_data');
  });

  it('returns normal when filtered list has items', () => {
    expect(
      detectEmptyReason({
        dataLoaded: true,
        totalTickers: 50,
        filteredCount: 12,
        hasActiveFilter: true,
      }),
    ).toBe('normal');
  });

  it('returns all_filtered_out when filters hide every ticker', () => {
    expect(
      detectEmptyReason({
        dataLoaded: true,
        totalTickers: 50,
        filteredCount: 0,
        hasActiveFilter: true,
      }),
    ).toBe('all_filtered_out');
  });

  it('returns empty_watchlist when data exists, no filter active, list is empty', () => {
    expect(
      detectEmptyReason({
        dataLoaded: true,
        totalTickers: 50,
        filteredCount: 0,
        hasActiveFilter: false,
      }),
    ).toBe('empty_watchlist');
  });
});
