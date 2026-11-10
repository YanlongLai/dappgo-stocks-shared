export const AD_FREE_NUDGE_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;
export const AD_FREE_NUDGE_MAX_DISMISSALS = 3;

export type AdFreeNudgeState = Readonly<{
  /** Epoch ms of the last time the card was shown; null if never. */
  lastShownAt: number | null;
  dismissCount: number;
}>;
export const INITIAL_AD_FREE_NUDGE_STATE: AdFreeNudgeState = Object.freeze({ lastShownAt: null, dismissCount: 0 });

/**
 * Post-interstitial card rule: at most once per 7 days, never again after
 * 3 dismissals, never for entitled users.
 */
export function shouldShowAdFreeNudge(input: { entitled: boolean; now: number; state: AdFreeNudgeState }): boolean {
  const { entitled, now, state } = input;
  if (entitled) return false;
  if (state.dismissCount >= AD_FREE_NUDGE_MAX_DISMISSALS) return false;
  if (state.lastShownAt === null) return true;
  if (state.lastShownAt > now) return false; // clock moved backwards: stay quiet
  return now - state.lastShownAt >= AD_FREE_NUDGE_INTERVAL_MS;
}

export function recordAdFreeNudgeShown(state: AdFreeNudgeState, now: number): AdFreeNudgeState {
  return { ...state, lastShownAt: now };
}

export function recordAdFreeNudgeDismissed(state: AdFreeNudgeState): AdFreeNudgeState {
  return { ...state, dismissCount: state.dismissCount + 1 };
}

/** Tolerant parse of persisted JSON; anything malformed yields the initial state. */
export function parseAdFreeNudgeState(raw: string | null | undefined): AdFreeNudgeState {
  if (!raw) return INITIAL_AD_FREE_NUDGE_STATE;
  try {
    const value = JSON.parse(raw) as Partial<Record<keyof AdFreeNudgeState, unknown>>;
    const lastShownAt = typeof value.lastShownAt === 'number' && Number.isFinite(value.lastShownAt) ? value.lastShownAt : null;
    const dismissCount = typeof value.dismissCount === 'number' && Number.isInteger(value.dismissCount) && value.dismissCount >= 0 ? value.dismissCount : 0;
    return { lastShownAt, dismissCount };
  } catch { return INITIAL_AD_FREE_NUDGE_STATE; }
}
