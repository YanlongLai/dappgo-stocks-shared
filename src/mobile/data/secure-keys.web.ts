/** A public browser is not a secret store; never downgrade SecureStore to localStorage. */
export async function getSecureKey(_key: string): Promise<string> { return ''; }
export async function setSecureKey(_key: string, _value: string): Promise<never> {
  throw new Error('web-secret-storage-unavailable: provider credentials are not supported in the browser');
}
