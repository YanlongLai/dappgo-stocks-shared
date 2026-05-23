/**
 * Unit tests for createPersistedStore.
 *
 * Uses an in-memory storage adapter (mirrors AsyncStorage's async API)
 * so the factory can be exercised in a plain Node environment.
 */
import { createPersistedStore, type AsyncStorageLike } from './createPersistedStore';

/** Tiny in-memory adapter matching the StateStorage contract. */
function makeMemoryStorage(): AsyncStorageLike & { dump(): Record<string, string> } {
  const map = new Map<string, string>();
  return {
    getItem: async (key: string) => (map.has(key) ? map.get(key)! : null),
    setItem: async (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: async (key: string) => {
      map.delete(key);
    },
    dump: () => Object.fromEntries(map),
  };
}

/** Yield to the microtask queue so persist middleware can flush async writes. */
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

interface CounterState {
  count: number;
  increment: () => void;
  setCount: (n: number) => void;
}

describe('createPersistedStore', () => {
  it('creates a store with the supplied initial state and exposes set/get', () => {
    const storage = makeMemoryStorage();
    const useStore = createPersistedStore<CounterState>({
      name: 'test-counter',
      storage,
      initializer: (set) => ({
        count: 0,
        increment: () => set((s) => ({ count: s.count + 1 })),
        setCount: (n) => set({ count: n }),
      }),
    });

    expect(useStore.getState().count).toBe(0);
    useStore.getState().increment();
    expect(useStore.getState().count).toBe(1);
    useStore.getState().setCount(42);
    expect(useStore.getState().count).toBe(42);
  });

  it('persists state to the injected storage under the configured key', async () => {
    const storage = makeMemoryStorage();
    const useStore = createPersistedStore<CounterState>({
      name: 'persist-key-test',
      storage,
      version: 1,
      initializer: (set) => ({
        count: 0,
        increment: () => set((s) => ({ count: s.count + 1 })),
        setCount: (n) => set({ count: n }),
      }),
    });

    useStore.getState().setCount(7);
    await flush();

    const dumped = storage.dump();
    expect(Object.keys(dumped)).toEqual(['persist-key-test']);
    const parsed = JSON.parse(dumped['persist-key-test']);
    expect(parsed.version).toBe(1);
    expect(parsed.state.count).toBe(7);
  });

  it('rehydrates a fresh store from previously persisted JSON', async () => {
    const storage = makeMemoryStorage();
    // Seed storage with a v1 payload as if a previous app session had written it.
    await storage.setItem(
      'rehydrate-test',
      JSON.stringify({ state: { count: 99 }, version: 1 }),
    );

    const useStore = createPersistedStore<CounterState>({
      name: 'rehydrate-test',
      storage,
      version: 1,
      initializer: (set) => ({
        count: 0,
        increment: () => set((s) => ({ count: s.count + 1 })),
        setCount: (n) => set({ count: n }),
      }),
    });

    // Wait for the async rehydration to land.
    await useStore.persist.rehydrate();
    expect(useStore.getState().count).toBe(99);
  });

  it('invokes migrate on a version bump and adopts the migrated state', async () => {
    const storage = makeMemoryStorage();
    // Stored payload from v1; new store version is 2 and adds a `flag` field.
    await storage.setItem(
      'migrate-test',
      JSON.stringify({ state: { count: 5 }, version: 1 }),
    );

    interface V2 extends CounterState {
      flag: boolean;
    }

    const useStore = createPersistedStore<V2>({
      name: 'migrate-test',
      storage,
      version: 2,
      migrate: (persisted, version) => {
        const s = (persisted as Partial<V2>) ?? {};
        if (version < 2) {
          s.flag = true;
        }
        return s as V2;
      },
      initializer: (set) => ({
        count: 0,
        flag: false,
        increment: () => set((s) => ({ count: s.count + 1 })),
        setCount: (n) => set({ count: n }),
      }),
    });

    await useStore.persist.rehydrate();
    const state = useStore.getState();
    expect(state.count).toBe(5);
    expect(state.flag).toBe(true);
  });
});
