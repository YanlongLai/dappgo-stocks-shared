/**
 * V2 Insight types mirroring dappgo-stocks-schema/v2/core.json#/$defs/Insight.
 *
 * These types are intentionally additive — optional fields degrade gracefully
 * when emitted by an older engine version that does not yet include them.
 *
 * Source of truth: ~/git/dappgo-stocks-schema/v2/core.json
 * See also: ~/git/dappgo-stocks-meta/docs/insight-catalog-v2.md
 */

/** Tier determines display priority and badge colour.
 *  Sort order: critical > warn > good > info > bad
 */
export type InsightTier = 'critical' | 'warn' | 'info' | 'good' | 'bad';

/** Analytical category — drives which insight templates apply. */
export type InsightCategory =
  | 'trend'
  | 'momentum'
  | 'volume'
  | 'ownership'
  | 'valuation'
  | 'risk'
  | 'events'
  | 'news'
  | 'flow'
  | 'relative_strength'
  | 'regime'
  | 'data_quality';

/** Machine-readable evidence block — facts shape is open (additionalProperties). */
export interface InsightEvidence {
  facts: Record<string, unknown>;
  method: string;
  computed_from: string[];
}

/** Trading thesis present only when the insight is strong enough to stand alone. */
export interface InsightThesis {
  what: string;
  what_to_do: string;
  risks: string[];
  time_horizon: string;
  sizing_hint?: 'full' | 'half' | 'quarter' | 'none';
}

/** Single analytical insight as emitted by the V2 engine in ticker_data[sym].insights[]. */
export interface Insight {
  id: string;
  asset_ref: string;
  category: InsightCategory;
  subcategory?: string;
  tier: InsightTier;
  actionable: boolean;
  question: string;
  answer: string;
  answer_short: string;
  explanation: string;
  evidence: InsightEvidence;
  thesis?: InsightThesis;
  confidence?: number;
  valid_from?: string;
  valid_until?: string;
}
