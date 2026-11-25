/**
 * Favorite toggle feedback (2.0.1): no confirm dialog. Removing is immediate
 * and a toast offers 「復原」 for 5 s; adding shows a short toast. One toast at
 * a time — a new one replaces the old (and the old undo expires).
 */
export const FAVORITE_REMOVED_TOAST_MS = 5000;
export const FAVORITE_ADDED_TOAST_MS = 2000;
export const FAVORITE_BOUNCE_MS = 180;

export interface FavoriteToast {
  id: number;
  kind: 'added' | 'removed';
  symbol: string;
  name?: string | null;
  /** Present on 'removed': puts the item back exactly as it was. */
  undo?: (() => void) | null;
  durationMs: number;
}

type Listener = (toast: FavoriteToast | null) => void;

let current: FavoriteToast | null = null;
let seq = 0;
let timer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<Listener>();

function emit() { for (const l of listeners) l(current); }

export function subscribeFavoriteToast(listener: Listener): () => void {
  listeners.add(listener);
  listener(current);
  return () => { listeners.delete(listener); };
}

export function getFavoriteToast(): FavoriteToast | null { return current; }

export function showFavoriteToast(t: Omit<FavoriteToast, 'id' | 'durationMs'> & { durationMs?: number }): FavoriteToast {
  if (timer) clearTimeout(timer);
  const durationMs = t.durationMs ?? (t.kind === 'removed' ? FAVORITE_REMOVED_TOAST_MS : FAVORITE_ADDED_TOAST_MS);
  current = { ...t, id: ++seq, durationMs };
  const id = current.id;
  timer = setTimeout(() => { if (current?.id === id) { current = null; emit(); } }, durationMs);
  emit();
  return current;
}

export function dismissFavoriteToast(id?: number): void {
  if (!current || (id != null && current.id !== id)) return;
  if (timer) clearTimeout(timer);
  current = null;
  emit();
}

/** 「復原」: runs the toast's undo once, then closes it. */
export function undoFavoriteToast(id: number): boolean {
  if (!current || current.id !== id || !current.undo) return false;
  const undo = current.undo;
  dismissFavoriteToast(id);
  undo();
  return true;
}

/**
 * The one toggle every list uses. `isOn` reads the store; `snapshot` captures
 * what removing loses so undo restores it exactly (position, date added).
 */
export function toggleFavorite<S>({ symbol, name, isOn, add, remove, snapshot, restore }: {
  symbol: string;
  name?: string | null;
  isOn: () => boolean;
  add: () => void;
  remove: () => void;
  snapshot: () => S;
  restore: (s: S) => void;
}): 'added' | 'removed' {
  if (isOn()) {
    const saved = snapshot();
    remove();
    showFavoriteToast({ kind: 'removed', symbol, name, undo: () => restore(saved) });
    return 'removed';
  }
  add();
  showFavoriteToast({ kind: 'added', symbol, name });
  return 'added';
}

/** 「加入我的最愛：2330 台積電」 / 「從我的最愛移除：2330 台積電」 */
export function favoriteA11yLabel(on: boolean, symbol: string, name: string | null | undefined, labels: { add: string; remove: string }): string {
  const who = name && name !== symbol ? `${symbol} ${name}` : symbol;
  return `${on ? labels.remove : labels.add}${who}`;
}

/** Test hook. */
export function __resetFavoriteToast(): void { if (timer) clearTimeout(timer); timer = null; current = null; listeners.clear(); }
