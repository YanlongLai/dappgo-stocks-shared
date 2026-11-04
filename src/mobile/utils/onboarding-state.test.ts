import { isExistingUser, migrateOnboardingFlag } from './onboarding-state';

describe('onboarding persistence migration', () => {
  it('treats an empty legacy state as a first launch', () => {
    expect(migrateOnboardingFlag({ viewedReportDates: [], lastViewedReportCount: 0 })).toEqual({
      viewedReportDates: [],
      lastViewedReportCount: 0,
      hasCompletedOnboarding: false,
    });
  });

  it('marks a legacy active state as completed', () => {
    const state = { viewedReportDates: ['2026-08-01'], lastViewedReportCount: 0 };
    expect(isExistingUser(state)).toBe(true);
    expect(migrateOnboardingFlag(state).hasCompletedOnboarding).toBe(true);
  });

  it('preserves explicit false for a settings replay', () => {
    expect(migrateOnboardingFlag({ hasCompletedOnboarding: false, viewedReportDates: ['2026-08-01'] }))
      .toMatchObject({ hasCompletedOnboarding: false });
  });

  it('preserves explicit true for a completed onboarding state', () => {
    expect(migrateOnboardingFlag({ hasCompletedOnboarding: true })).toMatchObject({
      hasCompletedOnboarding: true,
    });
  });
});
