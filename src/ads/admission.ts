export type FullscreenFormat = 'app_open' | 'interstitial';
export const FULLSCREEN_COOLDOWN_MS = 4 * 60 * 60 * 1000;
export type AdmissionToken = { readonly id: symbol; readonly format: FullscreenFormat };
export type AdmissionInput = { now: number; foreground: boolean; canRequestAds: boolean; safeBoundary: boolean };

/** One instance per application. Tokens are capabilities, never caller-provided IDs. */
export class FullscreenAdmission {
  private owner: AdmissionToken | null = null;
  private impressed = false;
  private lastExposure: number | null = null;
  private ready = false;

  hydrate(timestamps: readonly unknown[]): void {
    for (const value of timestamps) {
      if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
        this.lastExposure = Math.max(this.lastExposure ?? 0, value);
      }
    }
    this.ready = true;
  }

  acquire(format: FullscreenFormat, input: AdmissionInput): AdmissionToken | null {
    if (!this.ready || this.owner || !input.foreground || !input.canRequestAds ||
        !input.safeBoundary || !Number.isFinite(input.now) || input.now <= 0) return null;
    // A clock rollback fails closed until the stored cooldown has elapsed.
    if (this.isCoolingDown(input.now)) return null;
    this.owner = Object.freeze({ id: Symbol(format), format });
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

