import type { AppProfile } from '../app-profile';

/** Apps retain market-specific metric extraction; bind the header/section parser here. */
export function createReportParser(profile: AppProfile) {
  /**
   * Parse a daily report markdown into structured data.
   * Extracts per-ticker sections with key metrics.
   */
  function parseReport(markdown: string): {
    date: string;
    generatedAt: string;
    tickers: string[];
    sections: Record<string, string>;
  } {
    const dateMatch = markdown.match(new RegExp(profile.report.datePattern, profile.report.dateFlags));
    const date = dateMatch?.[1] || '';

    // Extract generation timestamp: **產生時間**：2026-04-07 13:00 UTC
    const timeMatch = markdown.match(new RegExp(profile.report.generatedAtPattern, profile.report.generatedAtFlags));
    const generatedAt = timeMatch?.[1] || '';

    // Split by ## ticker sections
    const tickerPattern = new RegExp(profile.report.tickerPattern, 'gm');
    const tickers: string[] = [];
    let match;
    while ((match = tickerPattern.exec(markdown)) !== null) {
      if (!['最終總結', '🧠', '🤖'].some((s) => match![1].includes(s))) {
        tickers.push(match[1]);
      }
    }

    // Extract named sections
    const sections: Record<string, string> = {};
    const sectionPattern = /^## (.+)$/gm;
    const sectionStarts: { name: string; start: number }[] = [];
    while ((match = sectionPattern.exec(markdown)) !== null) {
      sectionStarts.push({ name: match[1], start: match.index });
    }
    for (let i = 0; i < sectionStarts.length; i++) {
      const end = i + 1 < sectionStarts.length ? sectionStarts[i + 1].start : markdown.length;
      sections[sectionStarts[i].name] = markdown.slice(sectionStarts[i].start, end).trim();
    }

    return { date, generatedAt, tickers, sections };
  }
  return { parseReport };
}
