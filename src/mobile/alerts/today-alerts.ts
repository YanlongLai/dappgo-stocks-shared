/**
 * 今日提醒 (2.0.0): one concrete line per alert, with a number or direction.
 *   zone   → 「跌破估值下緣 · 182.30」 / 「升到偏高區間 · 412.00」 / 「回到估值區間 · 96.10」
 *   signal → 「訊號 偏多 → 中性」
 *   flow   → 「Put/Call 量 2.4 倍」 (stock apps) or 「P/C 2.40」 (Options)
 */
import type { ForYouItem } from '../personalization/model';

export interface AlertLabels {
  belowRange: (price: string) => string;
  aboveRange: (price: string) => string;
  backInRange: (price: string) => string;
  zoneChanged: string;
  signal: (from: string, to: string) => string;
  flow: (pc: string) => string;
  flowNoValue: string;
  /** Display name of a signal / verdict value. */
  signalName: (value: string) => string;
  formatPrice: (value: number) => string;
  formatRatio: (value: number) => string;
}

const BELOW = new Set(['below', 'deep_below', 'cheap', 'undervalued']);
const ABOVE = new Set(['above', 'far_above', 'expensive', 'overvalued']);
const INSIDE = new Set(['within', 'inside', 'fair']);

export function alertLine(item: ForYouItem, l: AlertLabels): string {
  const m = item.mark;
  if (item.change === 'zone') {
    const to = item.to ?? '';
    if (BELOW.has(to)) {
      const edge = m?.low ?? m?.price;
      return edge != null ? l.belowRange(l.formatPrice(edge)) : l.zoneChanged;
    }
    if (ABOVE.has(to)) {
      const edge = m?.price ?? m?.high;
      return edge != null ? l.aboveRange(l.formatPrice(edge)) : l.zoneChanged;
    }
    if (INSIDE.has(to)) return m?.price != null ? l.backInRange(l.formatPrice(m.price)) : l.zoneChanged;
    return l.zoneChanged;
  }
  if (item.change === 'signal') {
    return l.signal(l.signalName(item.from ?? '—'), l.signalName(item.to ?? '—'));
  }
  return m?.pc != null ? l.flow(l.formatRatio(m.pc)) : l.flowNoValue;
}

/** Rows shown on the card; the rest open in the sheet behind 「還有 N 則提醒 ›」. */
export const ALERT_PREVIEW_ROWS = 3;
