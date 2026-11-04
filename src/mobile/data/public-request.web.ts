/** Public cross-origin GET: no credentials or custom cache headers/preflight. */
export function publicJsonRequest(): RequestInit {
  return { cache: 'no-store', credentials: 'omit', headers: { Accept: 'application/json' } };
}

export function publicReportRequest(): RequestInit { return { credentials: 'omit' }; }
