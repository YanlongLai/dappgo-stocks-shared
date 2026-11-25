import { createContext } from 'react';

/** Anything with measureInWindow (a View). */
export interface Measurable {
  measureInWindow: (cb: (x: number, y: number, width: number, height: number) => void) => void;
}

/**
 * Lets content under the floating slot ask it to step aside: `suppress` while a
 * finger drags a chart crosshair, and `avoid` for a region (e.g. the chart card)
 * the slot must never cover — while that region is under the slot, 「↑」 hides.
 * Null outside a ScreenScroll.
 */
export interface FloatingSlotControl {
  suppress: (on: boolean) => void;
  /** Register (or with `null`, unregister) a region the slot must not cover. */
  avoid: (key: string, target: Measurable | null) => void;
}

export const FloatingSlotContext = createContext<FloatingSlotControl | null>(null);
