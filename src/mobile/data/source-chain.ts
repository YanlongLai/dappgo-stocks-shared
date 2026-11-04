import type { AppProfile } from '../app-profile';
import { createFetchWithTimeout, type FetchImplementation } from './fetch-with-timeout';
import { publicJsonRequest } from './public-request';

/**
 * App adapter supplies its profile, fetch implementation and platform request
 * options (Metro's native/web public-request variants). Schema parsing, retries,
 * cache ownership and offline storage stay in each market's data adapter.
 * Force-refresh never creates a new CDN cache key: publishers purge stable URLs.
 */
export function sourceUrls(profile: AppProfile, path: string, gatewayPath = path): string[] {
  const { githubOwner: owner, githubRepo: repo, market, gatewayBaseUrl } = profile.data;
  const gateway = gatewayBaseUrl.replace(/\/+$/, '');
  return [
    `https://cdn.jsdelivr.net/gh/${owner}/${repo}@main/${path}`,
    gateway ? `${gateway}/markets/${market}/${gatewayPath}` : null,
    `https://raw.githubusercontent.com/${owner}/${repo}/main/${path}`,
  ].filter((url): url is string => url !== null);
}

export function createDataSourceChain(profile: AppProfile, {
  fetcher,
  requestInit = publicJsonRequest,
  timeoutMs,
}: {
  fetcher: FetchImplementation;
  requestInit?: () => RequestInit;
  timeoutMs?: number;
}) {
  const fetchWithTimeout = createFetchWithTimeout(fetcher);
  async function attempt<T>(path: string, gatewayPath: string, decode: (response: Response) => Promise<T>): Promise<T> {
    let lastError: unknown;
    const init = requestInit();
    for (const url of sourceUrls(profile, path, gatewayPath)) {
      try {
        const response = await fetchWithTimeout(url, init, timeoutMs);
        if (!response.ok) throw new Error(`${url} returned ${response.status}`);
        return await decode(response);
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError ?? new Error(`Unable to fetch ${path}`);
  }
  return {
    fetchOrFallback(path: string, _force = false, gatewayPath = path): Promise<Response> {
      return attempt(path, gatewayPath, async (response) => response);
    },
    fetchJsonWithFallback<T>(path: string, _force = false, gatewayPath = path): Promise<T> {
      return attempt(path, gatewayPath, (response) => response.json() as Promise<T>);
    },
  };
}

export type ReportLanguage = 'zh' | 'en';
export function reportPathForLanguage(date: string, language: ReportLanguage = 'zh'): string {
  return language === 'en' ? `reports/${date}.en.md` : `reports/${date}.md`;
}
