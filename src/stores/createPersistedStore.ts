/**
 * createPersistedStore — generic factory for AsyncStorage-backed Zustand stores.
 *
 * Wraps `zustand` + `zustand/middleware`'s `persist` + `createJSONStorage` so
 * the seven near-identical persisted stores in the DappGo apps
 * (card-visibility, settings, notification-prefs, …) can share a single
 * implementation. The factory is storage-agnostic: callers pass any object
 * that satisfies the minimal Web Storage-like contract (e.g. AsyncStorage on
 * React Native, `window.localStorage` on web, an in-memory mock in tests).
 *
 * `zustand` is declared as a peerDependency — every consumer app already
 * depends on it, so we just pick up whichever version is installed there.
 * No React / React Native imports here: this module remains usable from
 * plain Node tests.
 */

import { create } from 'zustand';
import type { Mutate, StoreApi, UseBoundStore } from 'zustand';
import {
  persist,
  createJSONStorage,
  type PersistOptions,
  type StateStorage,
} from 'zustand/middleware';

/**
 * Storage adapter shape accepted by `zustand/middleware`'s
 * `createJSONStorage`. AsyncStorage from React Native satisfies this
 * (its methods return promises, which `createJSONStorage` handles).
 */
export type AsyncStorageLike = StateStorage;

/**
 * Initializer in the standard Zustand shape — receives `set` / `get` and
 * returns the initial slice (state fields + actions).
 */
export type StoreInitializer<T> = (
  set: StoreApi<T>['setState'],
  get: StoreApi<T>['getState'],
) => T;

/**
 * `T` is the runtime state (fields + actions). `Persisted` is what actually
 * lands in storage — defaults to `T`, but `partialize` can narrow it.
 */
export interface CreatePersistedStoreConfig<T, Persisted = T> {
  /**
   * AsyncStorage key under which the persisted state lives.
   * **Must not change across releases** — changing this wipes user state.
   */
  name: string;
  /** Storage adapter (e.g. AsyncStorage). */
  storage: AsyncStorageLike;
  /** Initial state + actions, as a standard Zustand initializer. */
  initializer: StoreInitializer<T>;
  /** Persisted schema version, used by `migrate`. Defaults to 1. */
  version?: number;
  /** Optional migration function — same signature as zustand's. */
  migrate?: (persistedState: unknown, version: number) => Persisted | Promise<Persisted>;
  /** Optional partial-state selector for what to persist. */
  partialize?: (state: T) => Persisted;
  /** Optional rehydrate-finished hook. */
  onRehydrateStorage?: PersistOptions<T, Persisted>['onRehydrateStorage'];
}

/**
 * Bound-hook type that also exposes the `persist` API (`rehydrate()`,
 * `clearStorage()`, etc) — matches `create(persist(…))` exactly.
 */
export type PersistedStoreHook<T> = UseBoundStore<
  Mutate<StoreApi<T>, [['zustand/persist', T]]>
>;

/**
 * Build a persisted Zustand store. Mirrors the pattern used by every
 * DappGo persisted store: `create(persist(initializer, { name, storage,
 * version, migrate, ... }))`.
 *
 * Returns the standard React-bound hook (`useStore()`, `useStore.getState()`,
 * `useStore.persist.rehydrate()`, etc).
 */
export function createPersistedStore<T, Persisted = T>(
  config: CreatePersistedStoreConfig<T, Persisted>,
): PersistedStoreHook<T> {
  const {
    name,
    storage,
    initializer,
    version = 1,
    migrate,
    partialize,
    onRehydrateStorage,
  } = config;

  const persistOpts: PersistOptions<T, Persisted> = {
    name,
    storage: createJSONStorage(() => storage),
    version,
  };
  if (migrate) persistOpts.migrate = migrate;
  if (partialize) persistOpts.partialize = partialize;
  if (onRehydrateStorage) persistOpts.onRehydrateStorage = onRehydrateStorage;

  return create<T>()(persist(initializer, persistOpts)) as PersistedStoreHook<T>;
}
