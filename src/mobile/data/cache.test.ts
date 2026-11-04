import { createMemoryCache } from './cache';
import { APP_PROFILES } from '../__fixtures__/app-profiles';
const { dedupe, clearCache } = createMemoryCache(APP_PROFILES[0]);

beforeEach(() => {
  clearCache();
});

describe('dedupe', () => {
  it('calls fn exactly once when invoked twice concurrently', async () => {
    const fn = jest.fn().mockResolvedValue('result');

    const [p1, p2] = [dedupe('key', fn), dedupe('key', fn)];
    const [r1, r2] = await Promise.all([p1, p2]);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(r1).toBe('result');
    expect(r2).toBe('result');
  });

  it('fires fn again after the first promise resolves (registry cleaned)', async () => {
    const fn = jest.fn().mockResolvedValue('result');

    await dedupe('key', fn);
    await dedupe('key', fn);

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('cleans the registry on rejection so subsequent calls can retry', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('transient'))
      .mockResolvedValueOnce('ok');

    await expect(dedupe('key', fn)).rejects.toThrow('transient');

    // After rejection the registry must be cleared.
    const result = await dedupe('key', fn);
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
