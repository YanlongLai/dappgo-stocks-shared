/**
 * Firebase app instance id for the About page (internal test-device exclusion).
 *
 * The app passes its own lazy analytics loader so this module never imports
 * Firebase. Resolves to null when analytics is off, unavailable or throws.
 */
export interface InstanceIdSource {
  getAppInstanceId?: () => Promise<string | null | undefined>;
}

export async function getAnalyticsInstanceId(load: () => InstanceIdSource | null | undefined): Promise<string | null> {
  try {
    const id = await load()?.getAppInstanceId?.();
    return typeof id === 'string' && id.trim() ? id.trim() : null;
  } catch {
    return null;
  }
}
