export type SummaryRewardOutcome = 'earned' | 'cancelled' | 'unavailable';

export interface SummaryRewardOffer {
  title: string;
  message: string;
  watch: string;
  cancel: string;
  isCurrent: () => boolean;
}

export interface SummaryRewardController {
  canOffer: () => boolean;
  offer: (input: SummaryRewardOffer) => Promise<SummaryRewardOutcome>;
  stop: () => void;
}
