import { VersionController } from './version-controller';
import type { VersionDecision } from './version-policy';

const allowed: VersionDecision = { status: 'allowed', installedVersion: '1.6.0', minimumVersion: '1.6.0', revision: '1' };
const required: VersionDecision = { ...allowed, status: 'update-required', minimumVersion: '1.7.0' };
const flush = async () => { await Promise.resolve(); await Promise.resolve(); };

function harness() {
  let busy = false;
  let storeListener = () => {};
  const check = jest.fn<Promise<VersionDecision>, []>().mockResolvedValue(allowed);
  const setAccessAllowed = jest.fn();
  const controller = new VersionController({ check, setAccessAllowed, isStoreBusy: () => busy,
    subscribeStore: (listener) => { storeListener = listener; return () => { storeListener = () => {}; }; } });
  return { controller, check, setAccessAllowed, setBusy: (value: boolean) => { busy = value; storeListener(); } };
}

it('blocks synchronously while checking and never keeps an old success after offline failure', async () => {
  const h = harness(); h.controller.start();
  expect(h.setAccessAllowed).toHaveBeenLastCalledWith(false);
  await flush(); expect(h.controller.getSnapshot().status).toBe('allowed');
  h.check.mockRejectedValueOnce(new Error('offline'));
  const retry = h.controller.requestCheck();
  expect(h.setAccessAllowed).toHaveBeenLastCalledWith(false);
  await retry; expect(h.controller.getSnapshot()).toEqual({ status: 'error', knownUpdate: null });
  await h.controller.requestCheck(); expect(h.controller.getSnapshot().status).toBe('allowed');
  h.controller.stop();
});

it('defers Android Activity resume checks throughout purchase/restore reconciliation', async () => {
  const h = harness(); h.controller.start(); await flush();
  h.setBusy(true);
  await h.controller.requestCheck();
  await h.controller.requestCheck();
  expect(h.check).toHaveBeenCalledTimes(1);
  expect(h.controller.getSnapshot().status).toBe('allowed');
  h.setBusy(false);
  expect(h.setAccessAllowed).toHaveBeenLastCalledWith(false);
  await flush(); expect(h.check).toHaveBeenCalledTimes(2);
  h.controller.stop();
});

it('retains a known update destination when re-verification fails', async () => {
  const h = harness(); h.check.mockResolvedValueOnce(required);
  h.controller.start(); await flush();
  h.check.mockRejectedValueOnce(new Error('timeout'));
  await h.controller.requestCheck();
  expect(h.controller.getSnapshot()).toEqual({ status: 'error', knownUpdate: required });
  expect(h.setAccessAllowed).toHaveBeenLastCalledWith(false);
  h.controller.stop();
});

it('ignores a stale allowed response after a newer check requires updating', async () => {
  const h = harness(); let stale!: (value: VersionDecision) => void;
  h.check.mockImplementationOnce(() => new Promise((resolve) => { stale = resolve; })).mockResolvedValueOnce(required);
  h.controller.start(); await h.controller.requestCheck();
  stale(allowed); await flush();
  expect(h.controller.getSnapshot()).toEqual(required);
  expect(h.setAccessAllowed).toHaveBeenLastCalledWith(false);
  h.controller.stop();
});

it('cannot unlock after its root lifecycle has stopped', async () => {
  const h = harness(); let finish!: (value: VersionDecision) => void;
  h.check.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
  h.controller.start(); h.controller.stop(); finish(allowed); await flush();
  expect(h.setAccessAllowed).toHaveBeenLastCalledWith(false);
});

it('keeps a verified session usable during coalesced automatic checks, then locks on failure', async () => {
  const h = harness(); h.controller.start(); await flush();
  let fail!: (reason: Error) => void;
  h.check.mockImplementationOnce(() => new Promise((_resolve, reject) => { fail = reject; }));
  const pending = h.controller.requestCheck({ background: true });
  expect(h.controller.requestCheck({ background: true })).toBe(pending);
  expect(h.check).toHaveBeenCalledTimes(2);
  expect(h.controller.getSnapshot()).toEqual(allowed);
  expect(h.setAccessAllowed).toHaveBeenLastCalledWith(true);
  fail(new Error('offline')); await pending;
  expect(h.controller.getSnapshot()).toEqual({ status: 'error', knownUpdate: null });
  expect(h.setAccessAllowed).toHaveBeenLastCalledWith(false);
  h.controller.stop();
});

it('does not blink on automatic success and immediately locks on a newly required update', async () => {
  const h = harness(); h.controller.start(); await flush();
  const observed: string[] = [];
  h.controller.subscribe(() => { observed.push(h.controller.getSnapshot().status); });
  await h.controller.requestCheck({ background: true });
  h.check.mockResolvedValueOnce(required);
  await h.controller.requestCheck({ background: true });
  expect(observed).toEqual(['allowed', 'update-required']);
  expect(h.setAccessAllowed).toHaveBeenLastCalledWith(false);
  h.controller.stop();
});

it('keeps cold start and a retry after offline failure strict, even when requested automatically', async () => {
  const h = harness(); let finish!: (value: VersionDecision) => void;
  h.check.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
  h.controller.start();
  const pending = h.controller.requestCheck({ background: true });
  expect(h.check).toHaveBeenCalledTimes(1);
  expect(h.controller.getSnapshot().status).toBe('checking');
  expect(h.setAccessAllowed).toHaveBeenLastCalledWith(false);
  finish(allowed); await pending;
  h.check.mockRejectedValueOnce(new Error('offline'));
  await h.controller.requestCheck({ background: true });
  h.check.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
  const retry = h.controller.requestCheck({ background: true });
  expect(h.controller.getSnapshot().status).toBe('checking');
  expect(h.setAccessAllowed).toHaveBeenLastCalledWith(false);
  finish(allowed); await retry; h.controller.stop();
});

it('withdraws access when a background response requires updating during an existing store operation', async () => {
  const h = harness(); h.controller.start(); await flush();
  let finish!: (value: VersionDecision) => void;
  h.check.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
  const pending = h.controller.requestCheck({ background: true });
  h.setBusy(true); finish(required); await pending;
  expect(h.controller.getSnapshot()).toEqual(required);
  expect(h.setAccessAllowed).toHaveBeenLastCalledWith(false);
  h.setBusy(false); h.controller.stop();
});

it('synchronously locks an explicit retry even while a silent check is already running', async () => {
  const h = harness(); h.controller.start(); await flush();
  let older!: (value: VersionDecision) => void;
  h.check.mockImplementationOnce(() => new Promise((resolve) => { older = resolve; }));
  const background = h.controller.requestCheck({ background: true });
  const retry = h.controller.requestCheck();
  expect(h.controller.getSnapshot().status).toBe('checking');
  expect(h.setAccessAllowed).toHaveBeenLastCalledWith(false);
  await retry; older(required); await background;
  expect(h.controller.getSnapshot()).toEqual(allowed);
  h.controller.stop();
});

it('starts a fresh request after stop/start and never joins a stopped generation', async () => {
  const h = harness(); let older!: (value: VersionDecision) => void;
  h.check.mockImplementationOnce(() => new Promise((resolve) => { older = resolve; }));
  h.controller.start(); h.controller.stop();
  h.check.mockResolvedValueOnce(required); h.controller.start();
  await h.controller.requestCheck({ background: true });
  expect(h.check).toHaveBeenCalledTimes(2);
  older(allowed); await flush();
  expect(h.controller.getSnapshot()).toEqual(required);
  expect(h.setAccessAllowed).toHaveBeenLastCalledWith(false); h.controller.stop();
});
