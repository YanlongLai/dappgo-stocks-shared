import { compareVersions, evaluateVersionPolicy, fetchVersionPolicy } from './version-policy';

const identity = { applicationId: 'com.dappgo.usstocksapp', version: '1.6.0' };
const policy = (minimumVersion = '1.6.0') => ({
  schemaVersion: 1, revision: 'test-1',
  apps: { [identity.applicationId]: { ios: { minimumVersion }, android: { minimumVersion } } },
});
const response = (body: unknown, status = 200, contentType = 'application/json') => ({
  ok: status >= 200 && status < 300, status,
  headers: { get: (name: string) => name.toLowerCase() === 'content-type' ? contentType : null },
  text: async () => JSON.stringify(body),
}) as Response;

describe('native minimum supported version', () => {
  it.each([
    ['1.6.0', '1.6.0', 0], ['1.6.1', '1.6.0', 1], ['1.5.99', '1.6.0', -1],
    ['1.10.0', '1.9.99', 1], ['2.0.0', '1.99.99', 1],
  ])('compares %s against %s numerically', (installed, minimum, expected) => {
    expect(compareVersions(installed, minimum)).toBe(expected);
  });
  it.each(['', '1.6', '1.6.0-beta', '01.6.0', '1.6.-1', '1.6.NaN', '1.6.9007199254740992'])('rejects ambiguous version %s', (version) => {
    expect(() => compareVersions(version, '1.6.0')).toThrow();
  });
  it.each(['ios', 'android'] as const)('allows the review candidate and newer %s versions, blocks older clients', (platform) => {
    expect(evaluateVersionPolicy(policy(), identity, platform, identity.applicationId).status).toBe('allowed');
    expect(evaluateVersionPolicy(policy(), { ...identity, version: '1.7.0' }, platform, identity.applicationId).status).toBe('allowed');
    expect(evaluateVersionPolicy(policy(), { ...identity, version: '1.5.19' }, platform, identity.applicationId).status).toBe('update-required');
  });
  it('keeps the two platform floors independent', () => {
    const value = policy(); value.apps[identity.applicationId].android.minimumVersion = '1.7.0';
    expect(evaluateVersionPolicy(value, identity, 'ios', identity.applicationId).status).toBe('allowed');
    expect(evaluateVersionPolicy(value, identity, 'android', identity.applicationId).status).toBe('update-required');
  });
  it.each([
    null, {}, { ...policy(), schemaVersion: 2 }, { ...policy(), revision: '' },
    { ...policy(), apps: {} }, { ...policy(), apps: { [identity.applicationId]: { ios: {} } } },
    policy('not-a-version'),
  ])('blocks malformed or missing policy rather than trusting a bundled fallback', (value) => {
    expect(() => evaluateVersionPolicy(value, identity, 'ios', identity.applicationId)).toThrow();
  });
  it('requires the exact native app identity and native installed version', () => {
    for (const native of [{ ...identity, applicationId: null }, { ...identity, applicationId: 'host.exp.Exponent' }, { ...identity, version: null }]) {
      expect(() => evaluateVersionPolicy(policy(), native, 'ios', identity.applicationId)).toThrow();
    }
  });
});

describe('online policy verification', () => {
  it('requests the canonical anonymous endpoint without stale cache and evaluates its response', async () => {
    const fetcher = jest.fn(async () => response(policy()));
    const result = await fetchVersionPolicy(identity, 'android', identity.applicationId, { fetcher });
    expect(result.status).toBe('allowed');
    expect(fetcher).toHaveBeenCalledWith(expect.stringMatching(/^https:\/\/dappgo\.com\/mobile-version-policy\.json\?request=/), expect.objectContaining({ cache: 'no-store', credentials: 'omit' }));
  });
  it.each([response(policy(), 503), response(policy(), 200, 'text/html'), response({}), response('not json')])('does not unlock on an invalid HTTP or JSON response', async (value) => {
    await expect(fetchVersionPolicy(identity, 'ios', identity.applicationId, { fetcher: async () => value })).rejects.toThrow();
  });
  it('bounds fetch and response body reading, even if the native request never settles', async () => {
    jest.useFakeTimers();
    const result = fetchVersionPolicy(identity, 'ios', identity.applicationId, { fetcher: () => new Promise(() => {}), timeoutMs: 500 });
    const rejected = expect(result).rejects.toThrow('timed out');
    await jest.advanceTimersByTimeAsync(500);
    await rejected;
    jest.useRealTimers();
  });
  it('never falls back to a previously successful offline decision', async () => {
    await expect(fetchVersionPolicy(identity, 'ios', identity.applicationId, { fetcher: async () => response(policy()) })).resolves.toMatchObject({ status: 'allowed' });
    await expect(fetchVersionPolicy(identity, 'ios', identity.applicationId, { fetcher: async () => { throw new Error('offline'); } })).rejects.toThrow('offline');
  });
});

describe('compareVersions across the 2.0.0 major (2026-11 rename)', () => {
  it.each([
    ['2.0.0', '1.12.1', 1], ['2.0.0', '1.12.0', 1], ['2.0.0', '1.9.9', 1], ['2.0.0', '1.99.99', 1],
    ['1.12.1', '2.0.0', -1], ['1.8.6', '2.0.0', -1], ['2.0.0', '2.0.0', 0], ['2.0.1', '2.0.0', 1],
    ['2.1.0', '2.0.9', 1], ['10.0.0', '2.0.0', 1], ['1.10.0', '1.9.0', 1],
  ] as const)('%s vs %s → %d', (a, b, want) => {
    expect(compareVersions(a, b)).toBe(want);
  });

  it('a 1.x install is told to update once the minimum is 2.0.0, and 2.0.0 passes a 1.x minimum', () => {
    const policy = { schemaVersion: 1, revision: 'r', apps: { 'com.x': { ios: { minimumVersion: '2.0.0' }, android: { minimumVersion: '1.12.0' } } } };
    expect(evaluateVersionPolicy(policy, { applicationId: 'com.x', version: '1.12.0' }, 'ios', 'com.x').status).toBe('update-required');
    expect(evaluateVersionPolicy(policy, { applicationId: 'com.x', version: '2.0.0' }, 'ios', 'com.x').status).toBe('allowed');
    expect(evaluateVersionPolicy(policy, { applicationId: 'com.x', version: '2.0.0' }, 'android', 'com.x').status).toBe('allowed');
  });
});
