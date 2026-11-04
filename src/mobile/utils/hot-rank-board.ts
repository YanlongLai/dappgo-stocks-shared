/**
 * hot-rank-board.ts — pure helper for the 今日熱股 leaderboard.
 *
 * Consumes per-ticker hot_rank engine output and returns the top-N entries
 * sorted by score descending, filtered to score >= 60 (warm or hot tier).
 */

export interface HotRankInput {
  symbol: string;
  name: string;
  hot_rank?: { score?: number | null; tier?: string | null; drivers?: string[] | null } | null;
  price_change_pct?: number | null;
  signals?: { verdict?: string | null } | null;
}

export interface HotRankBoardEntry {
  symbol: string;
  name: string;
  score: number;
  tier: string;
  drivers: string[];
  priceChangePct: number | null;
  verdict: string | null;
}

const MIN_SCORE = 60;
const DEFAULT_LIMIT = 5;

/**
 * Returns the top-N hot-rank entries sorted by score descending.
 * Filters out entries with score < MIN_SCORE (cold / neutral tiers).
 */
export function pickHotRankBoard(
  items: HotRankInput[],
  limit: number = DEFAULT_LIMIT,
): HotRankBoardEntry[] {
  const result: HotRankBoardEntry[] = [];

  for (const item of items) {
    const score = item.hot_rank?.score ?? null;
    if (score === null || score < MIN_SCORE) continue;

    result.push({
      symbol: item.symbol,
      name: item.name ?? item.symbol,
      score,
      tier: item.hot_rank?.tier ?? 'warm',
      drivers: item.hot_rank?.drivers ?? [],
      priceChangePct: item.price_change_pct ?? null,
      verdict: item.signals?.verdict ?? null,
    });
  }

  result.sort((a, b) => b.score - a.score);
  return result.slice(0, limit);
}
