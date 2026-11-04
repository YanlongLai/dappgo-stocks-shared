import { moverChipText } from './weekly-movers-format';
import type { VerdictMover } from './weekly-movers-format';

const make = (overrides: Partial<VerdictMover> = {}): VerdictMover => ({
  symbol: 'AAPL',
  from: 'HOLD',
  to: 'BUY',
  days_ago: 2,
  ...overrides,
});

describe('moverChipText', () => {
  it('formats an upgrade chip correctly', () => {
    expect(moverChipText(make({ symbol: 'NVDA', from: 'HOLD', to: 'BUY', days_ago: 1 }))).toBe(
      'NVDA HOLD→BUY (1天前)',
    );
  });

  it('formats a downgrade chip correctly', () => {
    expect(moverChipText(make({ symbol: 'META', from: 'BUY', to: 'WATCH', days_ago: 3 }))).toBe(
      'META BUY→WATCH (3天前)',
    );
  });

  it('handles days_ago of 0', () => {
    expect(moverChipText(make({ days_ago: 0 }))).toBe('AAPL HOLD→BUY (0天前)');
  });

  it('handles missing optional fields gracefully via required interface', () => {
    const m: VerdictMover = { symbol: 'TSLA', from: 'SELL', to: 'AVOID', days_ago: 7 };
    expect(moverChipText(m)).toBe('TSLA SELL→AVOID (7天前)');
  });
});
