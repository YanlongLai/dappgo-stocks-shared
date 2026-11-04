/**
 * The app supplies fetch (or its native/public-request wrapper). This helper owns
 * only the attempt's abort controller and timer, forwarding caller cancellation.
 * Response decoding, retries and offline persistence belong to the caller.
 */
export type FetchImplementation = typeof fetch;
export const DEFAULT_FETCH_TIMEOUT_MS = 15_000;
export const FETCH_TIMEOUT_MS = DEFAULT_FETCH_TIMEOUT_MS;

export function createFetchWithTimeout(fetcher: FetchImplementation) {
  return async function fetchWithTimeout(
    input: RequestInfo | URL,
    init: RequestInit = {},
    timeoutMs: number = DEFAULT_FETCH_TIMEOUT_MS,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const externalSignal = init.signal;
    const abortFromCaller = () => controller.abort();
    if (externalSignal?.aborted) controller.abort();
    else externalSignal?.addEventListener('abort', abortFromCaller, { once: true });
    try {
      return await fetcher(input, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
      externalSignal?.removeEventListener('abort', abortFromCaller);
    }
  };
}
