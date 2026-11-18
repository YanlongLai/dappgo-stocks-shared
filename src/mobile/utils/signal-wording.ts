/**
 * Display-time rewording of engine-generated signal summaries.
 *
 * The daily engines still write one-liners such as
 * 「今日 2 檔買進 / 5 檔賣出」 or "Today's report: 2 BUY / 5 SELL".
 * In the apps these read like trade instructions, so the display layer
 * rewrites the verdict counts into research-toned model-signal wording
 * (偏多訊號 / 偏空訊號). Engine data and signal logic are unchanged.
 *
 * Owner decision 2026-11-18: no 買進/賣出 (buy/sell) wording in the UI.
 */

const RULES: ReadonlyArray<readonly [RegExp, string]> = [
  // 繁中
  [/(\d+)\s*檔買進/g, '$1 檔偏多訊號'],
  [/(\d+)\s*檔賣出/g, '$1 檔偏空訊號'],
  [/中性觀望/g, '中性'],
  // 简中
  [/(\d+)\s*档买进/g, '$1 档偏多信号'],
  [/(\d+)\s*档卖出/g, '$1 档偏空信号'],
  [/中性观望/g, '中性'],
  // English verdict counts
  [/(\d+)\s+BUY\s*\/\s*(\d+)\s+SELL\b/g, '$1 bullish / $2 bearish signals'],
  [/(\d+)\s+BUY\b/g, '$1 bullish signals'],
  [/(\d+)\s+SELL\b/g, '$1 bearish signals'],
];

/** Rewrite engine verdict-count wording into model-signal wording. */
export function neutralizeSignalText(text: string): string;
export function neutralizeSignalText(text: string | null | undefined): string | null | undefined;
export function neutralizeSignalText(text: string | null | undefined): string | null | undefined {
  if (!text) return text;
  let out = text;
  for (const [pattern, replacement] of RULES) out = out.replace(pattern, replacement);
  return out;
}
