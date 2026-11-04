import { stripHighlights, MARKER_RX } from './highlight-markers';

describe('MARKER_RX', () => {
  it('matches all five variants in order', () => {
    const s = '[[pos:a]] [[neg:b]] [[key:c]] [[warn:d]] [[u:e]]';
    const hits = Array.from(s.matchAll(MARKER_RX));
    expect(hits.map((m) => m[1])).toEqual(['pos', 'neg', 'key', 'warn', 'u']);
  });

  it('rejects unknown marker types', () => {
    const s = '[[xyz:nope]]';
    expect(Array.from(s.matchAll(MARKER_RX))).toHaveLength(0);
  });

  it('does not span newlines inside the body', () => {
    const s = '[[pos:line1\nline2]]';
    expect(Array.from(s.matchAll(MARKER_RX))).toHaveLength(0);
  });
});

describe('stripHighlights', () => {
  it('removes marker syntax, preserves body text', () => {
    expect(stripHighlights('Sold [[pos:TSLA put]] today')).toBe(
      'Sold TSLA put today'
    );
  });

  it('handles all five marker types', () => {
    const s = '[[pos:a]] [[neg:b]] [[key:c]] [[warn:d]] [[u:e]]';
    expect(stripHighlights(s)).toBe('a b c d e');
  });

  it('leaves plain text unchanged', () => {
    expect(stripHighlights('No markers at all.')).toBe('No markers at all.');
  });

  it('leaves unrecognised bracket patterns alone', () => {
    expect(stripHighlights('[[xyz:foo]]')).toBe('[[xyz:foo]]');
  });

  it('handles multiple markers on same line', () => {
    expect(
      stripHighlights('Buy [[key:$380]] at [[pos:strong support]]')
    ).toBe('Buy $380 at strong support');
  });
});
