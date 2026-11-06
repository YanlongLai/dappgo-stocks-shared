export type SummaryRewardOutcome = 'earned' | 'cancelled' | 'unavailable';

export interface SummaryRewardOffer {
  title: string;
  message: string;
  watch: string;
  cancel: string;
  isCurrent: () => boolean;
  /** The user chose to watch the ad on the reveal control itself (slide labelled "watch an ad"); skip the extra prompt. */
  optedIn?: boolean;
}

export interface SummaryRewardController {
  canOffer: () => boolean;
  offer: (input: SummaryRewardOffer) => Promise<SummaryRewardOutcome>;
  stop: () => void;
}
