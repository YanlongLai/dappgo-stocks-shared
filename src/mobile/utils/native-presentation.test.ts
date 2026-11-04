import { beginNativePresentation, isNativePresentationInProgress, subscribeNativePresentation, withNativePresentation } from './native-presentation';

it('retains the native presenter until every active form has actually finished', async () => {
  const listener = jest.fn(); const stop = subscribeNativePresentation(listener);
  let finish!: (value: string) => void;
  const form = withNativePresentation(() => new Promise<string>((resolve) => { finish = resolve; }));
  const ad = beginNativePresentation();
  expect(isNativePresentationInProgress()).toBe(true);
  finish('dismissed'); await expect(form).resolves.toBe('dismissed');
  expect(isNativePresentationInProgress()).toBe(true);
  ad(); ad(); expect(isNativePresentationInProgress()).toBe(false);
  expect(listener).toHaveBeenCalledTimes(4); stop();
});

it('does not strand presenter ownership after a rejected or synchronously throwing native API', async () => {
  await expect(withNativePresentation(async () => { throw new Error('native'); })).rejects.toThrow('native');
  expect(isNativePresentationInProgress()).toBe(false);
  await expect(withNativePresentation(() => { throw new Error('sync'); })).rejects.toThrow('sync');
  expect(isNativePresentationInProgress()).toBe(false);
});
