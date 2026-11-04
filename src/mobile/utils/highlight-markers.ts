/**
 * Inline highlight marker syntax — pure logic, no UI deps.
 *
 * Authoritative spec:
 *   https://github.com/YanlongLai/options-daily-report/blob/main/schemas/highlight-markers.md
 *
 * Keep in sync with:
 *   options-core/ai_analysis.py :: _MARKER_RE
 *   options-core/prompts/ai_commentary_v1.{zh,en}.md
 *   dappgo-website/options.html :: MARKER_RE
 */

export const MARKER_RX = /\[\[(pos|neg|key|warn|u):([^\]\r\n]{1,120})\]\]/g;

export type HlType = 'pos' | 'neg' | 'key' | 'warn' | 'u';

/** Extract plain text (markers stripped) — useful for previews / search. */
export function stripHighlights(text: string): string {
  return text.replace(MARKER_RX, (_m, _t, body) => body);
}
