let allowed = false;
const listeners = new Set<() => void>();

/** Synchronous admission also guards native ads while React renders the blocker. */
export function isUpdateAccessAllowed(): boolean { return allowed; }
export function setUpdateAccessAllowed(next: boolean): void {
  if (next === allowed) return;
  allowed = next;
  for (const listener of listeners) {
    try { listener(); } catch { /* One ad observer cannot prevent access withdrawal. */ }
  }
}
export function subscribeUpdateAccess(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
