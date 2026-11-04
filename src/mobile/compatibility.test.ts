import { FullscreenAdmission as legacyAdmission } from '../ads/admission';
import { FullscreenAdmission } from './ads/admission';
import { resolveAdConsent as legacyConsent } from '../ads/consent';
import { resolveAdConsent } from './ads/consent';
import { startFullscreenController as legacyController } from '../ads/fullscreen-controller';
import { startFullscreenController } from './ads/fullscreen-controller';
import { canShowAppOpenOnRoute as legacyRoute } from '../ads/route-policy';
import { canShowAppOpenOnRoute } from './ads/route-policy';
import { startStartupAppOpenController as legacyStartup } from '../ads/startup-app-open-controller';
import { startStartupAppOpenController } from './ads/startup-app-open-controller';
import { createAdReporter as legacyReporter } from '../ads/telemetry';
import { createAdReporter } from './ads/telemetry';

test('all six existing ad entry points preserve runtime identity', () => {
  for (const [before, after] of [
    [legacyAdmission, FullscreenAdmission], [legacyConsent, resolveAdConsent],
    [legacyController, startFullscreenController], [legacyRoute, canShowAppOpenOnRoute],
    [legacyStartup, startStartupAppOpenController], [legacyReporter, createAdReporter],
  ]) { expect(typeof before).toBe('function'); expect(before).toBe(after); }
});
