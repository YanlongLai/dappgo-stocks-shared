import type { SummaryRewardController } from './ai-summary-rewarded-types';

/** Web and unsupported native clients reveal content without an ad. */
export function startAiSummaryRewarded(): SummaryRewardController {
  return {
    canOffer: () => false,
    offer: async () => 'unavailable',
    stop: () => {},
  };
}
