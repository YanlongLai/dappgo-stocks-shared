/**
 * Navigation contracts for stock detail screens.
 *
 * A detail route can be reached from several tab stacks.  Passing the source
 * route explicitly lets Back replace the detail screen with the page that
 * launched it, instead of relying on a nested navigator's global history.
 * This is important when the user opens A, goes back, opens B, then goes back
 * again: the second Back must not depend on the removed A route still being in
 * the stack.
 */

export type StockDetailReturnPath =
  | '/(tabs)/dashboard'
  | '/(tabs)/signals'
  | '/(tabs)/favorites'
  | '/(tabs)/sectors'
  | `/sector/${string}`
  | `/report/${string}`;

export type StockDetailHref = {
  pathname: '/stock/[symbol]';
  params: { symbol: string; returnTo?: StockDetailReturnPath };
};

/** Build the canonical in-app stock detail href and retain its source route. */
export function stockDetailHref(
  symbol: string,
  returnTo?: StockDetailReturnPath,
): StockDetailHref {
  return {
    pathname: '/stock/[symbol]',
    params: returnTo ? { symbol, returnTo } : { symbol },
  };
}

/**
 * Accept only routes that this app intentionally uses as stock-detail parents.
 * Deep links may omit `returnTo`, and malformed external values must never be
 * used as an imperative navigation target.
 */
export function normalizeStockDetailReturnPath(value: unknown): StockDetailReturnPath | null {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (typeof candidate !== 'string' || candidate.length === 0) return null;

  if (
    candidate === '/(tabs)/dashboard' ||
    candidate === '/(tabs)/signals' ||
    candidate === '/(tabs)/favorites' ||
    candidate === '/(tabs)/sectors'
  ) {
    return candidate;
  }

  if (/^\/sector\/[^/?#]+$/.test(candidate) || /^\/report\/[^/?#]+$/.test(candidate)) {
    return candidate as StockDetailReturnPath;
  }

  return null;
}

export type StockDetailBackAction =
  | { type: 'replace'; href: StockDetailReturnPath }
  | { type: 'back' };

/** Resolve Back deterministically for both normal navigation and deep links. */
export function resolveStockDetailBackAction(
  returnTo: unknown,
  canGoBack: boolean,
): StockDetailBackAction {
  const parent = normalizeStockDetailReturnPath(returnTo);
  if (parent) return { type: 'replace', href: parent };
  if (canGoBack) return { type: 'back' };
  return { type: 'replace', href: '/(tabs)/dashboard' };
}
