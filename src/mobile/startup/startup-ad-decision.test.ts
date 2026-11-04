import { startupAdDecision } from './startup-ad-decision';
const granted = { ready: true, canRequestAds: true, analyticsStorage: false, adStorage: false, adUserData: false, adPersonalization: false, trackingAuthorized: true, trackingStatus: 'granted' as const };
test.each(['ios', 'android'])('%s waits for verified identity and privacy without treating pending as rejection', platform => {
  expect(startupAdDecision('unknown', granted, platform, true)).toBe('pending');
  expect(startupAdDecision('free_verified', { ...granted, ready: false }, platform, true)).toBe('pending');
  expect(startupAdDecision('free_verified', granted, platform, true)).toBe('allowed');
  expect(startupAdDecision('revoked_verified', granted, platform, true)).toBe('allowed');
});
test.each(['entitled_verified', 'entitled_cached', 'unavailable'] as const)('%s cannot request startup ads', status => {
  for (const platform of ['ios', 'android']) expect(startupAdDecision(status, granted, platform, true)).toBe('denied');
});
test('iOS waits for ATT while Android retains its UMP-controlled path', () => {
  expect(startupAdDecision('free_verified', { ...granted, trackingAuthorized: false, trackingStatus: 'pending' }, 'ios', true)).toBe('pending');
  expect(startupAdDecision('free_verified', { ...granted, trackingAuthorized: false, trackingStatus: 'denied' }, 'ios', true)).toBe('denied');
  expect(startupAdDecision('free_verified', { ...granted, trackingAuthorized: false, trackingStatus: 'denied' }, 'android', true)).toBe('allowed');
});
test.each(['ios', 'android'])('%s access withdrawal or consent denial prevents startup', platform => {
  expect(startupAdDecision('free_verified', granted, platform, false)).toBe('denied');
  expect(startupAdDecision('free_verified', { ...granted, canRequestAds: false }, platform, true)).toBe('denied');
});
