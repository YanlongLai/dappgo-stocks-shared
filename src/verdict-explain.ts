/**
 * Plain-language explanations of each verdict code, for users who don't
 * yet know what the model signal grades mean. Surface this on
 * the stock detail page next to the verdict badge so the meaning is
 * one tap away.
 *
 * Pure data — no React or theme dependency. Mirror in TW + US apps.
 */

export interface VerdictExplain {
  /** One-sentence operational meaning of the verdict. */
  meaning: string;
  /** What the model suggests watching next (research note, not a trade instruction). */
  action: string;
  /** Generic risk band. */
  risk: 'low' | 'medium' | 'high' | 'unknown';
}

const EXPLAIN: Record<string, VerdictExplain> = {
  BUY: {
    meaning: '多項偏多訊號同時出現（模型研究訊號）',
    action: '觀察下方支撐能否守穩，作為訊號延續的參考',
    risk: 'medium',
  },
  HOLD: {
    meaning: '偏多訊號多於偏空訊號，強度溫和',
    action: '觀察趨勢能否延續',
    risk: 'low',
  },
  WATCH: {
    meaning: '訊號中性，方向尚未明確',
    action: '方向未確認，觀察趨勢訊號是否成形',
    risk: 'low',
  },
  AVOID: {
    meaning: '偏空訊號浮現，波動風險偏高',
    action: '觀察支撐與波動變化',
    risk: 'high',
  },
  SELL: {
    meaning: '多項偏空訊號同時出現（模型研究訊號）',
    action: '觀察上方壓力與跌勢是否延續',
    risk: 'high',
  },
  HOT: {
    meaning: '板塊強勢，多檔個股漲幅同步擴大',
    action: '可觀察領漲個股的動能變化',
    risk: 'medium',
  },
  WARM: {
    meaning: '板塊偏多，整體氛圍正面但未過熱',
    action: '可觀察板塊內相對強勢的個股',
    risk: 'low',
  },
  NEUTRAL: {
    meaning: '板塊中性，無明顯趨勢',
    action: '板塊方向不明，個股訊號差異較大',
    risk: 'low',
  },
  COOL: {
    meaning: '板塊偏空，買盤動能不足',
    action: '觀察是否出現止跌訊號',
    risk: 'medium',
  },
  COLD: {
    meaning: '板塊弱勢，多檔個股同步下跌',
    action: '弱勢擴散，觀察是否出現止跌訊號',
    risk: 'high',
  },
};

export function explainVerdict(code: string): VerdictExplain | null {
  return EXPLAIN[code] ?? null;
}
