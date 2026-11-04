/**
 * Lightweight runtime schema validation for the dashboard data.json
 * payload. Pure functions, no React Native deps — safe to import from
 * the Node-side smoke test as well as from the app at runtime.
 *
 * We intentionally do NOT pull a heavy validator (zod/ajv) — this stays
 * one tree-shakable file with no extra deps in the bundle. The shape
 * we check is the bare minimum the app crashes on if missing; deeper
 * field coverage lives in TypeScript types.
 */

export interface DashboardSchemaSummary {
  lastUpdated: string;
  tickerCount: number;
  sectorCount: number;
  hasRecommendations: boolean;
  hasCautions: boolean;
}

export type DashboardSchemaResult =
  | { ok: true; errors: []; summary: DashboardSchemaSummary }
  | { ok: false; errors: string[]; summary: null };

const REQUIRED_TOP_LEVEL = [
  'last_updated',
  'tickers',
  'ticker_data',
  'sector_rotation',
  'recommendations',
  'cautions',
] as const;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Validate the dashboard payload. Accumulates ALL errors (doesn't
 *  short-circuit on first miss) so callers can show a complete report. */
export function validateDashboardSchema(data: unknown): DashboardSchemaResult {
  const errors: string[] = [];

  if (!isPlainObject(data)) {
    return { ok: false, errors: ['root is not an object'], summary: null };
  }

  for (const key of REQUIRED_TOP_LEVEL) {
    if (!(key in data)) errors.push(`missing top-level key: ${key}`);
  }

  if (typeof data.last_updated !== 'string' || data.last_updated.length === 0) {
    errors.push('last_updated must be a non-empty string');
  }
  if (!Array.isArray(data.tickers)) {
    errors.push('tickers must be an array');
  }
  if (!isPlainObject(data.ticker_data)) {
    errors.push('ticker_data must be an object');
  }
  if (!isPlainObject(data.sector_rotation)) {
    errors.push('sector_rotation must be an object');
  }
  if ('recommendations' in data && !Array.isArray(data.recommendations)) {
    errors.push('recommendations must be an array when present');
  }
  if ('cautions' in data && !Array.isArray(data.cautions)) {
    errors.push('cautions must be an array when present');
  }

  // At least one ticker must have indicators + signals + price_history
  if (isPlainObject(data.ticker_data)) {
    const entries = Object.values(data.ticker_data);
    const richEnough = entries.some((t) => {
      if (!isPlainObject(t)) return false;
      return (
        isPlainObject(t.indicators) &&
        isPlainObject(t.signals) &&
        Array.isArray(t.price_history) &&
        t.price_history.length > 0
      );
    });
    if (!richEnough) {
      errors.push(
        'no ticker has all of indicators + signals + non-empty price_history',
      );
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors, summary: null };
  }

  const tickerData = data.ticker_data as Record<string, unknown>;
  const sectorRotation = data.sector_rotation as Record<string, unknown>;
  return {
    ok: true,
    errors: [],
    summary: {
      lastUpdated: data.last_updated as string,
      tickerCount: Object.keys(tickerData).length,
      sectorCount: Object.keys(sectorRotation).length,
      hasRecommendations: Array.isArray(data.recommendations),
      hasCautions: Array.isArray(data.cautions),
    },
  };
}
