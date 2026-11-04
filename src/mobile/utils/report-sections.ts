/**
 * Parse a daily report markdown into ordered sections.
 *
 * The engine emits report bodies in this shape (after the rewrite):
 *
 *   ### 📌 今日重點
 *   ...body...
 *
 *   ---
 *
 *   ### 🌐 大盤總覽
 *   ...body...
 *
 *   ---
 *
 *   ### 🔥 板塊輪動
 *   ...
 *
 * Older reports may use level-2 (`## `) headings, different emoji, and no
 * `---` separators. We handle both: split by every level-3 OR level-2
 * heading boundary and strip surrounding `---` rules.
 *
 * Sections are keyed by emoji prefix so the screen can fetch a known slot
 * (`tldr`, `market`, ...) without caring about the exact 繁中 wording.
 */
export interface ReportSection {
  /** The full heading text minus the leading `### ` / `## `. */
  heading: string;
  /** Leading emoji in the heading, if any. */
  emoji: string;
  /** Stable slot key — see EMOJI_TO_KEY. Falls back to slugified heading. */
  key: string;
  /** Body text below the heading, trimmed. */
  body: string;
}

/** Known emoji → slot key. Add here as the engine adds new sections. */
const EMOJI_TO_KEY: Record<string, string> = {
  '📌': 'tldr',
  '🌐': 'market',
  '🔥': 'sectors',
  '⭐': 'focus',
  '📰': 'news',
  '📊': 'tickers',
  '🤖': 'ai_full',
  '🧠': 'ai_full', // legacy
  '🎯': 'focus',   // legacy
};

/**
 * Pull the leading emoji from a heading. Matches one or two codepoints —
 * skin-tone modifiers / variation selectors are stripped out by the regex
 * boundary so '⭐' and '⭐️' both work.
 */
function leadingEmoji(heading: string): string {
  // Match the first non-ascii codepoint (covers all the ones we care about).
  const m = heading.match(/^([^\x00-\x7F]+)/);
  if (!m) return '';
  // Take just the first visible char — drop variation selectors.
  return Array.from(m[1])[0] ?? '';
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9一-鿿]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
}

/**
 * Split markdown into ordered sections. Returns a Record keyed by slot key
 * (e.g. 'tldr', 'market', ...) — duplicate emoji keys keep the first.
 */
export function parseReportSections(markdown: string): Record<string, ReportSection> {
  if (!markdown) return {};

  // Split on any heading line (level 2 or 3). We capture the heading text
  // so we can rebuild section bodies without the heading.
  const lines = markdown.split('\n');
  const sections: ReportSection[] = [];
  let current: { heading: string; bodyLines: string[] } | null = null;

  const headingRe = /^#{2,3}\s+(.+?)\s*$/;

  for (const line of lines) {
    const m = line.match(headingRe);
    if (m) {
      if (current) {
        sections.push(finalizeSection(current.heading, current.bodyLines));
      }
      current = { heading: m[1].trim(), bodyLines: [] };
    } else if (current) {
      current.bodyLines.push(line);
    }
    // Lines before the first heading are dropped — usually the H1 title +
    // metadata which the screen renders separately.
  }
  if (current) {
    sections.push(finalizeSection(current.heading, current.bodyLines));
  }

  const out: Record<string, ReportSection> = {};
  for (const s of sections) {
    if (!out[s.key]) out[s.key] = s;
  }
  return out;
}

function finalizeSection(heading: string, bodyLines: string[]): ReportSection {
  const emoji = leadingEmoji(heading);
  const key = EMOJI_TO_KEY[emoji] ?? slug(heading);

  // Strip leading/trailing blank lines AND surrounding `---` horizontal
  // rules — the engine wraps each section in `\n\n---\n\n`.
  let body = bodyLines.join('\n').trim();
  body = body.replace(/^---+\s*/gm, '').replace(/\s*---+$/gm, '').trim();

  return { heading, emoji, key, body };
}

/**
 * Pull the first paragraph (or first 2 sentences) out of a section body —
 * useful for rendering a short verdict line on cards.
 */
export function firstParagraph(body: string): string {
  if (!body) return '';
  const para = body.split(/\n\s*\n/)[0] ?? body;
  return para.trim();
}
