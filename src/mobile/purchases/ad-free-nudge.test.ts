import {
  AD_FREE_NUDGE_INTERVAL_MS, INITIAL_AD_FREE_NUDGE_STATE, parseAdFreeNudgeState,
  recordAdFreeNudgeDismissed, recordAdFreeNudgeShown, shouldShowAdFreeNudge,
} from './ad-free-nudge';

const NOW = 1_800_000_000_000;
const show = (state: Parameters<typeof shouldShowAdFreeNudge>[0]['state'], entitled = false, now = NOW) => shouldShowAdFreeNudge({ entitled, now, state });

test('first time shows', () => { expect(show(INITIAL_AD_FREE_NUDGE_STATE)).toBe(true); });
test('never for entitled users', () => { expect(show(INITIAL_AD_FREE_NUDGE_STATE, true)).toBe(false); });
test('at most once per 7 days', () => {
  const state = { lastShownAt: NOW - AD_FREE_NUDGE_INTERVAL_MS + 1, dismissCount: 0 };
  expect(show(state)).toBe(false);
  expect(show({ ...state, lastShownAt: NOW - AD_FREE_NUDGE_INTERVAL_MS })).toBe(true);
});
test('stays quiet when the clock moved backwards', () => { expect(show({ lastShownAt: NOW + 1000, dismissCount: 0 })).toBe(false); });
test('never again after 3 dismissals', () => {
  const old = NOW - 100 * AD_FREE_NUDGE_INTERVAL_MS;
  expect(show({ lastShownAt: old, dismissCount: 2 })).toBe(true);
  expect(show({ lastShownAt: old, dismissCount: 3 })).toBe(false);
  expect(show({ lastShownAt: null, dismissCount: 4 })).toBe(false);
});
test('record helpers are immutable and compose', () => {
  const shown = recordAdFreeNudgeShown(INITIAL_AD_FREE_NUDGE_STATE, NOW);
  expect(shown).toEqual({ lastShownAt: NOW, dismissCount: 0 });
  expect(recordAdFreeNudgeDismissed(shown)).toEqual({ lastShownAt: NOW, dismissCount: 1 });
  expect(INITIAL_AD_FREE_NUDGE_STATE).toEqual({ lastShownAt: null, dismissCount: 0 });
});
test.each([[null], [undefined], [''], ['{bad'], ['{"lastShownAt":"x","dismissCount":-1}'], ['{"lastShownAt":null,"dismissCount":1.5}']])('malformed persisted state %p resets', raw => {
  expect(parseAdFreeNudgeState(raw)).toEqual(INITIAL_AD_FREE_NUDGE_STATE);
});
test('valid persisted state round-trips', () => {
  expect(parseAdFreeNudgeState(JSON.stringify({ lastShownAt: NOW, dismissCount: 2 }))).toEqual({ lastShownAt: NOW, dismissCount: 2 });
});
