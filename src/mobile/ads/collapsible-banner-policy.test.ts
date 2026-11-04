import { BANNER_PAGE_SETTLE_MS, COLLAPSIBLE_INTERVAL_MS, createBottomBannerPolicy } from './collapsible-banner-policy';

test('requires three minutes of actual eligible reading before the first opportunity', () => {
  let now = 0;
  const policy = createBottomBannerPolicy(() => now);
  const page = Symbol();
  now = 600_000;
  expect(policy.reserve()).toBe(false);
  policy.setActive(page, true);
  now += COLLAPSIBLE_INTERVAL_MS - 1;
  expect(policy.remainingMs()).toBe(1);
  expect(policy.reserve()).toBe(false);
  now++;
  expect(policy.reserve()).toBe(true);
  expect(policy.remainingMs()).toBe(COLLAPSIBLE_INTERVAL_MS);
});

test('background, onboarding, purchase and blocked time cannot age the opportunity', () => {
  let now = 0;
  const policy = createBottomBannerPolicy(() => now);
  const page = Symbol();
  policy.setActive(page, true);
  now = 10_000;
  policy.setActive(page, false);
  now += 600_000;
  expect(policy.remainingMs()).toBe(170_000);
  policy.setActive(page, true);
  now += 170_000;
  expect(policy.reserve()).toBe(true);
});

test('focus changes and concurrent reading hosts share one non-refundable no-fill budget', () => {
  let now = 0;
  const policy = createBottomBannerPolicy(() => now);
  const dashboard = Symbol(); const detail = Symbol();
  policy.setActive(dashboard, true);
  now = 100_000;
  policy.setActive(detail, true);
  policy.setActive(dashboard, false);
  now = 180_000;
  expect(policy.reserve()).toBe(true);
  expect(policy.reserve()).toBe(false);
  policy.setActive(detail, false);
  policy.setActive(dashboard, true);
  expect(policy.reserve()).toBe(false);
  now += 180_000;
  expect(policy.reserve()).toBe(true);
});

test('a tap or continuing momentum defers expansion until three quiet seconds', () => {
  let now = 0;
  const policy = createBottomBannerPolicy(() => now);
  policy.setActive(Symbol(), true);
  now = 180_000;
  policy.noteInteraction();
  expect(policy.reserve()).toBe(false);
  now += 2_000;
  policy.noteInteraction();
  now += BANNER_PAGE_SETTLE_MS - 1;
  expect(policy.reserve()).toBe(false);
  now++;
  expect(policy.reserve()).toBe(true);
});
