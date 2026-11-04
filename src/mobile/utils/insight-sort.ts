/**
 * Sorting utilities for V2 Insight arrays.
 *
 * Canonical tier order: critical → warn → good → info → bad
 * Stable within same tier (preserves engine emission order).
 */

import type { Insight, InsightTier } from './insight-types';

const TIER_ORDER: Record<InsightTier, number> = {
  critical: 0,
  warn: 1,
  good: 2,
  info: 3,
  bad: 4,
};

/**
 * Returns a new array sorted by tier severity (critical first).
 * Stable sort: insights with the same tier retain their original order.
 */
export function sortInsightsByTier(insights: Insight[]): Insight[] {
  return [...insights].sort(
    (a, b) => (TIER_ORDER[a.tier] ?? 99) - (TIER_ORDER[b.tier] ?? 99),
  );
}
