import {
  AD_FREE_NUDGE_INTERVAL_MS, INITIAL_AD_FREE_NUDGE_STATE, parseAdFreeNudgeState,
  recordAdFreeIntroShown, recordAdFreeNudgeDismissed, recordAdFreeNudgeShown, shouldOpenAdFreeIntro, shouldShowAdFreeNudge,
} from './ad-free-nudge';

const NOW = 1_800_000_000_000;
const show = (state: Parameters<typeof shouldShowAdFreeNudge>[0]['state'], entitled = false, now = NOW) => shouldShowAdFreeNudge({ entitled, now, state });

test('first time shows', () => { expect(show(INITIAL_AD_FREE_NUDGE_STATE)).toBe(true); });
test('never for entitled users', () => { expect(show(INITIAL_AD_FREE_NUDGE_STATE, true)).toBe(false); });
test('at most once per 7 days', () => {
  const state = { lastShownAt: NOW - AD_FREE_NUDGE_INTERVAL_MS + 1, dismissCount: 0, introShownAt: null };
  expect(show(state)).toBe(false);
  expect(show({ ...state, lastShownAt: NOW - AD_FREE_NUDGE_INTERVAL_MS })).toBe(true);
});
test('stays quiet when the clock moved backwards', () => { expect(show({ lastShownAt: NOW + 1000, dismissCount: 0, introShownAt: null })).toBe(false); });
test('never again after 3 dismissals', () => {
  const old = NOW - 100 * AD_FREE_NUDGE_INTERVAL_MS;
  expect(show({ lastShownAt: old, dismissCount: 2, introShownAt: null })).toBe(true);
  expect(show({ lastShownAt: old, dismissCount: 3, introShownAt: null })).toBe(false);
  expect(show({ lastShownAt: null, dismissCount: 4, introShownAt: null })).toBe(false);
});
test('record helpers are immutable and compose', () => {
  const shown = recordAdFreeNudgeShown(INITIAL_AD_FREE_NUDGE_STATE, NOW);
  expect(shown).toEqual({ lastShownAt: NOW, dismissCount: 0, introShownAt: null });
  expect(recordAdFreeNudgeDismissed(shown)).toEqual({ lastShownAt: NOW, dismissCount: 1, introShownAt: null });
  expect(INITIAL_AD_FREE_NUDGE_STATE).toEqual({ lastShownAt: null, dismissCount: 0, introShownAt: null });
});
test.each([[null], [undefined], [''], ['{bad'], ['{"lastShownAt":"x","dismissCount":-1}'], ['{"lastShownAt":null,"dismissCount":1.5}']])('malformed persisted state %p resets', raw => {
  expect(parseAdFreeNudgeState(raw)).toEqual(INITIAL_AD_FREE_NUDGE_STATE);
});
test('valid persisted state round-trips', () => {
  expect(parseAdFreeNudgeState(JSON.stringify({ lastShownAt: NOW, dismissCount: 2, introShownAt: NOW }))).toEqual({ lastShownAt: NOW, dismissCount: 2, introShownAt: NOW });
});

test('intro opens once per install, never for entitled users', () => {
  expect(shouldOpenAdFreeIntro({ entitled: false, state: INITIAL_AD_FREE_NUDGE_STATE })).toBe(true);
  expect(shouldOpenAdFreeIntro({ entitled: true, state: INITIAL_AD_FREE_NUDGE_STATE })).toBe(false);
  const after = recordAdFreeIntroShown(INITIAL_AD_FREE_NUDGE_STATE, NOW);
  expect(after).toEqual({ lastShownAt: null, dismissCount: 0, introShownAt: NOW });
  expect(shouldOpenAdFreeIntro({ entitled: false, state: after })).toBe(false);
  expect(INITIAL_AD_FREE_NUDGE_STATE.introShownAt).toBeNull();
});
test('intro and card rules are independent', () => {
  const after = recordAdFreeIntroShown(INITIAL_AD_FREE_NUDGE_STATE, NOW);
  expect(show(after)).toBe(true);
  const carded = recordAdFreeNudgeShown(INITIAL_AD_FREE_NUDGE_STATE, NOW);
  expect(shouldOpenAdFreeIntro({ entitled: false, state: carded })).toBe(true);
});
test('v1 state without introShownAt keeps its card history and allows the intro', () => {
  expect(parseAdFreeNudgeState('{"lastShownAt":5,"dismissCount":2}')).toEqual({ lastShownAt: 5, dismissCount: 2, introShownAt: null });
  expect(parseAdFreeNudgeState('{"lastShownAt":5,"dismissCount":2,"introShownAt":9}')).toEqual({ lastShownAt: 5, dismissCount: 2, introShownAt: 9 });
  expect(parseAdFreeNudgeState('{"introShownAt":"x"}').introShownAt).toBeNull();
});
