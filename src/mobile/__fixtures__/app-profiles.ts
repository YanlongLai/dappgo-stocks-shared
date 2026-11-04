/** Golden constants copied from the three origin/main revisions in the inventory. Test data only. */
import type { AppProfile } from '../app-profile';
import constants from './app-constants.json';
export const APP_PROFILES: readonly AppProfile[] = Object.values(constants) as AppProfile[];
