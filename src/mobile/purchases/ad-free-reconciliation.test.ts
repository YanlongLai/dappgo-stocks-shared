import { reconcileCustomerInfo } from './ad-free-reconciliation';

describe('post-purchase CustomerInfo reconciliation', () => {
  it('stops as soon as the entitlement appears', async () => {
    const waits: number[] = [];
    let entitled = false;
    const result = await reconcileCustomerInfo({
      delaysMs: [0, 10, 20],
      wait: async (milliseconds) => { waits.push(milliseconds); },
      readCustomerInfo: async () => {
        if (waits.length === 1) entitled = true;
        return { entitled };
      },
      applyCustomerInfo: () => {},
      isEntitled: () => entitled,
    });

    expect(result).toBe(true);
    expect(waits).toEqual([10]);
  });

  it('continues through transient read failures but remains bounded', async () => {
    let attempts = 0;
    let entitled = false;
    const result = await reconcileCustomerInfo({
      delaysMs: [0, 1, 2],
      wait: async () => {},
      readCustomerInfo: async () => {
        attempts += 1;
        if (attempts < 3) throw new Error('CustomerInfo not propagated yet');
        return { active: true };
      },
      applyCustomerInfo: (info) => { entitled = Boolean((info as { active?: boolean }).active); },
      isEntitled: () => entitled,
    });

    expect(result).toBe(true);
    expect(attempts).toBe(3);
  });

  it('returns false after the bounded window when no entitlement is exposed', async () => {
    let attempts = 0;
    const result = await reconcileCustomerInfo({
      delaysMs: [0, 1, 2, 3],
      wait: async () => {},
      readCustomerInfo: async () => { attempts += 1; return {}; },
      applyCustomerInfo: () => {},
      isEntitled: () => false,
    });

    expect(result).toBe(false);
    expect(attempts).toBe(4);
  });
});
