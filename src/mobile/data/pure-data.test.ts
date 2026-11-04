import { mapTslaMatrix } from './mappers';
import { generateDailyOHLC, intradayToOHLC } from './ohlc-generator';
import { generateSamplePrices, generateTickerPrices, periodToTradingDays } from './sample-prices';
import { publicJsonRequest, publicReportRequest } from './public-request';
import { publicJsonRequest as browserJson, publicReportRequest as browserReport } from './public-request.web';

test('matrix mapping preserves snake_case fields and bid/ask-derived mids', () => {
  expect(mapTslaMatrix(null)).toBeNull();
  const mapped = mapTslaMatrix({ price: 200, expiries: [{ date: '2026-11-06', dte: 3, puts: [{ strike: 190, bid: 1, ask: 3, otm_pct: 5, cp_score: 7 }] }] });
  expect(mapped?.expiries[0].puts[0]).toMatchObject({ strike: 190, mid: 2, otmPct: 5, cpScore: 7 });
  expect(mapped?.expiries[0].calls).toEqual([]);
});

test('intraday groups retain the final remainder and valid OHLC extrema', () => {
  const bars = intradayToOHLC([10, 12, 11, 9, 13], ['a', 'b', 'c', 'd', 'e'], 2);
  expect(bars.map(({ time, open, high, low, close }) => ({ time, open, high, low, close }))).toEqual([
    { time: 'a', open: 10, high: 12, low: 10, close: 12 },
    { time: 'c', open: 11, high: 13, low: 9, close: 13 },
  ]);
  expect(intradayToOHLC([], [], 10)).toEqual([]);
});

test('seeded price generators preserve deterministic weekday data and default ticker prices', () => {
  jest.useFakeTimers().setSystemTime(new Date('2026-11-03T12:00:00Z'));
  try {
    expect(generateDailyOHLC(100, 5)).toEqual(generateDailyOHLC(100, 5));
    expect(generateSamplePrices(100, 5)).toEqual(generateSamplePrices(100, 5));
    const data = generateTickerPrices('AAPL', 5);
    expect(data.prices).toHaveLength(5); expect(data.dates).toHaveLength(5);
    expect(data.prices[0]).toBe(195);
    expect(data.dates.every(date => ![0, 6].includes(new Date(`${date}T12:00:00`).getDay()))).toBe(true);
    expect(['3mo', '6mo', '1y', '2y'].map(period => periodToTradingDays(period as '3mo' | '6mo' | '1y' | '2y'))).toEqual([63, 126, 252, 504]);
  } finally { jest.useRealTimers(); }
});

test('mobile JSON cache controls and CORS-simple web request contracts stay distinct', () => {
  expect(publicJsonRequest()).toEqual({ cache: 'no-store', headers: { Accept: 'application/json', 'Cache-Control': 'no-cache', Pragma: 'no-cache' } });
  expect(publicReportRequest()).toEqual({});
  expect(browserJson()).toEqual({ cache: 'no-store', credentials: 'omit', headers: { Accept: 'application/json' } });
  expect(browserReport()).toEqual({ credentials: 'omit' });
});
