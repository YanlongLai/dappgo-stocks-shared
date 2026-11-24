import {
  KEY_POINT_LIMIT,
  clauseChunks,
  formatPoint,
  hasFigure,
  isChineseText,
  keyPointsFromText,
  marketKeyPoints,
  noteKeyPoints,
  splitSentences,
  stripMarkup,
} from './model';

// Real text from the 2026-11-24 reports.
const TW_SUMMARY = [
  '今日台股史詩級反彈，加權指數暴漲8.99%收40122點，半導體、光電、航運領漲。黃仁勳回歸引爆AI慶祝行情，權值股集體漲停。但外資連七日賣超近三千億，三大法人合計賣超千億，價量法人嚴重背離。',
  '半導體、光電、航運領漲，外資大買晶圓代工與面板；金融、塑化、電子代工則遭外資賣超。',
  '台股大漲近9%，半導體光電航運領漲，外資買超半導體但賣超金融，金融股普漲但部分未觸漲停，量能放大，短線反彈動能強但需觀察後續法人接力。',
].join('\n\n');
const US_TSLA = 'TSLA 收 $383.162 短中期分歧，低二十日高六十日均線；能否重返短期均線為關鍵。 TSLA 相關報導：MarketBeat Instant Alerts（2026-11-24T13:19:08Z）「Tesla (NASDAQ:TSLA) Now Covered by Analysts at Seaport Research Partners」。 報導摘要：「Seaport Research Partners initiated coverage on shares of Tesla in a research report on Tuesday. They set a "buy" rating and a $475.00 target price on the stock.」。 此為來源說法，尚未獨立核實。 這屬產品或研發進度；技術突破不等於已實現營收，需追蹤商業部署與客戶採用。';
const OPT_NVDA = '輝達重挫6.02%，IV 91.1%極高，最大痛點$157.50，賣出Put $140收$2.42，晶片股回調。 [[neg:大幅下跌]] [[warn:IV極高]] [[key:$145-165區間]]';

describe('text helpers', () => {
  test('stripMarkup drops engine chips, emphasis and list dashes', () => {
    expect(stripMarkup('- **NVDA** 跌 6% [[neg:大幅下跌]]')).toBe('NVDA 跌 6%');
  });

  test('splitSentences keeps decimals whole and splits at 。 and line breaks', () => {
    expect(splitSentences('加權指數漲8.99%。外資賣超。\nRSI 47.5 偏弱')).toEqual(['加權指數漲8.99%。', '外資賣超。', 'RSI 47.5 偏弱']);
  });

  test('clauseChunks packs whole clauses up to the limit', () => {
    const chunks = clauseChunks('輝達重挫6.02%，IV 91.1%極高，最大痛點$157.50，賣出Put $140收$2.42，晶片股回調。');
    expect(chunks.every((c) => c.length <= KEY_POINT_LIMIT)).toBe(true);
    expect(chunks[0]).toBe('輝達重挫6.02%，IV 91.1%極高，最大痛點$157.50');
  });

  test('an over-long clause is cut with an ellipsis', () => {
    const [chunk] = clauseChunks('一'.repeat(60));
    expect(chunk.length).toBe(KEY_POINT_LIMIT);
    expect(chunk.endsWith('…')).toBe(true);
  });

  test('isChineseText accepts a Chinese note that quotes English, rejects English', () => {
    expect(isChineseText(US_TSLA)).toBe(true);
    expect(isChineseText('NVDA at $153.53 indicates bearish signal; beneath both averages, RSI 38.88.')).toBe(false);
  });

  test('formatPoint uses a real minus sign and one decimal', () => {
    expect(formatPoint(-19.07)).toBe('−19.1%');
    expect(formatPoint(1.2)).toBe('+1.2%');
    expect(formatPoint(0)).toBe('0.0%');
  });
});

describe('keyPointsFromText', () => {
  test('TW market summary: three points, each with a figure, ≤ 40 字, no repeats', () => {
    const points = keyPointsFromText(TW_SUMMARY);
    expect(points).toHaveLength(3);
    expect(points[0]).toBe('今日台股史詩級反彈，加權指數暴漲8.99%收40122點，半導體、光電、航運領漲');
    for (const p of points) {
      expect(p.length).toBeLessThanOrEqual(KEY_POINT_LIMIT);
      expect(hasFigure(p)).toBe(true);
    }
    expect(points[1]).toBe('外資連七日賣超近三千億，三大法人合計賣超千億，價量法人嚴重背離');
    expect(new Set(points).size).toBe(3);
  });

  test('skips hedges, timestamps and quoted English', () => {
    const points = keyPointsFromText(US_TSLA);
    expect(points).toEqual(['TSLA 收 $383.162 短中期分歧，低二十日高六十日均線']);
  });

  test('empty input', () => {
    expect(keyPointsFromText('')).toEqual([]);
    expect(keyPointsFromText(null)).toEqual([]);
  });
});

