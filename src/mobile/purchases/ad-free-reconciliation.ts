/**
 * RevenueCat can acknowledge a StoreKit transaction before its CustomerInfo
 * endpoint exposes the entitlement. Keep this window short and bounded so a
 * purchase cannot hang the UI or cause an unbounded request loop.
 */
export const POST_PURCHASE_RECONCILIATION_DELAYS_MS = [0, 750, 1500, 3000] as const;

type ReconciliationOptions<T> = {
  readCustomerInfo: () => Promise<T>;
  applyCustomerInfo: (info: T) => void;
  isEntitled: () => boolean;
  delaysMs?: readonly number[];
  wait?: (milliseconds: number) => Promise<void>;
};

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/**
 * Refresh CustomerInfo after a store transaction. A failed read is retried
 * within the same bounded window because the transaction may already be
 * complete even when the first RevenueCat read is stale or unavailable.
 */
export async function reconcileCustomerInfo<T>({
  readCustomerInfo,
  applyCustomerInfo,
  isEntitled,
  delaysMs = POST_PURCHASE_RECONCILIATION_DELAYS_MS,
  wait = delay,
}: ReconciliationOptions<T>): Promise<boolean> {
  for (const milliseconds of delaysMs) {
    if (milliseconds > 0) await wait(milliseconds);
    try {
      const info = await readCustomerInfo();
      applyCustomerInfo(info);
      if (isEntitled()) return true;
    } catch {
      // A later attempt may observe the transaction after store propagation.
    }
  }
  return isEntitled();
}
