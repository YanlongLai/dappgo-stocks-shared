import type { SummaryRewardController, SummaryRewardOffer } from './ai-summary-rewarded-types';

// Process-wide cadence survives reflow and remounts. Ordinary interstitials
// never interrupt a content reveal; a second reveal may offer a real reward.
let controller: SummaryRewardController | null = null;
let nextRevealOffersAd = false;
let earnedCredit = false;
let pending: Promise<boolean> | null = null;

export function registerAiSummaryRewarded(next: SummaryRewardController): () => void {
  controller = next;
  return () => { if (controller === next) controller = null; };
}

export function requestAiSummaryReveal(input: SummaryRewardOffer): boolean | Promise<boolean> {
  if (pending) return false;
  if (!nextRevealOffersAd || earnedCredit || !controller) return true;
  const owner = controller;
  try { if (!owner.canOffer()) return true; } catch { return true; }
  let offered: ReturnType<SummaryRewardController['offer']>;
  try { offered = owner.offer(input); } catch { return true; }
  const operation = offered.then((outcome) => {
    // Keep an earned credit if navigation/content changes before the card opens.
    if (outcome === 'earned') earnedCredit = true;
    return outcome !== 'cancelled';
  }).catch(() => true);
  const result = operation.finally(() => { if (pending === result) pending = null; });
  pending = result;
  return result;
}

/** Call only when the intended summary actually opens, never on rotation. */
export function notifyAiSummaryRevealed(): void {
  nextRevealOffersAd = !nextRevealOffersAd;
  earnedCredit = false;
}
