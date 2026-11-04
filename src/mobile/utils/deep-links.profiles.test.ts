import { APP_PROFILES } from '../__fixtures__/app-profiles';
import { createDeepLinks } from './deep-links';

test.each(APP_PROFILES)('$app preserves the current legacy helper scheme', (profile) => {
  const links = createDeepLinks(profile);
  // US/TW's copied helper also currently says dappgooptionsapp. Migration preserves it.
  expect(links.generateReportLink('2026-11-03')).toBe('dappgooptionsapp://report/2026-11-03');
  expect(links.generateMatrixLink('A&B')).toBe('dappgooptionsapp://matrix?symbol=A%26B');
  expect(links.generateBacktestLink('A B', 'sell_put', 5)).toBe('dappgooptionsapp://backtest?symbol=A%20B&strategy=sell_put&otm=5');
});

test('binding another profile never changes a previously bound scheme', () => {
  const original = createDeepLinks(APP_PROFILES[0]);
  const other = createDeepLinks({ ...APP_PROFILES[0], legacyDeepLinkScheme: 'custom' });
  expect(other.generateReportLink('date')).toBe('custom://report/date');
  expect(original.generateReportLink('date')).toBe('dappgooptionsapp://report/date');
});