describe('noteKeyPoints', () => {
  test('a short note is shown whole (no points)', () => {
    expect(noteKeyPoints(OPT_NVDA)).toEqual([]);
    expect(noteKeyPoints('黃仁勳回歸推股價漲停至2230元，但外資賣超5.1萬張，MACD空頭、RSI 47.5。')).toEqual([]);
  });

  test('a long Chinese note gets its figure points', () => {
    expect(noteKeyPoints(US_TSLA)).toEqual(['TSLA 收 $383.162 短中期分歧，低二十日高六十日均線']);
  });

  test('a long note without figures opens on its first sentence', () => {
    const note = `${'技術面偏弱，均線下彎，量能萎縮，觀望為宜。'.repeat(5)}後市仍需觀察法人動向與產業消息。`;
    const points = noteKeyPoints(note);
    expect(points).toHaveLength(1);
    expect(points[0]).toBe('技術面偏弱，均線下彎，量能萎縮，觀望為宜');
  });

  test('English notes keep their full text', () => {
    expect(noteKeyPoints('NVDA at $153.53 indicates bearish signal; beneath both averages, RSI 38.88. A close above 20-day would reassess the setup. '.repeat(2))).toEqual([]);
  });
});

describe('marketKeyPoints', () => {
  test('TW: the AI headline leads, then breadth and signals, then movers', () => {
    expect(marketKeyPoints({
      aiSummary: TW_SUMMARY,
      breadth: { total: 101, up: 90, down: 9 },
      signals: { bullish: 2, bearish: 8 },
      gainers: [{ symbol: '長榮', pct: 9.9 }, { symbol: '台積電', pct: 9.85 }],
      losers: [{ symbol: '景碩', pct: -3.2 }],
    })).toEqual([
      '今日台股史詩級反彈，加權指數暴漲8.99%收40122點，半導體、光電、航運領漲',
      '101 檔中 90 漲、9 跌；偏多 2、偏空 8',
      '領漲 長榮 +9.9%、台積電 +9.8%；領跌 景碩 −3.2%',
    ]);
  });

  test('US: a hedge-only AI summary falls back to the index line', () => {
    expect(marketKeyPoints({
      aiSummary: '以下僅為輸入觀察的條件式解讀，不代表預測或已核實的新聞催化事件。',
      indices: [{ label: 'VOO', pct: -0.8 }, { label: 'QQQ', pct: -2.1 }],
      regime: '風險規避',
      breadth: { total: 36, up: 3, down: 33 },
      gainers: [{ symbol: 'ISRG', pct: 1.2 }],
      losers: [{ symbol: 'SOXL', pct: -19.07 }, { symbol: 'SNDK', pct: -8.9 }, { symbol: 'MU', pct: -8.7 }],
    })).toEqual([
      'VOO −0.8%、QQQ −2.1%，風險規避',
      '36 檔中 3 漲、33 跌',
      '領漲 ISRG +1.2%；領跌 SOXL −19.1%、SNDK −8.9%',
    ]);
  });

  test('every point stays within the limit with long names', () => {
    const points = marketKeyPoints({
      breadth: { total: 1982, up: 1500, down: 400 },
      signals: { bullish: 120, bearish: 80 },
      gainers: [{ symbol: '台灣積體電路製造', pct: 9.9 }, { symbol: '鴻海精密工業', pct: 9.8 }, { symbol: '聯發科技', pct: 9.7 }],
      losers: [{ symbol: '中華電信股份', pct: -3 }, { symbol: '台灣大哥大', pct: -2 }, { symbol: '遠傳電信', pct: -1 }],
    });
    for (const p of points) expect(p.length).toBeLessThanOrEqual(KEY_POINT_LIMIT);
    expect(points).toHaveLength(2);
  });

  test('nothing to say', () => {
    expect(marketKeyPoints({})).toEqual([]);
  });
});
