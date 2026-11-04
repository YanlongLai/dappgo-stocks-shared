import { createFetchWithTimeout, DEFAULT_FETCH_TIMEOUT_MS } from './fetch-with-timeout';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

test('each request gets an independent abort controller and clears its timer on success', async () => {
  const body = {} as Response;
  const fetcher = jest.fn().mockResolvedValue(body);
  const fetchWithTimeout = createFetchWithTimeout(fetcher);
  expect(await fetchWithTimeout('/one', { credentials: 'omit' })).toBe(body);
  await fetchWithTimeout('/two');
  expect(fetcher.mock.calls[0][1].signal).not.toBe(fetcher.mock.calls[1][1].signal);
  expect(jest.getTimerCount()).toBe(0);
});

test('the 15 second default aborts a stalled fetch and releases its timer', async () => {
  const fetcher = jest.fn((_input: RequestInfo | URL, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
  }));
  const pending = createFetchWithTimeout(fetcher)('/slow');
  const rejected = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  jest.advanceTimersByTime(DEFAULT_FETCH_TIMEOUT_MS - 1);
  expect(fetcher.mock.calls[0][1]?.signal?.aborted).toBe(false);
  jest.advanceTimersByTime(1);
  await rejected;
  expect(jest.getTimerCount()).toBe(0);
});

test('caller cancellation is forwarded and the listener is removed after completion', async () => {
  const caller = new AbortController();
  const remove = jest.spyOn(caller.signal, 'removeEventListener');
  let signal: AbortSignal | null | undefined;
  const fetcher = jest.fn(async (_input: RequestInfo | URL, init?: RequestInit) => { signal = init?.signal; return {} as Response; });
  await createFetchWithTimeout(fetcher)('/one', { signal: caller.signal }, 10);
  expect(remove).toHaveBeenCalledWith('abort', expect.any(Function));
  caller.abort();
  expect(signal?.aborted).toBe(false);
  await createFetchWithTimeout(fetcher)('/already-aborted', { signal: caller.signal });
  expect(signal?.aborted).toBe(true);
});

test('a network rejection clears timer and external listener', async () => {
  const caller = new AbortController();
  const remove = jest.spyOn(caller.signal, 'removeEventListener');
  const fetcher = jest.fn().mockRejectedValue(new Error('offline'));
  await expect(createFetchWithTimeout(fetcher)('/bad', { signal: caller.signal })).rejects.toThrow('offline');
  expect(jest.getTimerCount()).toBe(0);
  expect(remove).toHaveBeenCalledTimes(1);
});
