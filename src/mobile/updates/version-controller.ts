import type { VersionDecision } from './version-policy';

export type VersionGateState =
  | { status: 'checking' }
  | VersionDecision
  | { status: 'error'; knownUpdate: VersionDecision | null };

type Dependencies = {
  check(): Promise<VersionDecision>;
  setAccessAllowed(allowed: boolean): void;
  isStoreBusy(): boolean;
  subscribeStore(listener: () => void): () => void;
};

export class VersionController {
  private state: VersionGateState = { status: 'checking' };
  private listeners = new Set<() => void>();
  private generation = 0;
  private started = false;
  private deferred = false;
  private deferredBackground = false;
  private inFlight: Promise<void> | undefined;
  private knownUpdate: VersionDecision | null = null;
  private unsubscribeStore: (() => void) | undefined;

  constructor(private readonly dependencies: Dependencies) {}
  getSnapshot = (): VersionGateState => this.state;
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };
  private publish(next: VersionGateState): void {
    this.state = next;
    this.dependencies.setAccessAllowed(next.status === 'allowed');
    for (const listener of this.listeners) listener();
  }
  start(): void {
    if (this.started) return;
    this.started = true;
    this.unsubscribeStore = this.dependencies.subscribeStore(() => {
      if (this.deferred && !this.dependencies.isStoreBusy()) void this.requestCheck({ background: this.deferredBackground });
    });
    void this.requestCheck();
  }
  stop(): void {
    this.started = false;
    this.generation++;
    this.deferred = false;
    this.inFlight = undefined;
    this.unsubscribeStore?.();
    this.unsubscribeStore = undefined;
    this.dependencies.setAccessAllowed(false);
  }
  requestCheck = ({ background = false }: { background?: boolean } = {}): Promise<void> => {
    if (!this.started) return Promise.resolve();
    if (this.dependencies.isStoreBusy()) {
      this.deferredBackground = this.deferred ? this.deferredBackground && background : background;
      this.deferred = true;
      return Promise.resolve();
    }
    if (background && this.inFlight) return this.inFlight;
    this.deferred = false;
    const generation = ++this.generation;
    // Only an already verified decision may stay usable during an automatic
    // recheck. A failure or higher minimum still withdraws access immediately.
    if (!background || this.state.status !== 'allowed') this.publish({ status: 'checking' });
    const pending = this.performCheck(generation);
    this.inFlight = pending;
    const clear = () => { if (this.inFlight === pending) this.inFlight = undefined; };
    void pending.then(clear, clear);
    return pending;
  };
  private async performCheck(generation: number): Promise<void> {
    try {
      const result = await this.dependencies.check();
      if (!this.started || generation !== this.generation) return;
      this.knownUpdate = result.status === 'update-required' ? result : null;
      this.publish(result);
    } catch {
      if (this.started && generation === this.generation) this.publish({ status: 'error', knownUpdate: this.knownUpdate });
    }
  }
}
