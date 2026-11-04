import type { AppProfile, StorePlatform } from '../app-profile';

/** The app opens these URLs through Linking; this module never opens a store. */
export function createUpdateTarget(profile: AppProfile) {
  return {
    UPDATE_APPLICATION_ID: profile.applicationId,
    updateStoreUrls(platform: StorePlatform): readonly string[] {
      return platform === 'ios'
        ? [`itms-apps://itunes.apple.com/app/id${profile.appleId}`, `https://apps.apple.com/app/id${profile.appleId}`]
        : [`market://details?id=${profile.applicationId}`, `https://play.google.com/store/apps/details?id=${profile.applicationId}`];
    },
  };
}
