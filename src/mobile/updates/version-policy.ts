import type { AppProfile } from '../app-profile';

export type StorePlatform = 'ios' | 'android';
export type NativeVersionIdentity = { applicationId: string | null; version: string | null };
export type VersionDecision = {
  status: 'allowed' | 'update-required';
  installedVersion: string;
  minimumVersion: string;
  revision: string;
};

const POLICY_URL = 'https://dappgo.com/mobile-version-policy.json';
const MAX_POLICY_LENGTH = 32_768;
let requestSequence = 0;

function versionParts(value: unknown): number[] {
  if (typeof value !== 'string' || !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(value)) {
    throw new Error('Invalid native or minimum version');
  }
  const parts = value.split('.').map(Number);
  if (!parts.every(Number.isSafeInteger)) throw new Error('Version component exceeds safe range');
  return parts;
}

export function compareVersions(installed: string, minimum: string): -1 | 0 | 1 {
  const left = versionParts(installed);
  const right = versionParts(minimum);
  for (let index = 0; index < 3; index++) {
    if (left[index] !== right[index]) return left[index] > right[index] ? 1 : -1;
  }
  return 0;
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid version policy');
  return value as Record<string, unknown>;
}

export function evaluateVersionPolicy(
  raw: unknown, native: NativeVersionIdentity, platform: StorePlatform, expectedApplicationId: string,
): VersionDecision {
  if (!native.applicationId || native.applicationId !== expectedApplicationId || !native.version ||
      (platform !== 'ios' && platform !== 'android')) throw new Error('Native application identity unavailable');
  const policy = record(raw);
  if (policy.schemaVersion !== 1 || typeof policy.revision !== 'string' ||
      !policy.revision.trim() || policy.revision.length > 80) throw new Error('Unsupported version policy');
  const apps = record(policy.apps);
  if (!Object.prototype.hasOwnProperty.call(apps, native.applicationId)) throw new Error('Application policy missing');
  const app = record(apps[native.applicationId]);
  const minimumVersion = record(app[platform]).minimumVersion;
  versionParts(minimumVersion);
  return {
    status: compareVersions(native.version, minimumVersion as string) >= 0 ? 'allowed' : 'update-required',
    installedVersion: native.version, minimumVersion: minimumVersion as string, revision: policy.revision,
  };
}

export async function fetchVersionPolicy(
  native: NativeVersionIdentity, platform: StorePlatform, expectedApplicationId: string,
  { fetcher = fetch, timeoutMs = 12_000 }: { fetcher?: typeof fetch; timeoutMs?: number } = {},
): Promise<VersionDecision> {
  const abort = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const request = (async () => {
      const nonce = `${Date.now().toString(36)}-${++requestSequence}`;
      const response = await fetcher(`${POLICY_URL}?request=${nonce}`, {
        method: 'GET', cache: 'no-store', credentials: 'omit', signal: abort.signal,
        headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' },
      });
      if (!response.ok) throw new Error('Version policy HTTP error');
      if (!/^application\/(?:[\w.+-]+\+)?json\b/i.test(response.headers.get('content-type') ?? '')) {
        throw new Error('Version policy response is not JSON');
      }
      if (Number(response.headers.get('content-length')) > MAX_POLICY_LENGTH) throw new Error('Version policy too large');
      const text = await response.text();
      if (text.length > MAX_POLICY_LENGTH) throw new Error('Version policy too large');
      return evaluateVersionPolicy(JSON.parse(text), native, platform, expectedApplicationId);
    })();
    return await Promise.race([
      request,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Version policy verification timed out')), timeoutMs);
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
    abort.abort();
  }
}

/** App adapter supplies native identity/platform and fetch; native reads stay there. */
export function createVersionPolicy(profile: AppProfile, options: { fetcher: typeof fetch; timeoutMs?: number }) {
  return {
    evaluateVersionPolicy(raw: unknown, native: NativeVersionIdentity, platform: StorePlatform): VersionDecision {
      return evaluateVersionPolicy(raw, native, platform, profile.applicationId);
    },
    fetchVersionPolicy(native: NativeVersionIdentity, platform: StorePlatform): Promise<VersionDecision> {
      return fetchVersionPolicy(native, platform, profile.applicationId, options);
    },
  };
}
