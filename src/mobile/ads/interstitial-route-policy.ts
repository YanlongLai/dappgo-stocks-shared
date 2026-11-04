import type { AppProfile } from '../app-profile';
import { shouldShowFullscreenOnTransition } from './route-policy';

/** The app binds its profile once; router subscriptions remain in the app. */
export function createInterstitialRoutePolicy(profile: AppProfile) {
  return {
    shouldShowTimedInterstitialOnTransition(previous: string | null, next: string | null): boolean {
      return shouldShowFullscreenOnTransition(profile.app, previous, next);
    },
  };
}
