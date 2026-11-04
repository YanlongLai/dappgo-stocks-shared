import { parseReportSections, firstParagraph } from './report-sections';

describe('parseReportSections', () => {
  it('returns empty record for empty / falsy input', () => {
    expect(parseReportSections('')).toEqual({});
    // @ts-expect-error — runtime nullish guard
    expect(parseReportSections(null)).toEqual({});
  });

  it('parses canonical level-3 sections separated by `---`', () => {
    const md = [
      '# 報告',
      '',
      '### 📌 今日重點',
      '',
      'tldr body line 1',
      'tldr body line 2',
      '',
      '---',
      '',
      '### 🌐 大盤總覽',
      '',
      'market body',
      '',
      '---',
      '',
      '### 🔥 板塊輪動',
      '',
      'sector body',
    ].join('\n');

    const out = parseReportSections(md);

    expect(Object.keys(out)).toEqual(['tldr', 'market', 'sectors']);
    expect(out.tldr.heading).toBe('📌 今日重點');
    expect(out.tldr.emoji).toBe('📌');
    expect(out.tldr.body).toBe('tldr body line 1\ntldr body line 2');
    expect(out.market.body).toBe('market body');
    expect(out.sectors.body).toBe('sector body');
  });

  it('handles legacy level-2 headings', () => {
    const md = '## 📌 今日重點\n\nbody';
    const out = parseReportSections(md);
    expect(out.tldr.body).toBe('body');
  });

  it('maps legacy emoji aliases to the same key', () => {
    // 🧠 is legacy alias for 🤖 → ai_full
    const md = '### 🧠 AI 觀點\n\nfull text';
    const out = parseReportSections(md);
    expect(out.ai_full?.body).toBe('full text');
    expect(out.ai_full?.emoji).toBe('🧠');
  });

  it('falls back to slug key for unknown emoji headings', () => {
    const md = '### 💡 自定義段落\n\nbody';
    const out = parseReportSections(md);
    // 💡 not in EMOJI_TO_KEY → key is slug of heading
    const keys = Object.keys(out);
    expect(keys.length).toBe(1);
    expect(out[keys[0]].body).toBe('body');
    expect(out[keys[0]].emoji).toBe('💡');
  });

  it('keeps the first occurrence when emoji key duplicates', () => {
    const md = [
      '### 📌 今日重點',
      'first',
      '',
      '### 📌 今日重點 v2',
      'second',
    ].join('\n');
    const out = parseReportSections(md);
    expect(out.tldr.body).toBe('first');
    expect(out.tldr.heading).toBe('📌 今日重點');
  });

  it('drops content before the first heading', () => {
    const md = 'preamble line\n\n### 📌 今日重點\n\nbody';
    const out = parseReportSections(md);
    expect(out.tldr.body).toBe('body');
    // preamble is not surfaced anywhere
    expect(JSON.stringify(out)).not.toContain('preamble');
  });

  it('strips surrounding `---` rules from body', () => {
    const md = '### 📌 今日重點\n\n---\nbody\n---';
    const out = parseReportSections(md);
    expect(out.tldr.body).toBe('body');
  });
});

describe('firstParagraph', () => {
  it('returns empty string for empty input', () => {
    expect(firstParagraph('')).toBe('');
  });

  it('returns the first blank-line-separated paragraph', () => {
    const body = 'first sentence.\nsecond line of first para.\n\nsecond para.';
    expect(firstParagraph(body)).toBe('first sentence.\nsecond line of first para.');
  });

  it('returns whole body when no paragraph break', () => {
    expect(firstParagraph('only one para')).toBe('only one para');
  });

  it('trims whitespace', () => {
    expect(firstParagraph('  hello  \n\nworld')).toBe('hello');
  });
});
