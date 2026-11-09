export type SummaryRewardOutcome = 'earned' | 'cancelled' | 'unavailable';

export interface SummaryRewardOffer {
  title: string;
  message: string;
  watch: string;
  cancel: string;
  isCurrent: () => boolean;
  /** The user chose to watch the ad on the reveal control itself (slide labelled "watch an ad"); skip the extra prompt. */
  optedIn?: boolean;
  /** Optional third choice in the prompt (e.g. "Remove ads forever"). Choosing it ends the offer as cancelled and runs `onRemoveAds`. */
  removeAds?: string;
  onRemoveAds?: () => void;
}

export interface SummaryRewardController {
  canOffer: () => boolean;
  offer: (input: SummaryRewardOffer) => Promise<SummaryRewardOutcome>;
  stop: () => void;
}
