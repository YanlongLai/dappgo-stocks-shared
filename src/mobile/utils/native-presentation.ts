const presentations = new Set<symbol>();
const listeners = new Set<() => void>();
function notify() { for (const listener of listeners) { try { listener(); } catch { /* Keep other observers current. */ } } }

/** Native ads own their presenter until the SDK's close/error event. */
export function beginNativePresentation(): () => void {
  const key = Symbol('native-presentation');
  presentations.add(key); notify();
  return () => { if (presentations.delete(key)) notify(); };
}
export function isNativePresentationInProgress(): boolean { return presentations.size > 0; }
export function subscribeNativePresentation(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

/** Consent/permission APIs resolve after their own native form has finished. */
export async function withNativePresentation<T>(present: () => Promise<T>): Promise<T> {
  const end = beginNativePresentation();
  try { return await present(); }
  finally { end(); }
}
