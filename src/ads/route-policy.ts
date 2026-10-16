export type AdApp = 'options' | 'us_stocks' | 'tw_stocks';
const SAFE_DESTINATIONS = new Set([
  '/', '/dashboard', '/dashboard/index', '/explore', '/explore/index',
  '/favorites', '/favorites/index', '/signals', '/signals/index',
  '/reports', '/reports/index', '/sectors', '/sectors/index',
]);
function normalize(path: string): string {
  return path.replace(/^\/\(tabs\)(?=\/|$)/, '').replace(/\/$/, '') || '/';
}
/** Only recognized overview/detail routes may receive an app-open presentation. */
export function canShowAppOpenOnRoute(app: AdApp, pathname: string | null): boolean {
  if (!pathname || /[?#]/.test(pathname)) return false;
  const path = normalize(pathname);
  const overview = path.replace(/\/index$/, '');
  const overviews = app === 'options'
    ? ['/', '/dashboard', '/explore', '/favorites']
    : ['/', '/dashboard', '/signals', '/sectors', '/favorites'];
  const prefix = app === 'options' ? 'ticker' : 'stock';
  return overviews.includes(overview) || new RegExp('^/(' + prefix + '|report)/[^/]+$').test(path);
}
/** A detail exit into an explicit overview is a natural break; arbitrary routes are not. */
export function shouldShowFullscreenOnTransition(
  app: AdApp, previous: string | null, next: string | null,
): boolean {
  if (!previous || !next || previous === next) return false;
  const prefix = app === 'options' ? '/ticker/' : '/stock/';
  const research = (path: string) => path.startsWith(prefix) || path.startsWith('/report/');
  return research(previous) && SAFE_DESTINATIONS.has(normalize(next));
}

