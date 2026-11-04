/** No browser anonymous account, private auth state or Firebase SDK. */
export async function ensureAuth(): Promise<null> { return null; }
export const getExistingAuthUid = (): null => null;
export function onUid(callback: (uid: string | null) => void): () => void {
  callback(null);
  return () => undefined;
}
