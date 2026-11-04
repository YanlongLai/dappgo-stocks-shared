export type FullscreenFormat = 'app_open' | 'interstitial' | 'rewarded';
export type FullscreenTrigger = 'automatic' | 'rewarded_opt_in' | 'app_open_startup';
export const FULLSCREEN_COOLDOWN_MS = 5 * 60 * 1000;
export type AdmissionToken = { readonly id: symbol; readonly format: FullscreenFormat };
export type AdmissionInput = { now: number; foreground: boolean; canRequestAds: boolean; safeBoundary: boolean; trigger?: FullscreenTrigger; startupTicket?: symbol };

/** One instance per application. Tokens are capabilities, never caller-provided IDs. */
export class FullscreenAdmission {
  private owner: AdmissionToken | null = null;
  private impressed = false;
  private lastExposure: number | null = null;
  private ready = false;
  private startupAdmitted = false;
  private startupConsumed = false;
  private startupReservation: symbol | null = null;

  /** The first loading controller owns the only startup opportunity in this process. */
  reserveStartupOpportunity(): symbol | null {
    if (this.startupConsumed) return null;
    this.startupConsumed = true;
    this.startupReservation = Symbol('app_open_startup');
    return this.startupReservation;
  }

  hydrate(timestamps: readonly unknown[]): void {
    for (const value of timestamps) {
      if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
        this.lastExposure = Math.max(this.lastExposure ?? 0, value);
      }
    }
    this.ready = true;
  }

  canAcquire(format: FullscreenFormat, input: AdmissionInput): boolean {
    if (!this.ready || this.owner || !input.foreground || !input.canRequestAds ||
        !input.safeBoundary || !Number.isFinite(input.now) || input.now <= 0) return false;
    if (format === 'rewarded' && input.trigger !== 'rewarded_opt_in') return false;
    if (input.trigger === 'app_open_startup') {
      if (format !== 'app_open' || this.startupAdmitted || this.startupReservation === null ||
          input.startupTicket !== this.startupReservation) return false;
      // Cold launches have a separate cadence from in-session automatic ads.
      // The reservation is consumed even if loading fails or is stopped. Clock rollback,
      // entitlement/consent, safe routes and the shared fullscreen mutex remain gates.
      return this.lastExposure === null || input.now >= this.lastExposure;
    }
    // Only a real, explicitly opted-in rewarded ad has its own reveal cadence.
    // Automatic formats keep their cooldown; clock rollback always fails closed.
    const cooldown = format === 'rewarded' ? 0 : FULLSCREEN_COOLDOWN_MS;
    return this.lastExposure === null || input.now - this.lastExposure >= cooldown;
  }

  acquire(format: FullscreenFormat, input: AdmissionInput): AdmissionToken | null {
    if (!this.canAcquire(format, input)) return null;
    this.owner = Object.freeze({ id: Symbol(format), format });
    if (input.trigger === 'app_open_startup') this.startupAdmitted = true;
    this.impressed = false;
    return this.owner;
  }

  /** Read-only: startup can fail open as soon as hydration proves a cooldown. */
  isCoolingDown(now: number): boolean {
    return this.lastExposure !== null && now - this.lastExposure < FULLSCREEN_COOLDOWN_MS;
  }

  impression(token: AdmissionToken, now: number): number | null {
    if (this.owner !== token || this.impressed || !Number.isFinite(now) || now <= 0) return null;
    this.impressed = true;
    this.lastExposure = Math.max(this.lastExposure ?? 0, now);
    return this.lastExposure;
  }

  release(token: AdmissionToken): boolean {
    if (this.owner !== token) return false;
    this.owner = null;
    return true;
  }
}

