jest.mock('react-native-purchases', () => { throw new Error('Native billing must never load on web'); }, { virtual: true });
import {
  canRequestAdsForEntitlement, getAdFreeSnapshot, getAdFreeProductId,
  initializeAdFree, isAdFreeEntitledNow, purchaseAdFree, restoreAdFree,
} from './ad-free.web';

it('keeps ads off without claiming a paid entitlement or exposing a store product', async () => {
  await initializeAdFree();
  expect(canRequestAdsForEntitlement()).toBe(false);
  expect(isAdFreeEntitledNow()).toBe(false);
  expect(getAdFreeProductId()).toBeNull();
  expect(getAdFreeSnapshot().localizedPrice).toBeNull();
});

it('cannot create or restore a purchase through the browser adapter', async () => {
  const initial = getAdFreeSnapshot();
  expect(await purchaseAdFree()).toBe(initial);
  expect(await restoreAdFree()).toBe(initial);
  expect(getAdFreeSnapshot()).toBe(initial);
  expect(initial.status).toBe('unavailable');
  expect(canRequestAdsForEntitlement()).toBe(false);
});
