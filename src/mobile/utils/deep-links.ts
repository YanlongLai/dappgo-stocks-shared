import type { AppProfile } from '../app-profile';

/** Bind the existing scheme in the app; native Linking/share APIs stay there. */
export function createDeepLinks(profile: AppProfile) {
  /** Generate a shareable deep link to a report by date. */
  function generateReportLink(date: string): string {
    return `${profile.legacyDeepLinkScheme}://report/${date}`;
  }

  /** Generate a shareable deep link to a backtest configuration. */
  function generateBacktestLink(
    symbol: string,
    strategy: string,
    otmPct: number
  ): string {
    return `${profile.legacyDeepLinkScheme}://backtest?symbol=${encodeURIComponent(symbol)}&strategy=${encodeURIComponent(strategy)}&otm=${otmPct}`;
  }

  /** Generate a shareable deep link to the matrix view for a symbol. */
  function generateMatrixLink(symbol: string): string {
    return `${profile.legacyDeepLinkScheme}://matrix?symbol=${encodeURIComponent(symbol)}`;
  }
  return { generateReportLink, generateBacktestLink, generateMatrixLink };
}
