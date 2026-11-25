/**
 * Fixed columns for every stock list row (2.0.1): the sparkline starts at the
 * same x on every row, prices share one right edge, verdict pills one width.
 * Nothing in a column is sized by that row's own text.
 */
export const LIST_ROW = {
  /** Star target; the 20pt star sits 16pt from the card edge, 12pt before the code. */
  star: 44,
  /** Code/name takes what is left, never less than this. */
  nameMin: 72,
  spark: { width: 64, height: 28 },
  /** Price + change, right-aligned, tabular figures. */
  price: 88,
  gap: 12,
  edge: 16,
} as const;

/** Text at or above this scale goes to the two-line layout and drops the sparkline. */
export const LIST_ROW_STACK_SCALE = 1.5;

/** Rough advance per character at 1pt font size: CJK/kana/hangul full width, Latin narrower. */
function charWidth(ch: string): number {
  const c = ch.codePointAt(0) ?? 0;
  if ((c >= 0x1100 && c <= 0x11ff) || (c >= 0x2e80 && c <= 0x9fff) || (c >= 0xac00 && c <= 0xd7af) || (c >= 0xff00 && c <= 0xffef)) return 1.0;
  if (ch === ' ' || ch === '.' || ch === ',' || ch === 'i' || ch === 'l' || ch === 'I') return 0.3;
  if (ch === 'm' || ch === 'w' || ch === 'M' || ch === 'W') return 0.82;
  return 0.58;
}

/**
 * One pill width for a list: the widest of the labels it can show (all verdict
 * short labels in the current language), so every pill in every row lines up.
 * Bold 13pt text + 9pt padding a side; scaled with the system text size.
 */
export function pillWidth(labels: readonly string[], fontSize = 13, fontScale = 1): number {
  const widest = Math.max(0, ...labels.map((l) => [...l].reduce((w, ch) => w + charWidth(ch), 0)));
  return Math.ceil(widest * fontSize * 1.06 * fontScale + 18);
}

/** The price column grows with the text size so a big price never clips; capped so names keep room. */
export function priceWidth(fontScale = 1): number {
  return Math.round(LIST_ROW.price * Math.min(Math.max(fontScale, 1), 1.35));
}
