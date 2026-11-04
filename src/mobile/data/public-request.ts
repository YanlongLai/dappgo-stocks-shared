/** Preserve mobile cache controls. Metro selects the CORS-simple browser variant. */
export function publicJsonRequest(): RequestInit {
  return { cache: 'no-store', headers: { Accept: 'application/json', 'Cache-Control': 'no-cache', Pragma: 'no-cache' } };
}

/** Reports/metadata retain their existing native request defaults. */
export function publicReportRequest(): RequestInit { return {}; }
