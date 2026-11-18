import { neutralizeSignalText } from './signal-wording';

describe('neutralizeSignalText', () => {
  it('rewrites the TW engine one-liner verdict counts', () => {
    expect(neutralizeSignalText('今日 2 檔買進 / 5 檔賣出，市場環境風險規避（波動偏高）。'))
      .toBe('今日 2 檔偏多訊號 / 5 檔偏空訊號，市場環境風險規避（波動偏高）。');
  });

  it('drops 觀望 from the neutral regime wording', () => {
    expect(neutralizeSignalText('今日 36 檔個股，市場環境中性觀望（SPY 橫盤整理 = 中性觀望）。'))
      .toBe('今日 36 檔個股，市場環境中性（SPY 橫盤整理 = 中性）。');
  });

  it('rewrites the English one-liner', () => {
    expect(neutralizeSignalText("Today's report: 2 BUY / 5 SELL, market regime: risk-off."))
      .toBe("Today's report: 2 bullish / 5 bearish signals, market regime: risk-off.");
    expect(neutralizeSignalText('3 BUY today')).toBe('3 bullish signals today');
  });

  it('rewrites simplified Chinese counts', () => {
    expect(neutralizeSignalText('今日 1 档买进 / 0 档卖出')).toBe('今日 1 档偏多信号 / 0 档偏空信号');
  });

  it('leaves unrelated text and empty values alone', () => {
    expect(neutralizeSignalText('借券賣出餘額創新高')).toBe('借券賣出餘額創新高');
    expect(neutralizeSignalText("Today's report: 36 tickers")).toBe("Today's report: 36 tickers");
    expect(neutralizeSignalText(null)).toBeNull();
    expect(neutralizeSignalText(undefined)).toBeUndefined();
    expect(neutralizeSignalText('')).toBe('');
  });
});
