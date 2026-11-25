/**
 * Scroll chrome rules (2.0.0), pure so they are tested once for every app.
 *
 * - The 「↑」 button shows after scrolling down more than 1.5 screens and then
 *   starting to scroll up; it hides when scrolling down or near the top, when
 *   the page is shorter than 2 screens, and while the keyboard is open.
 * - Back to top: beyond 3 screens, jump to 1 screen first, then animate.
 * - 「↓ 回到剛才」 shows for 3 s after any return to the top (button, status
 *   bar, tab re-tap) and puts the page back where it was.
 */

export type ScrollDirection = 'up' | 'down' | 'none';

export const SHOW_TOP_AFTER_SCREENS = 1.5;
export const MIN_CONTENT_SCREENS = 2;
export const JUMP_BEYOND_SCREENS = 3;
export const RETURN_PILL_MS = 3000;
/** Within this many points of the top counts as "at the top". */
export const TOP_SLOP = 8;
/** Ignore jitter smaller than this when deciding direction. */
export const DIRECTION_SLOP = 6;
export const CHROME_ANIM_MS = 180;

export interface ChromeState {
  y: number;
  direction: ScrollDirection;
  /** Farthest offset reached since the last return to the top. */
  showTop: boolean;
}

export const INITIAL_CHROME: ChromeState = { y: 0, direction: 'none', showTop: false };

export function nextChrome(prev: ChromeState, y: number, viewport: number, content: number, keyboardOpen = false): ChromeState {
  const delta = y - prev.y;
  const direction: ScrollDirection = Math.abs(delta) < DIRECTION_SLOP ? prev.direction : delta > 0 ? 'down' : 'up';
  const longEnough = viewport > 0 && content >= viewport * MIN_CONTENT_SCREENS;
  const deepEnough = y > viewport * SHOW_TOP_AFTER_SCREENS;
  let showTop = prev.showTop;
  if (!longEnough || keyboardOpen || y <= TOP_SLOP || direction === 'down') showTop = false;
  else if (direction === 'up' && deepEnough) showTop = true;
  // Keep the jitter-free y as the reference so slow drags still register.
  const refY = Math.abs(delta) < DIRECTION_SLOP ? prev.y : y;
  return { y: refY, direction, showTop };
}

/** Steps for 「回到頂部」: an instant jump to one screen first when far away, then an animated scroll to 0. */
export function scrollToTopPlan(y: number, viewport: number): { jumpTo: number | null } {
  return { jumpTo: viewport > 0 && y > viewport * JUMP_BEYOND_SCREENS ? viewport : null };
}

/**
 * Detect a return to the top the app did not animate itself (iOS status bar
 * tap, native tab re-tap): the offset lands at the top from far down while
 * the user is not dragging.
 */
export function isExternalReturnToTop(prevY: number, y: number, viewport: number, dragging: boolean): boolean {
  return !dragging && y <= TOP_SLOP && prevY > viewport;
}

/** Window-space rectangle (measureInWindow). */
export interface WinRect { x: number; y: number; width: number; height: number }

/** Size of the 「↑」 button and the slot's right inset (ScrollChrome styles). */
export const SLOT_BUTTON = 44;
export const SLOT_RIGHT = 16;
/** Breathing room kept between the slot and content it must not cover. */
export const SLOT_AVOID_MARGIN = 8;

/** Where the floating slot's button sits, given the screen container and its bottom offset. */
export function slotRect(container: WinRect, bottom: number): WinRect {
  return {
    x: container.x + container.width - SLOT_RIGHT - SLOT_BUTTON,
    y: container.y + container.height - bottom - SLOT_BUTTON,
    width: SLOT_BUTTON,
    height: SLOT_BUTTON,
  };
}

/**
 * True when the slot would cover any region content asked it to avoid (e.g. a
 * chart card): the slot steps aside instead of hiding content or controls.
 */
export function slotBlocked(slot: WinRect, avoid: readonly WinRect[], margin = SLOT_AVOID_MARGIN): boolean {
  return avoid.some((r) => r.width > 0 && r.height > 0
    && slot.x < r.x + r.width + margin && slot.x + slot.width > r.x - margin
    && slot.y < r.y + r.height + margin && slot.y + slot.height > r.y - margin);
}
