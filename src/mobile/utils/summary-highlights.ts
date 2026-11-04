import { MARKER_RX } from './highlight-markers';

const FIGURE_OR_RISK = /(?:(?:US|NT)?\$|[€£¥])\s?[+−-]?\d[\d,]*(?:\.\d+)?|[+−-]?\d[\d,]*(?:\.\d+)?\s?[%％]|風險|注意事項|\b(?:risks?|caution)\b/gi;
const RISK = /風險|注意事項|\b(?:risks?|caution)\b/i;

/** Only call on parsed Markdown text nodes, never on the Markdown source.
 * Links, destinations, code and formatting remain owned by the renderer.
 * Explicit figures use key color; risk labels use warn. No sentiment is inferred.
 */
export function highlightSummaryText(text: string, emphasized = false): string {
  const decorate = (part: string) => {
    if (part.includes('[[')) return part;
    if (emphasized && part.trim() && part.length <= 120 && !/[\]\r\n]/.test(part)) {
      return `[[${RISK.test(part) ? 'warn' : 'key'}:${part}]]`;
    }
    return part.replace(FIGURE_OR_RISK, (value) =>
      `[[${RISK.test(value) ? 'warn' : 'key'}:${value}]]`,
    );
  };
  let result = '';
  let offset = 0;
  for (const match of text.matchAll(MARKER_RX)) {
    const start = match.index ?? 0;
    result += decorate(text.slice(offset, start)) + match[0];
    offset = start + match[0].length;
  }
  return result + decorate(text.slice(offset));
}
