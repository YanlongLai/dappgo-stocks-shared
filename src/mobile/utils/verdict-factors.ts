/**
 * Classify each verdict signal as bullish / bearish / neutral so the UI
 * can render a "為什麼" breakdown card.
 *
 * Pure function — no React or theme. Mirrors the engine's overall_verdict
 * logic in signals.py so the breakdown matches the verdict.
 */

export type FactorTone = 'bullish' | 'bearish' | 'neutral' | 'unknown';

export interface VerdictFactor {
  /** Human label for the signal axis (中文). Kept for backward compatibility;
   *  renderers should prefer `axisKey` via i18n. */
  axis: string;
  /** i18n key for the signal axis label (e.g. 'verdictFactor.trend').
   *  Optional so older test fixtures that build factors by hand still type-check;
   *  `breakdownVerdict` always sets it. */
  axisKey?: string;
  /** Raw label from engine, e.g. 'strong_up', 'overbought'. */
  rawLabel: string;
  /** One-line rationale from engine. */
  reason: string;
  /** Locale-safe English rationale when the engine generated one. */
  reason_en?: string | null;
  tone: FactorTone;
}

/** Map raw signal labels to tone. Mirrors engine's overall_verdict bullish/
 *  bearish counting in `signals.py`. */
function trendTone(label: string): FactorTone {
  if (label === 'strong_up' || label === 'up') return 'bullish';
  if (label === 'strong_down' || label === 'down') return 'bearish';
  if (label === 'sideways') return 'neutral';
  return 'unknown';
}

function momentumTone(label: string): FactorTone {
  if (label === 'bullish' || label === 'oversold') return 'bullish';  // oversold = bounce candidate
  if (label === 'bearish' || label === 'overbought') return 'bearish';
  if (label === 'neutral') return 'neutral';
  return 'unknown';
}

function volumeTone(label: string): FactorTone {
  if (label === 'surge' || label === 'active') return 'bullish';
  if (label === 'quiet') return 'bearish';
  if (label === 'normal') return 'neutral';
  return 'unknown';
}

function chipTone(label: string): FactorTone {
  // 籌碼面 — 'accumulating' (法人/內部人買進) bullish, 'distributing' bearish
  if (label === 'accumulating' || label === 'buying') return 'bullish';
  if (label === 'distributing' || label === 'selling') return 'bearish';
  if (label === 'balanced' || label === 'mixed' || label === 'none') return 'neutral';
  return 'unknown';
}

export interface SignalsLike {
  trend_label?: string;
  trend_reason?: string;
  trend_reason_en?: string | null;
  momentum_label?: string;
  momentum_reason?: string;
  momentum_reason_en?: string | null;
  volume_label?: string;
  volume_reason?: string;
  volume_reason_en?: string | null;
  // TW uses chip_label / chip_reason; US uses ownership_label / ownership_reason
  chip_label?: string;
  chip_reason?: string;
  chip_reason_en?: string | null;
  ownership_label?: string;
  ownership_reason?: string;
  ownership_reason_en?: string | null;
}

export function breakdownVerdict(signals: SignalsLike | undefined): VerdictFactor[] {
  if (!signals) return [];
  const factors: VerdictFactor[] = [];

  if (signals.trend_label) {
    factors.push({
      axis: '趨勢',
      axisKey: 'verdictFactor.trend',
      rawLabel: signals.trend_label,
      reason: signals.trend_reason ?? '',
      reason_en: signals.trend_reason_en ?? '',
      tone: trendTone(signals.trend_label),
    });
  }
  if (signals.momentum_label) {
    factors.push({
      axis: '動能',
      axisKey: 'verdictFactor.momentum',
      rawLabel: signals.momentum_label,
      reason: signals.momentum_reason ?? '',
      reason_en: signals.momentum_reason_en ?? '',
      tone: momentumTone(signals.momentum_label),
    });
  }
  if (signals.volume_label) {
    factors.push({
      axis: '量能',
      axisKey: 'verdictFactor.volume',
      rawLabel: signals.volume_label,
      reason: signals.volume_reason ?? '',
      reason_en: signals.volume_reason_en ?? '',
      tone: volumeTone(signals.volume_label),
    });
  }
  // Prefer ownership (US) over chip (TW legacy)
  const cLabel = signals.ownership_label ?? signals.chip_label;
  const cReason = signals.ownership_reason ?? signals.chip_reason;
  const cReasonEn = signals.ownership_reason_en ?? signals.chip_reason_en;
  if (cLabel) {
    factors.push({
      axis: '籌碼',
      axisKey: 'verdictFactor.chip',
      rawLabel: cLabel,
      reason: cReason ?? '',
      reason_en: cReasonEn ?? '',
      tone: chipTone(cLabel),
    });
  }
  return factors;
}

/** Rough confidence score 0-100 derived from factor agreement.
 *  All bullish or all bearish → high confidence. Mixed → low.
 *  Used by the UI to render a "信心分數" gauge. */
export function confidenceScore(factors: VerdictFactor[]): number {
  const bull = factors.filter((f) => f.tone === 'bullish').length;
  const bear = factors.filter((f) => f.tone === 'bearish').length;
  const total = factors.filter((f) => f.tone !== 'unknown').length;
  if (total === 0) return 0;
  const dominant = Math.max(bull, bear);
  // 100% confidence if all 4 align, scales linearly.
  return Math.round((dominant / total) * 100);
}
