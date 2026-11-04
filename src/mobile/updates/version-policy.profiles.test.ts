import { APP_PROFILES } from '../__fixtures__/app-profiles';
import { createVersionPolicy } from './version-policy';

test.each(APP_PROFILES)('$app accepts only its native application identity', async (profile) => {
  const raw = { schemaVersion: 1, revision: '20261103', apps: Object.fromEntries(APP_PROFILES.map(app => [app.applicationId, {
    ios: { minimumVersion: '1.2.3' }, android: { minimumVersion: '1.2.4' },
  }])) };
  const fetcher = jest.fn().mockResolvedValue({ ok: true, headers: new Headers({ 'content-type': 'application/json' }), text: async () => JSON.stringify(raw) });
  const policy = createVersionPolicy(profile, { fetcher });
  const native = { applicationId: profile.applicationId, version: '1.2.3' };
  expect(policy.evaluateVersionPolicy(raw, native, 'ios').status).toBe('allowed');
  expect((await policy.fetchVersionPolicy(native, 'android')).status).toBe('update-required');
  expect(fetcher.mock.calls[0][0]).toMatch(/^https:\/\/dappgo\.com\/mobile-version-policy\.json\?request=/);
  const sibling = APP_PROFILES.find(app => app.app !== profile.app)!;
  expect(() => policy.evaluateVersionPolicy(raw, { ...native, applicationId: sibling.applicationId }, 'ios')).toThrow('identity');
});
