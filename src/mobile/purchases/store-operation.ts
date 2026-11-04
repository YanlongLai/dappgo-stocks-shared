let operations = 0;
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) {
    try { listener(); } catch { /* Observers cannot change a native transaction's outcome. */ }
  }
}

export function isStoreOperationInProgress(): boolean { return operations > 0; }
export function subscribeStoreOperation(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

/** Includes SDK initialization and receipt reconciliation, not only the payment sheet. */
export async function runStoreOperation<T>(operation: () => Promise<T>): Promise<T> {
  operations++;
  notify();
  try { return await operation(); }
  finally {
    operations--;
    notify();
  }
}
