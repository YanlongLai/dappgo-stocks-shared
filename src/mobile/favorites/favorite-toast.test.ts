import {
  __resetFavoriteToast, favoriteA11yLabel, getFavoriteToast, subscribeFavoriteToast, toggleFavorite, undoFavoriteToast,
  FAVORITE_ADDED_TOAST_MS, FAVORITE_REMOVED_TOAST_MS,
} from './favorite-toast';

describe('favorite toggle + toast', () => {
  beforeEach(() => { jest.useFakeTimers(); __resetFavoriteToast(); });
  afterEach(() => jest.useRealTimers());

  function store(initial: { symbol: string; addedAt: string }[]) {
    let items = [...initial];
    return {
      get items() { return items; },
      op: (symbol: string) => ({
        symbol,
        isOn: () => items.some((i) => i.symbol === symbol),
        add: () => { items = [...items, { symbol, addedAt: 'now' }]; },
        remove: () => { items = items.filter((i) => i.symbol !== symbol); },
        snapshot: () => ({ index: items.findIndex((i) => i.symbol === symbol), item: items.find((i) => i.symbol === symbol)! }),
        restore: (s: { index: number; item: { symbol: string; addedAt: string } }) => { const next = [...items]; next.splice(s.index, 0, s.item); items = next; },
      }),
    };
  }

  it('removes at once with a 5 s undo that restores position and date', () => {
    const s = store([{ symbol: 'A', addedAt: 'd1' }, { symbol: '2330', addedAt: 'd2' }, { symbol: 'C', addedAt: 'd3' }]);
    expect(toggleFavorite(s.op('2330'))).toBe('removed');
    expect(s.items.map((i) => i.symbol)).toEqual(['A', 'C']);
    const toast = getFavoriteToast()!;
    expect(toast).toMatchObject({ kind: 'removed', symbol: '2330', durationMs: FAVORITE_REMOVED_TOAST_MS });
    expect(undoFavoriteToast(toast.id)).toBe(true);
    expect(s.items).toEqual([{ symbol: 'A', addedAt: 'd1' }, { symbol: '2330', addedAt: 'd2' }, { symbol: 'C', addedAt: 'd3' }]);
    expect(getFavoriteToast()).toBeNull();
    expect(undoFavoriteToast(toast.id)).toBe(false); // only once
  });

  it('adds with a short toast and no undo; toasts expire', () => {
    const s = store([]);
    const seen: (string | null)[] = [];
    subscribeFavoriteToast((t) => seen.push(t ? t.kind : null));
    expect(toggleFavorite(s.op('AAPL'))).toBe('added');
    expect(getFavoriteToast()).toMatchObject({ kind: 'added', durationMs: FAVORITE_ADDED_TOAST_MS });
    expect(getFavoriteToast()!.undo).toBeUndefined();
    jest.advanceTimersByTime(FAVORITE_ADDED_TOAST_MS);
    expect(getFavoriteToast()).toBeNull();
    expect(seen).toEqual([null, 'added', null]);
  });

  it('a new toast replaces the old one, whose undo then no longer works', () => {
    const s = store([{ symbol: 'A', addedAt: 'd1' }, { symbol: 'B', addedAt: 'd2' }]);
    toggleFavorite(s.op('A'));
    const first = getFavoriteToast()!;
    toggleFavorite(s.op('B'));
    expect(undoFavoriteToast(first.id)).toBe(false);
    jest.advanceTimersByTime(FAVORITE_REMOVED_TOAST_MS - 1);
    expect(getFavoriteToast()?.symbol).toBe('B');
    jest.advanceTimersByTime(1);
    expect(getFavoriteToast()).toBeNull();
  });

  it('builds the spoken label with code and name', () => {
    const labels = { add: '加入我的最愛：', remove: '從我的最愛移除：' };
    expect(favoriteA11yLabel(false, '2330', '台積電', labels)).toBe('加入我的最愛：2330 台積電');
    expect(favoriteA11yLabel(true, '2330', '台積電', labels)).toBe('從我的最愛移除：2330 台積電');
    expect(favoriteA11yLabel(false, 'AAPL', 'AAPL', labels)).toBe('加入我的最愛：AAPL');
  });
});
