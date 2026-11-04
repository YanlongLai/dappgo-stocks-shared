export interface OnboardingPersistenceState {
  hasCompletedOnboarding?: unknown;
  viewedReportDates?: unknown;
  lastViewedReportCount?: unknown;
  lastViewedMatrixCount?: unknown;
}

export function isExistingUser(state: OnboardingPersistenceState): boolean {
  return (
    (Array.isArray(state.viewedReportDates) && state.viewedReportDates.length > 0) ||
    (typeof state.lastViewedReportCount === 'number' && state.lastViewedReportCount > 0) ||
    (typeof state.lastViewedMatrixCount === 'number' && state.lastViewedMatrixCount > 0)
  );
}

/**
 * Initialise onboarding only for legacy persisted data that did not have the
 * flag at all. An explicit false is a deliberate re-watch request and must
 * survive hydration and future app launches.
 */
export function migrateOnboardingFlag<T extends OnboardingPersistenceState>(
  state: T,
): T & { hasCompletedOnboarding: boolean } {
  if (typeof state.hasCompletedOnboarding === 'boolean') {
    return state as T & { hasCompletedOnboarding: boolean };
  }

  return {
    ...state,
    hasCompletedOnboarding: isExistingUser(state),
  };
}
