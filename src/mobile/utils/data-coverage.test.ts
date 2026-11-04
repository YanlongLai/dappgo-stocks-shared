import { buildDataCoverage, resolveDataCoverage } from './data-coverage';

describe('US data coverage', () => {
  it('marks a complete report when every expected ticker is covered', () => {
    const result = buildDataCoverage(['MSFT', 'AAPL'], ['aapl', 'msft', 'NVDA']);
    expect(result).toMatchObject({
      expected_count: 2,
      covered_count: 2,
      missing_count: 0,
      coverage_ratio: 1,
      status: 'complete',
    });
  });

  it('uses explicit engine coverage before legacy derivation', () => {
    const result = resolveDataCoverage({
      tickers: ['AAPL', 'MSFT'],
      ticker_data: { AAPL: {} },
      data_coverage: { expected_tickers: ['AAPL', 'MSFT'], covered_tickers: ['MSFT'] },
    }, ['AAPL']);
    expect(result?.covered_tickers).toEqual(['MSFT']);
    expect(result?.missing_tickers).toEqual(['AAPL']);
  });

  it('accepts the opt-in 4x capacity without a parser cap', () => {
    const tickers = Array.from({ length: 344 }, (_, index) => `US${index}`);
    const result = buildDataCoverage(tickers, tickers);
    expect(result).toMatchObject({ expected_count: 344, covered_count: 344, status: 'complete' });
  });
});
