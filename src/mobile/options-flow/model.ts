/**
 * 選擇權量能 — compare put vs call strength across tickers (Options app).
 *
 * Reads `oi_distribution` (open interest, available today) and, when the
 * engine publishes it, `flow_summary` (volume ratio, 20-day mean, unusual
 * flag). Without `flow_summary` everything falls back to open interest.
 */

export interface FlowRow {
  symbol: string;
  /** Ratio used for colour and sorting: volume P/C when published, else OI P/C. */
  ratio: number;
  basis: 'volume' | 'oi';
  pcOi: number | null;
  pcVol: number | null;
  pcVol20d: number | null;
  /** Today's call+put volume ÷ its 20-day mean. */
  volumeVs20d: number | null;
  flag: 'unusual_put' | 'unusual_call' | 'unusual_volume' | null;
  callOi: number | null;
  putOi: number | null;
  callVolume: number | null;
  putVolume: number | null;
  /** −1 (all calls) … 0 (balanced, ratio 1) … +1 (put-heavy, ratio ≥ 3). */
  heat: number;
}

export type FlowSort = 'put' | 'call' | 'unusual' | 'total';

const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const rec = (v: unknown): Record<string, unknown> | null => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null);

/** Map a P/C ratio to −1…+1 on a log scale (0.33 → −1, 1 → 0, 3 → +1). */
export function ratioHeat(ratio: number): number {
  if (!finite(ratio) || ratio <= 0) return 0;
  return Math.max(-1, Math.min(1, Math.log(ratio) / Math.log(3)));
}

export function buildFlowRows(dd: unknown, minOi = 10_000): FlowRow[] {
  const d = rec(dd);
  const dist = rec(d?.oi_distribution) ?? {};
  const flowTickers = rec(rec(d?.flow_summary)?.tickers) ?? {};
  const rows: FlowRow[] = [];
  for (const [symbol, raw] of Object.entries(dist)) {
    const v = rec(raw);
    if (!v) continue;
    const callOi = finite(v.total_call_oi) ? v.total_call_oi : null;
    const putOi = finite(v.total_put_oi) ? v.total_put_oi : null;
    if ((callOi ?? 0) + (putOi ?? 0) < minOi) continue;
    const pcOi = finite(v.pc_oi_ratio) ? v.pc_oi_ratio : null;
    const f = rec(flowTickers[symbol]);
    const pcVol = f && finite(f.pc_vol_ratio) ? f.pc_vol_ratio : null;
    const ratio = pcVol ?? pcOi;
    if (ratio === null) continue;
    const flag = f?.flag === 'unusual_put' || f?.flag === 'unusual_call' || f?.flag === 'unusual_volume' ? f.flag : null;
    rows.push({
      symbol,
      ratio,
      basis: pcVol !== null ? 'volume' : 'oi',
      pcOi,
      pcVol,
      pcVol20d: f && finite(f.pc_vol_ratio_20d) ? f.pc_vol_ratio_20d : null,
      volumeVs20d: f && finite(f.volume_vs_20d) ? f.volume_vs_20d : null,
      flag,
      callOi,
      putOi,
      callVolume: f && finite(f.call_volume) ? f.call_volume : null,
      putVolume: f && finite(f.put_volume) ? f.put_volume : null,
      heat: ratioHeat(ratio),
    });
  }
  return rows;
}

export function sortFlowRows(rows: readonly FlowRow[], sort: FlowSort): FlowRow[] {
  const list = [...rows];
  const total = (r: FlowRow) => (r.callVolume ?? 0) + (r.putVolume ?? 0) || (r.callOi ?? 0) + (r.putOi ?? 0);
  switch (sort) {
    case 'call': return list.sort((a, b) => a.ratio - b.ratio || a.symbol.localeCompare(b.symbol));
    case 'unusual': return list.sort((a, b) => Number(!!b.flag) - Number(!!a.flag) || (b.volumeVs20d ?? 0) - (a.volumeVs20d ?? 0) || Math.abs(b.heat) - Math.abs(a.heat));
    case 'total': return list.sort((a, b) => total(b) - total(a));
    default: return list.sort((a, b) => b.ratio - a.ratio || a.symbol.localeCompare(b.symbol));
  }
}

export interface FlowSummary {
  count: number;
  putHeavy: number;
  callHeavy: number;
  /** Aggregate P/C over all rows (OI, or volume when every row has it). */
  aggregate: number | null;
  basis: 'volume' | 'oi';
  unusual: number;
}

export function summarizeFlow(rows: readonly FlowRow[], putAt = 1.1, callAt = 0.9): FlowSummary {
  const volumeBasis = rows.length > 0 && rows.every((r) => r.basis === 'volume');
  let num = 0; let den = 0;
  for (const r of rows) {
    if (volumeBasis) { num += r.putVolume ?? 0; den += r.callVolume ?? 0; }
    else { num += r.putOi ?? 0; den += r.callOi ?? 0; }
  }
  return {
    count: rows.length,
    putHeavy: rows.filter((r) => r.ratio > putAt).length,
    callHeavy: rows.filter((r) => r.ratio < callAt).length,
    aggregate: den > 0 ? Math.round((num / den) * 100) / 100 : null,
    basis: volumeBasis ? 'volume' : 'oi',
    unusual: rows.filter((r) => r.flag).length,
  };
}
