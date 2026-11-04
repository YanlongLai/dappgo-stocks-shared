/**
 * Tests for the developer-mode version-tap easter egg pure logic.
 */

import { computeNextTap, DEV_MODE_TAP_THRESHOLD } from './version-tap';

describe('version-tap developer mode', () => {
  it('increments counter on each tap below threshold', () => {
    let count = 0;
    for (let i = 1; i < DEV_MODE_TAP_THRESHOLD; i++) {
      const { nextCount, activated } = computeNextTap(count);
      expect(activated).toBe(false);
      expect(nextCount).toBe(i);
      count = nextCount;
    }
  });

  it('resets count to 0 after idle (manual setState simulation)', () => {
    // In the UI, setTimeout calls setState({ versionTapCount: 0 })
    // We just verify the initial state after a simulated reset
    const resetCount = 0;
    const { nextCount, activated } = computeNextTap(resetCount);
    expect(activated).toBe(false);
    expect(nextCount).toBe(1);
  });

  it('activates and resets count when threshold of 7 is reached', () => {
    const count = DEV_MODE_TAP_THRESHOLD - 1; // one tap away
    const { nextCount, activated } = computeNextTap(count);
    expect(activated).toBe(true);
    expect(nextCount).toBe(0);
  });

  it('is a no-op state-wise when already at threshold (count 0 after reset)', () => {
    // After activation, versionTapCount is reset to 0 — next tap starts fresh
    const { nextCount, activated } = computeNextTap(0);
    expect(activated).toBe(false);
    expect(nextCount).toBe(1);
  });
});
