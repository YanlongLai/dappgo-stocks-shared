import type { SummaryRewardController, SummaryRewardOffer } from './ai-summary-rewarded-types';

let notify: typeof import('./ai-summary-interstitial').notifyAiSummaryRevealed;
let request: typeof import('./ai-summary-interstitial').requestAiSummaryReveal;
let register: typeof import('./ai-summary-interstitial').registerAiSummaryRewarded;
const offer: SummaryRewardOffer = { title: 'AI summary', message: 'Watch to open', watch: 'Watch ad', cancel: 'Not now', isCurrent: () => true };
function makeController(): SummaryRewardController {
  return { canOffer: jest.fn(() => true), offer: jest.fn(async () => 'earned'), stop: jest.fn() };
}
beforeEach(() => {
  jest.resetModules();
  ({ notifyAiSummaryRevealed: notify, requestAiSummaryReveal: request, registerAiSummaryRewarded: register } = require('./ai-summary-interstitial'));
});

test('only reveals 2, 4 and 6 offer a reward after the first free reveal', async () => {
  const controller = makeController(); register(controller);
  for (let reveal = 1; reveal <= 6; reveal++) {
    expect(await request(offer)).toBe(true); notify();
    expect(controller.offer).toHaveBeenCalledTimes(Math.floor(reveal / 2));
  }
});

test('cancelling does not reveal or consume the second opportunity', async () => {
  const controller = makeController(); register(controller); notify();
  jest.mocked(controller.offer).mockResolvedValueOnce('cancelled');
  expect(await request(offer)).toBe(false);
  expect(await request(offer)).toBe(true); notify();
  expect(controller.offer).toHaveBeenCalledTimes(2);
  expect(await request(offer)).toBe(true);
  expect(controller.offer).toHaveBeenCalledTimes(2);
});

test('earned credit survives navigation until a summary actually opens', async () => {
  const controller = makeController(); register(controller); notify();
  expect(await request(offer)).toBe(true);
  // The first view unmounted: no notify. Its replacement receives the reward.
  expect(await request(offer)).toBe(true);
  expect(controller.offer).toHaveBeenCalledTimes(1); notify();
  expect(await request(offer)).toBe(true); notify();
  expect(await request(offer)).toBe(true);
  expect(controller.offer).toHaveBeenCalledTimes(2);
});

test('an in-flight offer prevents duplicates and old cleanup preserves its replacement', async () => {
  const first = makeController(); const cleanup = register(first); notify();
  let finish!: (outcome: 'earned') => void;
  jest.mocked(first.offer).mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
  const pending = request(offer); expect(request(offer)).toBe(false);
  const next = makeController(); register(next); cleanup(); expect(request(offer)).toBe(false);
  finish('earned'); expect(await pending).toBe(true); notify();
  expect(await request(offer)).toBe(true); notify();
  expect(await request(offer)).toBe(true); expect(next.offer).toHaveBeenCalledTimes(1);
});

test.each(['no controller', 'not ready', 'readiness throws', 'offer throws', 'offer rejects', 'unavailable'])('%s opens without a queued popup', async mode => {
  const controller = makeController();
  if (mode !== 'no controller') register(controller);
  if (mode === 'not ready') jest.mocked(controller.canOffer).mockReturnValue(false);
  if (mode === 'readiness throws') jest.mocked(controller.canOffer).mockImplementation(() => { throw Error('SDK'); });
  if (mode === 'offer throws') jest.mocked(controller.offer).mockImplementation(() => { throw Error('SDK'); });
  if (mode === 'offer rejects') jest.mocked(controller.offer).mockRejectedValue(Error('SDK'));
  if (mode === 'unavailable') jest.mocked(controller.offer).mockResolvedValue('unavailable');
  notify(); expect(await request(offer)).toBe(true); notify();
  const replacement = makeController(); register(replacement);
  expect(replacement.offer).not.toHaveBeenCalled();
  expect(await request(offer)).toBe(true); expect(replacement.offer).not.toHaveBeenCalled();
});

test('web fallback never requests a native reward', async () => {
  const controller = require('./ai-summary-rewarded.ts').startAiSummaryRewarded();
  expect(controller.canOffer()).toBe(false); expect(await controller.offer(offer)).toBe('unavailable');
  register(controller); notify(); expect(await request(offer)).toBe(true);
});
