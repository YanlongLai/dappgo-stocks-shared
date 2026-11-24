/**
 * 重點 — the three short points a reader sees first when an AI summary opens.
 *
 * The Chinese AI notes run long (US per-stock notes ≈ 200 字, the TW market
 * summary ≈ 1,000 字 because the engine joins every batch summary). The app
 * shows up to three points of at most ~40 字, each carrying a figure, and
 * keeps the whole text behind 「看全文」. Everything here is a pure rule over
 * text the app already has: no engine or prompt change.
 *
 * Only Chinese text is condensed; other languages keep their full text.
 */

export const KEY_POINT_COUNT = 3;
export const KEY_POINT_LIMIT = 40;
/** A note this short is shown whole: three points would only repeat it. */
export const SHORT_TEXT_LIMIT = 90;

const CJK = /[㐀-鿿豈-﫿]/g;
const LATIN = /[A-Za-z]/g;
// A figure: an Arabic digit, or a Chinese numeral with a unit (連七日、三千億、5.1萬張).
const DIGIT = /\d|[一二三四五六七八九十兩百千萬億]+(?:個)?[日天週月年億萬張檔成倍點]/;
const count = (text: string, re: RegExp): number => (text.match(re) ?? []).length;

/** True when a point carries a figure. */
export const hasFigure = (text: string): boolean => DIGIT.test(text);

/** True when the text is written in Chinese (it may quote English headlines). */
export function isChineseText(text: string): boolean {
  const cjk = count(text, CJK);
  return cjk >= 8 && cjk * 3 >= count(text, LATIN);
}

