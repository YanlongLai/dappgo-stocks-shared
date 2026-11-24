import {
  PERSONALIZATION_LIMIT, clearPersonalization, deleteSavedFilter, emptyPersonalization, forYou, getListState, markFavoriteHinted,
  migratePersonalization, recentSearches, recordFilterUse, recordSearch, recordView, saveFilter, setListState,
  setPersonalizationEnabled, shouldSuggestFavorite, topFilters, topViewed, viewScore,
} from './model';

const DAY = 86_400_000;
const T0 = Date.UTC(2026, 10, 24, 12);

describe('searches and filters', () => {
  it('recent searches newest first, repeats counted once', () => {
    let s = emptyPersonalization();
    s = recordSearch(s, '半導體', T0);
    s = recordSearch(s, '2330', T0 + 1);
    s = recordSearch(s, '半導體', T0 + 2);
    expect(recentSearches(s)).toEqual(['半導體', '2330']);
    expect(s.searches.find((e) => e.key === '半導體')?.count).toBe(2);
  });

  it('top filters by frequency with recency (a habit beats a one-off)', () => {
    let s = emptyPersonalization();
    for (let i = 0; i < 5; i += 1) s = recordFilterUse(s, 'zone:below', T0 - 10 * DAY + i);
    s = recordFilterUse(s, 'yield:3', T0);
    s = recordFilterUse(s, 'industry:半導體', T0);
    s = recordFilterUse(s, 'industry:半導體', T0);
    expect(topFilters(s, 3, T0)).toEqual(['zone:below', 'industry:半導體', 'yield:3']);
  });

  it('keeps at most 200 per category, dropping the oldest', () => {
    let s = emptyPersonalization();
    for (let i = 0; i < PERSONALIZATION_LIMIT + 5; i += 1) s = recordSearch(s, `q${i}`, T0 + i);
    expect(s.searches).toHaveLength(PERSONALIZATION_LIMIT);
    expect(s.searches.some((e) => e.key === 'q0')).toBe(false);
    expect(s.searches.some((e) => e.key === `q${PERSONALIZATION_LIMIT + 4}`)).toBe(true);
  });

  it('saved filters: name, replace same name, delete', () => {
    let s = emptyPersonalization<{ zone: string }>();
    s = saveFilter(s, '便宜半導體', { zone: 'below' }, T0);
    s = saveFilter(s, '便宜半導體', { zone: 'deep_below' }, T0 + 1);
    expect(s.saved).toHaveLength(1);
    expect(s.saved[0].filter).toEqual({ zone: 'deep_below' });
    s = deleteSavedFilter(s, s.saved[0].id);
    expect(s.saved).toEqual([]);
  });
});

describe('views', () => {
  it('popularity halves every 14 days', () => {
    let s = emptyPersonalization();
    s = recordView(s, '2330', T0 - 14 * DAY);
    expect(viewScore(s.views[0], T0)).toBeCloseTo(0.5, 5);
    s = recordView(s, '2454', T0);
    s = recordView(s, '2454', T0);
    expect(topViewed(s, 5, T0)).toEqual(['2454', '2330']);
  });

  it('suggest add-to-favorites after 3 views in 7 days, once', () => {
    let s = emptyPersonalization();
    s = recordView(s, 'NVDA', T0 - 8 * DAY);
    s = recordView(s, 'NVDA', T0 - 2 * DAY);
    s = recordView(s, 'NVDA', T0 - DAY);
    expect(shouldSuggestFavorite(s, 'NVDA', new Set(), T0)).toBe(false);
    s = recordView(s, 'NVDA', T0);
    expect(shouldSuggestFavorite(s, 'NVDA', new Set(), T0)).toBe(true);
    expect(shouldSuggestFavorite(s, 'NVDA', new Set(['NVDA']), T0)).toBe(false);
    s = markFavoriteHinted(s, 'NVDA');
    expect(shouldSuggestFavorite(s, 'NVDA', new Set(), T0)).toBe(false);
  });
});

describe('list state', () => {
  it('remembers filter and scroll offset per list', () => {
    let s = emptyPersonalization<string>();
    s = setListState(s, 'valuation', 'zone:below', 812.6, T0);
    expect(getListState(s, 'valuation')).toEqual({ filter: 'zone:below', offset: 813, at: T0 });
    expect(getListState(s, 'sectors')).toBeNull();
  });
});

describe('為你帶出', () => {
  it('favorites first, then often viewed; only stocks that changed; at most 3; says why', () => {
    let s = emptyPersonalization();
    for (let i = 0; i < 4; i += 1) s = recordView(s, 'MU', T0 - i * DAY);
    s = recordView(s, 'AAPL', T0);
    const items = forYou(s, [
      { symbol: 'MU', change: 'signal' },
      { symbol: 'NVDA', change: 'zone' },
      { symbol: 'TSLA', change: null },
      { symbol: 'AAPL', change: 'flow' },
      { symbol: 'XOM', change: 'zone' },
      { symbol: 'GOOG', change: 'flow' },
    ], new Set(['NVDA', 'TSLA', 'GOOG']), 3, T0);
    expect(items).toEqual([
      { symbol: 'NVDA', reason: 'favorite', change: 'zone' },
      { symbol: 'GOOG', reason: 'favorite', change: 'flow' },
      { symbol: 'MU', reason: 'often_viewed', change: 'signal' },
    ]);
  });
});

describe('switch, clear and migration', () => {
  it('off records nothing and clears what was there; clear keeps the switch', () => {
    let s = recordSearch(emptyPersonalization(), 'x', T0);
    s = setPersonalizationEnabled(s, false);
    expect(s.searches).toEqual([]);
    expect(recordView(s, 'AAPL', T0).views).toEqual([]);
    expect(forYou(s, [{ symbol: 'A', change: 'zone' }], new Set(['A']), 3, T0)).toEqual([]);
    const on = recordSearch(setPersonalizationEnabled(s, true), 'y', T0);
    expect(clearPersonalization(on)).toEqual(emptyPersonalization(true));
  });

  it('migration tolerates junk', () => {
    expect(migratePersonalization(null)).toEqual(emptyPersonalization());
    expect(migratePersonalization({ enabled: false, searches: 'x', views: [{ symbol: 'A', times: [1] }, { bad: 1 }] }))
      .toMatchObject({ enabled: false, searches: [], views: [{ symbol: 'A', times: [1] }] });
  });
});

describe('daily marks for 今天有變化', () => {
  it('rolls on a new report date and finds zone/signal changes and unusual flow', () => {
    const { rollMarks, changesSince } = require('./model');
    let h = rollMarks(null, '2026-11-23', { A: { zone: 'within', signal: 'WATCH' }, B: { zone: 'below', signal: 'BUY' } });
    h = rollMarks(h, '2026-11-23', { C: { zone: 'above', signal: 'HOLD' } });
    expect(Object.keys(h.cur.marks)).toEqual(['A', 'B', 'C']);
    h = rollMarks(h, '2026-11-24', { A: { zone: 'below', signal: 'WATCH' }, B: { zone: 'below', signal: 'HOLD' }, C: { zone: 'above', signal: 'HOLD', flowFlag: 'unusual_put' }, D: { zone: 'within', signal: 'BUY' } });
    expect(changesSince(h)).toEqual([
      { symbol: 'A', change: 'zone' }, { symbol: 'B', change: 'signal' }, { symbol: 'C', change: 'flow' }, { symbol: 'D', change: null },
    ]);
  });
});
