const holds = new Set<symbol>();
const listeners = new Set<() => void>();
function notify() { for (const listener of listeners) { try { listener(); } catch { /* Do not strand another observer. */ } } }

/** A same-root guide must never compete with a native full-screen ad. */
export function holdAppAdsForUi(): () => void {
  const hold = Symbol('ui');
  holds.add(hold);
  notify();
  return () => {
    if (!holds.delete(hold)) return;
    notify();
  };
}

export function isAppAdUiBlocked(): boolean { return holds.size > 0; }
export function subscribeAppAdUi(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
