import type { AppProfile, StorePlatform } from '../app-profile';
import { createAdReporter, type AdFormat, type AdPlacement, type AdMeasurement, type TelemetryConsent } from './telemetry';

/**
 * App adapter supplies Platform.OS, the live consent getter and analytics sink.
 * Firebase, native ad SDK callbacks and consent subscriptions remain in the app.
 */
export function createAdMeasurement(
  profile: AppProfile,
  platform: StorePlatform,
  consent: () => TelemetryConsent,
  emit: (event: AdMeasurement) => void,
) {
  return (format: AdFormat, placement: AdPlacement) => createAdReporter(
    { app: profile.app, platform, format, placement }, consent, emit,
  );
}
