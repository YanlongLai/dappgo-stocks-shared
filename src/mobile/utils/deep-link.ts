/**
 * Pure helpers for building and parsing stock deep links.
 * No React Native imports — safe to use in any environment (tests, workers).
 */

/**
 * Build a deep link for a stock detail screen.
 * Returns null when scheme is falsy (e.g. running in Expo Go without a scheme).
 *
 * @example
 *   buildStockDeepLink('dappgousstocks', 'AAPL') // → 'dappgousstocks://stock/AAPL'
 *   buildStockDeepLink(null, 'AAPL')             // → null
 */
export function buildStockDeepLink(
  scheme: string | null | undefined,
  symbol: string,
): string | null {
  if (!scheme) return null;
  return `${scheme}://stock/${symbol}`;
}

/**
 * Parse a stock deep link URL back to a symbol.
 * Accepts any scheme — only the path `/stock/<symbol>` segment matters.
 * Returns null when the URL does not match the expected pattern.
 *
 * @example
 *   parseStockDeepLink('dappgousstocks://stock/AAPL') // → { symbol: 'AAPL' }
 *   parseStockDeepLink('https://example.com')         // → null
 */
export function parseStockDeepLink(url: string): { symbol: string } | null {
  // Match: <anything>://stock/<symbol>  (case-insensitive on path prefix)
  const match = url.match(/^[a-z][a-z0-9+\-.]*:\/\/stock\/([^/?#]+)/i);
  if (!match || !match[1]) return null;
  return { symbol: match[1] };
}