/** Drop engine markup: [[tag:keyword]] chips, markdown emphasis, list dashes, headings. */
export function stripMarkup(text: string): string {
  return text
    .replace(/\[\[[a-z]+:[^\]]*\]\]/gi, '')
    .replace(/\*\*|__/g, '')
    .replace(/^\s{0,3}(#{1,6}|[-*•])\s+/gm, '')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

/** Split at Chinese sentence ends, at . ! ? followed by a space (so 8.99 stays whole) and at line breaks. */
export function splitSentences(text: string): string[] {
  const out: string[] = [];
  let current = '';
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '\n') {
      if (current.trim()) out.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
    const next = text[i + 1];
    if ('。！？'.includes(ch) || ('.!?'.includes(ch) && (next === undefined || /\s/.test(next)))) {
      // Keep a closing quote or bracket with its sentence.
      while (i + 1 < text.length && '」』）)"”'.includes(text[i + 1])) { current += text[i + 1]; i += 1; }
      if (current.trim()) out.push(current.trim());
      current = '';
    }
  }
  if (current.trim()) out.push(current.trim());
  return out;
}

// Hedges and source notes, not points: the full text keeps them.
const SKIP = /不代表|僅供參考|仅供参考|尚未(?:獨立)?核實|尚未(?:独立)?核实|並非投資建議|并非投资建议|條件式解讀|条件式解读|來源說法|来源说法|不構成|不构成|投資有風險|投资有风险/;
const TIMESTAMP = /\d{4}-\d{2}-\d{2}T\d{2}:|https?:\/\//;

function usable(sentence: string): boolean {
  if (!DIGIT.test(sentence) || SKIP.test(sentence) || TIMESTAMP.test(sentence)) return false;
  // Quoted English (news headlines inside a Chinese note) is not a point.
  return count(sentence, CJK) >= count(sentence, LATIN);
}

const trimEnd = (text: string): string => text.replace(/[\s，,；;：:、。！？.!?]+$/u, '').trim();

/** A sentence as ≤ limit chunks of whole clauses; an over-long clause is cut with an ellipsis. */
export function clauseChunks(sentence: string, limit = KEY_POINT_LIMIT): string[] {
  const clauses = trimEnd(sentence).split(/[，,；;]\s*/).map((c) => c.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = '';
  for (const clause of clauses) {
    const piece = clause.length > limit ? `${clause.slice(0, limit - 1).trimEnd()}…` : clause;
    const joined = current ? `${current}，${piece}` : piece;
    if (joined.length <= limit) { current = joined; continue; }
    if (current) chunks.push(current);
    current = piece;
  }
  if (current) chunks.push(current);
  return chunks;
}

const normalize = (text: string): string => text.replace(/[^\p{L}\p{N}.%$+−-]/gu, '');

function overlaps(a: string, b: string): boolean {
  const x = normalize(a);
  const y = normalize(b);
  return x === y || x.includes(y) || y.includes(x);
}

/** Up to `max` points of ≤ `limit` characters, each with a figure, in reading order and without repeats. */
export function keyPointsFromText(text: string | null | undefined, max = KEY_POINT_COUNT, limit = KEY_POINT_LIMIT): string[] {
  if (!text) return [];
  const points: string[] = [];
  for (const sentence of splitSentences(stripMarkup(text))) {
    if (!usable(sentence)) continue;
    for (const chunk of clauseChunks(sentence, limit)) {
      if (!DIGIT.test(chunk) || points.some((p) => overlaps(p, chunk))) continue;
      // A point stands alone: drop a leading 但／而／不過.
      points.push(chunk.replace(/^(?:但是?|而且?|且|惟|不過|然而)\s*/, ''));
      if (points.length >= max) return points;
    }
  }
  return points;
}

/** Key points for one AI note, or none when the note is short (or not Chinese) and is shown whole. */
export function noteKeyPoints(text: string | null | undefined): string[] {
  const clean = stripMarkup(text ?? '');
  if (clean.length <= SHORT_TEXT_LIMIT || !isChineseText(clean)) return [];
  const points = keyPointsFromText(clean);
  if (points.length > 0) return points;
  // A long note with no figures still opens on its first sentence.
  const first = splitSentences(clean).find((s) => !SKIP.test(s) && !TIMESTAMP.test(s) && count(s, CJK) >= count(s, LATIN));
  return first ? clauseChunks(first).slice(0, 1) : [];
}

export interface MarketMover { symbol: string; pct: number }

export interface MarketKeyPointInput {
  /** The AI's own market summary; its first sentence with a figure leads when it fits. */
  aiSummary?: string | null;
  /** Index or ETF lines, e.g. { label: 'VOO', pct: -0.8 }. */
  indices?: readonly { label: string; pct: number }[];
  /** Short regime word, e.g. 風險規避. */
  regime?: string | null;
  breadth?: { total: number; up: number; down: number } | null;
  signals?: { bullish: number; bearish: number } | null;
  gainers?: readonly MarketMover[];
  losers?: readonly MarketMover[];
}

/** +1.2% / −8.7% with a real minus sign. */
export function formatPoint(pct: number): string {
  const sign = pct > 0 ? '+' : pct < 0 ? '−' : '';
  return `${sign}${Math.abs(pct).toFixed(1)}%`;
}

/** Join items with 、 dropping the tail until the line fits. */
function fitList(prefix: string, items: readonly string[], limit: number): string {
  for (let n = items.length; n > 0; n -= 1) {
    const line = `${prefix}${items.slice(0, n).join('、')}`;
    if (line.length <= limit) return line;
  }
  return '';
}

/**
 * The dashboard's three points, in Chinese (the engine language of the market text):
 * 1. the AI's headline sentence with a figure, else the index line;
 * 2. breadth and signals;
 * 3. the largest gains and declines.
 */
export function marketKeyPoints(input: MarketKeyPointInput, limit = KEY_POINT_LIMIT): string[] {
  const points: string[] = [];
  const headline = isChineseText(input.aiSummary ?? '') ? keyPointsFromText(input.aiSummary, 1, limit)[0] : undefined;
  const indexLine = (input.indices ?? []).length
    ? [fitList('', (input.indices ?? []).map((i) => `${i.label} ${formatPoint(i.pct)}`), limit), input.regime ?? ''].filter(Boolean).join('，')
    : input.regime ?? '';
  const first = headline ?? (DIGIT.test(indexLine) ? indexLine : '');
  if (first && first.length <= limit) points.push(first);
  else if (first) points.push(clauseChunks(first, limit)[0]);

  const b = input.breadth;
  if (b && b.total > 0) {
    const base = `${b.total} 檔中 ${b.up} 漲、${b.down} 跌`;
    const s = input.signals;
    const withSignals = s && (s.bullish || s.bearish) ? `${base}；偏多 ${s.bullish}、偏空 ${s.bearish}` : base;
    points.push(withSignals.length <= limit ? withSignals : base);
  }

  const up = (input.gainers ?? []).slice(0, 3).map((m) => `${m.symbol} ${formatPoint(m.pct)}`);
  const down = (input.losers ?? []).slice(0, 3).map((m) => `${m.symbol} ${formatPoint(m.pct)}`);
  if (up.length || down.length) {
    // Both sides when they fit; otherwise the side with the larger move.
    for (let n = 3; n > 0; n -= 1) {
      const line = [up.length ? `領漲 ${up.slice(0, n).join('、')}` : '', down.length ? `領跌 ${down.slice(0, n).join('、')}` : ''].filter(Boolean).join('；');
      if (line.length <= limit) { points.push(line); break; }
      if (n === 1) {
        const topUp = (input.gainers ?? [])[0]?.pct ?? 0;
        const topDown = Math.abs((input.losers ?? [])[0]?.pct ?? 0);
        points.push(topUp >= topDown ? fitList('領漲 ', up, limit) : fitList('領跌 ', down, limit));
      }
    }
  }
  return points.filter(Boolean).slice(0, KEY_POINT_COUNT);
}
