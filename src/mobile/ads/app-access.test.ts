import { canUseAppAds, subscribeAppAdAccess } from './app-access';
import { setUpdateAccessAllowed } from '../updates/update-access';
import { isStoreOperationInProgress, runStoreOperation } from '../purchases/store-operation';
import { holdAppAdsForUi } from './ui-ad-access';

afterEach(() => setUpdateAccessAllowed(false));

it('suppresses ads before version verification, during a native purchase, and after access is withdrawn', async () => {
  expect(canUseAppAds()).toBe(false);
  const listener = jest.fn(); const stop = subscribeAppAdAccess(listener);
  setUpdateAccessAllowed(true); expect(canUseAppAds()).toBe(true);
  await runStoreOperation(async () => {
    expect(isStoreOperationInProgress()).toBe(true);
    expect(canUseAppAds()).toBe(false);
    await Promise.resolve();
    expect(canUseAppAds()).toBe(false);
  });
  expect(canUseAppAds()).toBe(true);
  setUpdateAccessAllowed(false); expect(canUseAppAds()).toBe(false);
  expect(listener).toHaveBeenCalledTimes(4);
  stop();
});

it('does not strand native operation admission after failure or overlap', async () => {
  setUpdateAccessAllowed(true);
  await expect(runStoreOperation(async () => { throw new Error('receipt'); })).rejects.toThrow('receipt');
  expect(isStoreOperationInProgress()).toBe(false);
  let finish!: () => void;
  const first = runStoreOperation(() => new Promise<void>((resolve) => { finish = resolve; }));
  await runStoreOperation(async () => {});
  expect(canUseAppAds()).toBe(false);
  finish(); await first;
  expect(canUseAppAds()).toBe(true);
});

it('blocks ads throughout onboarding, including nested overlays, without marking the guide complete', () => {
  setUpdateAccessAllowed(true);
  const listener = jest.fn(); const stop = subscribeAppAdAccess(listener);
  const guide = holdAppAdsForUi(); const second = holdAppAdsForUi();
  expect(canUseAppAds()).toBe(false);
  guide(); guide(); expect(canUseAppAds()).toBe(false);
  second(); expect(canUseAppAds()).toBe(true);
  expect(listener).toHaveBeenCalledTimes(4); stop();
});
