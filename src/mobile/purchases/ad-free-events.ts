export const AD_FREE_SOURCES = ['settings', 'banner', 'ai_summary', 'interstitial'] as const;
export type AdFreeSource = typeof AD_FREE_SOURCES[number];
export type AdFreeRestoreResult = 'restored' | 'none' | 'failed';

export type AdFreeEventMap = {
  adfree_sheet_view: { source: AdFreeSource };
  adfree_purchase_start: { source: AdFreeSource };
  adfree_purchase_success: { source: AdFreeSource };
  adfree_purchase_cancel: { source: AdFreeSource };
  adfree_purchase_fail: { source: AdFreeSource; code: string };
  adfree_restore_result: { result: AdFreeRestoreResult };
  adfree_entry_tap: { source: AdFreeSource };
  adfree_nudge_view: Record<string, never>;
  adfree_nudge_dismiss: Record<string, never>;
};
export type AdFreeEventName = keyof AdFreeEventMap;
export const AD_FREE_EVENT_NAMES: readonly AdFreeEventName[] = [
  'adfree_sheet_view', 'adfree_purchase_start', 'adfree_purchase_success', 'adfree_purchase_cancel',
  'adfree_purchase_fail', 'adfree_restore_result', 'adfree_entry_tap', 'adfree_nudge_view', 'adfree_nudge_dismiss',
];

export function isAdFreeSource(value: unknown): value is AdFreeSource {
  return typeof value === 'string' && (AD_FREE_SOURCES as readonly string[]).includes(value);
}

/** Builds the analytics payload; an unknown source is dropped to the safe default 'settings'. */
export function adFreeEvent<N extends AdFreeEventName>(name: N, params: AdFreeEventMap[N]): { name: N; params: Record<string, string> } {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (typeof value !== 'string') continue;
    out[key] = key === 'source' && !isAdFreeSource(value) ? 'settings' : key === 'code' ? value.slice(0, 40) : value;
  }
  return { name, params: out };
}
