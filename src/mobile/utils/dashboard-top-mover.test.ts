import { pickDashboardTopMover } from './dashboard-top-mover';

const ticker = (symbol: string, change: number, name = symbol) => ({
  symbol,
  name,
  price_change_pct: change,
});

describe('pickDashboardTopMover', () => {
  it('marks a positive largest move as a gainer', () => {
    expect(
      pickDashboardTopMover({
        AAPL: ticker('AAPL', 2.4),
        MSFT: ticker('MSFT', -1.1),
      }),
    ).toMatchObject({ symbol: 'AAPL', changePct: 2.4, direction: 'gainer' });
  });

  it('marks a negative largest move as a loser', () => {
    expect(
      pickDashboardTopMover({
        INTC: ticker('INTC', -6.09),
        NVDA: ticker('NVDA', 2.18),
      }),
    ).toMatchObject({ symbol: 'INTC', changePct: -6.09, direction: 'loser' });
  });

  it('marks a zero move as flat', () => {
    expect(pickDashboardTopMover({ SPY: ticker('SPY', 0) })).toMatchObject({
      symbol: 'SPY',
      direction: 'flat',
    });
  });

  it('returns null for empty or invalid data', () => {
    expect(pickDashboardTopMover({})).toBeNull();
    expect(
      pickDashboardTopMover({
        AAPL: { symbol: 'AAPL', price_change_pct: null },
        MSFT: { symbol: 'MSFT', price_change_pct: Number.NaN },
      }),
    ).toBeNull();
  });

  it('keeps the first ticker when absolute changes tie', () => {
    expect(
      pickDashboardTopMover({
        FIRST: ticker('FIRST', 2),
        SECOND: ticker('SECOND', -2),
      }),
    ).toMatchObject({ symbol: 'FIRST', direction: 'gainer' });
  });
});
