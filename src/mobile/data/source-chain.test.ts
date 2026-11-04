import { APP_PROFILES } from '../__fixtures__/app-profiles';
import { createDataSourceChain, reportPathForLanguage, sourceUrls } from './source-chain';

const response = (body: unknown) => ({ ok: true, json: async () => body }) as Response;

test.each(APP_PROFILES)('$app preserves owner, repository, market and stable source order', async (profile) => {
  const withGateway = { ...profile, data: { ...profile.data, gatewayBaseUrl: 'https://data.example/v1///' } };
  const expected = [
    `https://cdn.jsdelivr.net/gh/YanlongLai/${profile.data.githubRepo}@main/dashboard/manifest.json`,
    `https://data.example/v1/markets/${profile.data.market}/reports/index.json`,
    `https://raw.githubusercontent.com/YanlongLai/${profile.data.githubRepo}/main/dashboard/manifest.json`,
  ];
  expect(sourceUrls(withGateway, 'dashboard/manifest.json', 'reports/index.json')).toEqual(expected);
  const fetcher = jest.fn()
    .mockRejectedValueOnce(new Error('offline CDN'))
    .mockResolvedValueOnce({ ok: true, json: async () => { throw new SyntaxError('invalid gateway JSON'); } })
    .mockResolvedValueOnce(response({ reports: [] }));
  const chain = createDataSourceChain(withGateway, { fetcher });
  expect(await chain.fetchJsonWithFallback('dashboard/manifest.json', true, 'reports/index.json')).toEqual({ reports: [] });
  expect(fetcher.mock.calls.map(([url]) => url)).toEqual(expected);
  expect(fetcher.mock.calls.every(([url]) => !String(url).includes('?'))).toBe(true);
});

test('an absent gateway is skipped, HTTP failures advance and the last failure propagates', async () => {
  const profile = APP_PROFILES[0];
  const fetcher = jest.fn().mockResolvedValue({ ok: false, status: 503 });
  await expect(createDataSourceChain(profile, { fetcher }).fetchOrFallback('dashboard/latest.json')).rejects.toThrow('returned 503');
  expect(fetcher).toHaveBeenCalledTimes(2);
  expect(fetcher.mock.calls[1][0]).toContain('raw.githubusercontent.com');
});

test('a successful source short-circuits and request adapters control browser credentials', async () => {
  const body = response({ hash: 'abc' });
  const fetcher = jest.fn().mockResolvedValue(body);
  const requestInit = () => ({ credentials: 'omit' as const });
  expect(await createDataSourceChain(APP_PROFILES[0], { fetcher, requestInit }).fetchOrFallback('dashboard/latest.json')).toBe(body);
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(fetcher.mock.calls[0][1]).toEqual({ credentials: 'omit', signal: expect.any(AbortSignal) });
});

test('report locale paths preserve the canonical filename contract', () => {
  expect(reportPathForLanguage('2026-11-03')).toBe('reports/2026-11-03.md');
  expect(reportPathForLanguage('2026-11-03', 'en')).toBe('reports/2026-11-03.en.md');
});
