import { createContext } from 'react';

/**
 * Lets content under the floating slot ask it to step aside, e.g. a chart while
 * a finger drags its crosshair. Null outside a ScreenScroll.
 */
export const FloatingSlotContext = createContext<{ suppress: (on: boolean) => void } | null>(null);
