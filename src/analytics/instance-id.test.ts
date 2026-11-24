import { getAnalyticsInstanceId } from './instance-id';

describe('getAnalyticsInstanceId', () => {
  it('returns the trimmed id', async () => {
    await expect(getAnalyticsInstanceId(() => ({ getAppInstanceId: async () => ' abc123 ' }))).resolves.toBe('abc123');
  });
  it('is null when analytics is missing, empty or throws', async () => {
    await expect(getAnalyticsInstanceId(() => null)).resolves.toBeNull();
    await expect(getAnalyticsInstanceId(() => ({}))).resolves.toBeNull();
    await expect(getAnalyticsInstanceId(() => ({ getAppInstanceId: async () => '' }))).resolves.toBeNull();
    await expect(getAnalyticsInstanceId(() => ({ getAppInstanceId: async () => { throw new Error('x'); } }))).resolves.toBeNull();
    await expect(getAnalyticsInstanceId(() => { throw new Error('load'); })).resolves.toBeNull();
  });
});
