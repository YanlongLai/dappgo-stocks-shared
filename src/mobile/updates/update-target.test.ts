import { APP_PROFILES } from '../__fixtures__/app-profiles';
import { createUpdateTarget } from './update-target';

test.each(APP_PROFILES)('$app retains native identity and both platform store targets', (profile) => {
  const target = createUpdateTarget(profile);
  expect(target.UPDATE_APPLICATION_ID).toBe(profile.applicationId);
  expect(target.updateStoreUrls('ios')).toEqual([
    `itms-apps://itunes.apple.com/app/id${profile.appleId}`,
    `https://apps.apple.com/app/id${profile.appleId}`,
  ]);
  expect(target.updateStoreUrls('android')).toEqual([
    `market://details?id=${profile.applicationId}`,
    `https://play.google.com/store/apps/details?id=${profile.applicationId}`,
  ]);
});
