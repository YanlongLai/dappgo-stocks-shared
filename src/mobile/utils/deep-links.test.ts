import { createDeepLinks } from './deep-links';
import { APP_PROFILES } from '../__fixtures__/app-profiles';
const { generateReportLink, generateBacktestLink, generateMatrixLink } = createDeepLinks(APP_PROFILES[0]);

describe('deep-links', () => {
  describe('generateReportLink', () => {
    it('builds the expected scheme + path for a date', () => {
      expect(generateReportLink('2026-04-22')).toBe(
        'dappgooptionsapp://report/2026-04-22'
      );
    });
  });

  describe('generateBacktestLink', () => {
    it('encodes symbol, strategy, and numeric otmPct', () => {
      const url = generateBacktestLink('TSLA', 'sell_put', 5);
      expect(url).toBe(
        'dappgooptionsapp://backtest?symbol=TSLA&strategy=sell_put&otm=5'
      );
    });

    it('URL-encodes symbols with special characters', () => {
      const url = generateBacktestLink('BRK.B', 'sell_call', 10);
      expect(url).toBe(
        'dappgooptionsapp://backtest?symbol=BRK.B&strategy=sell_call&otm=10'
      );
    });

    it('URL-encodes ampersand and space edge cases', () => {
      const url = generateBacktestLink('A B&C', 'iron_condor', 7);
      expect(url).toContain('symbol=A%20B%26C');
      expect(url).toContain('strategy=iron_condor');
      expect(url).toContain('otm=7');
    });

    it('round-trips through URL parsing', () => {
      const url = generateBacktestLink('NVDA', 'bull_put_spread', 3.5);
      // expo-linking uses a URL-like parser; Node's URL supports custom schemes
      // if we strip the scheme, but here we assert query params survive decoding
      const qs = url.split('?')[1] ?? '';
      const params = Object.fromEntries(
        qs.split('&').map((p) => {
          const [k, v] = p.split('=');
          return [k, decodeURIComponent(v)];
        })
      );
      expect(params.symbol).toBe('NVDA');
      expect(params.strategy).toBe('bull_put_spread');
      expect(params.otm).toBe('3.5');
    });
  });

  describe('generateMatrixLink', () => {
    it('encodes the symbol in the query', () => {
      expect(generateMatrixLink('AMZN')).toBe(
        'dappgooptionsapp://matrix?symbol=AMZN'
      );
    });

    it('escapes special characters in symbol', () => {
      expect(generateMatrixLink('A&B')).toBe(
        'dappgooptionsapp://matrix?symbol=A%26B'
      );
    });
  });
});
