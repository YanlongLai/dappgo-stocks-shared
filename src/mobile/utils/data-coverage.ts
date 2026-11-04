/** Compatibility-aware expected-vs-covered ticker coverage. */

export type DataCoverageStatus = 'complete' | 'partial' | 'unknown';

export interface DataCoverage {
  expected_tickers: string[];
  covered_tickers: string[];
  missing_tickers: string[];
  expected_count: number;
  covered_count: number;
  missing_count: number;
  coverage_ratio: number;
  status: DataCoverageStatus;
  primary_dimension?: string;
  dimensions?: Record<string, DataCoverage>;
}

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return value != null && typeof value === 'object' && !Array.isArray(value)
    ? value as UnknownRecord
    : null;
}

function normalizeSymbols(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const symbols: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string') continue;
    const symbol = item.trim().toUpperCase();
    if (symbol.length === 0 || seen.has(symbol)) continue;
    seen.add(symbol);
    symbols.push(symbol);
  }
  return symbols;
}

export function buildDataCoverage(expectedTickers: Iterable<string>, coveredTickers: Iterable<string>): DataCoverage | null {
  const expected = normalizeSymbols(Array.from(expectedTickers));
  if (expected.length === 0) return null;
  const coveredSet = new Set(normalizeSymbols(Array.from(coveredTickers)));
  const covered = expected.filter((symbol) => coveredSet.has(symbol));
  const missing = expected.filter((symbol) => !coveredSet.has(symbol));
  return {
    expected_tickers: expected,
    covered_tickers: covered,
    missing_tickers: missing,
    expected_count: expected.length,
    covered_count: covered.length,
    missing_count: missing.length,
    coverage_ratio: Number((covered.length / expected.length).toFixed(3)),
    status: missing.length === 0 ? 'complete' : 'partial',
  };
}

function parseCoverage(value: unknown): DataCoverage | null {
  const record = asRecord(value);
  if (!record) return null;
  const result = buildDataCoverage(normalizeSymbols(record.expected_tickers), normalizeSymbols(record.covered_tickers));
  if (!result) return null;
  const dimensionsRecord = asRecord(record.dimensions);
  if (dimensionsRecord) {
    const dimensions: Record<string, DataCoverage> = {};
    for (const [name, dimension] of Object.entries(dimensionsRecord)) {
      const parsed = parseCoverage(dimension);
      if (parsed) dimensions[name] = parsed;
    }
    if (Object.keys(dimensions).length > 0) result.dimensions = dimensions;
  }
  if (typeof record.primary_dimension === 'string' && record.primary_dimension.trim()) {
    result.primary_dimension = record.primary_dimension.trim();
  }
  return result;
}

export function resolveDataCoverage(data: unknown, coveredFallback: Iterable<string>): DataCoverage | null {
  const record = asRecord(data);
  if (!record) return null;
  const explicit = parseCoverage(record.data_coverage);
  if (explicit) return explicit;
  return buildDataCoverage(normalizeSymbols(record.tickers), coveredFallback);
}
