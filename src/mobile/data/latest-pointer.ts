/**
 * Adapters fetch latest.json through source-chain, pass decoded unknown data
 * here, and compare hash with their cached envelope through data-hash. Market
 * schemas and publication/cache policy remain the adapter's responsibility.
 */
export interface LatestPointer {
  hash: string;
  schema_version?: string;
  report_date?: string;
  generated_at_utc?: string;
  publication_slot?: string;
  publication_revision?: number;
  publication_run_id?: string;
  data_url_v2?: string;
  data_url?: string;
}

export function dashboardDataPath(pointer: Pick<LatestPointer, 'data_url_v2'> | null | undefined): string {
  const path = pointer?.data_url_v2;
  return typeof path === 'string' && /^dashboard\/data-[a-f0-9]{8,}\.json$/.test(path)
    ? path : 'dashboard/data.json';
}

export function parseLatestPointer(raw: unknown): LatestPointer | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const value = raw as Record<string, unknown>;
  if (typeof value.hash !== 'string' || !value.hash.trim()) return null;
  const pointer: LatestPointer = { hash: value.hash };
  const fields = ['schema_version', 'report_date', 'generated_at_utc', 'publication_slot', 'publication_run_id', 'data_url'] as const;
  for (const field of fields) {
    if (typeof value[field] === 'string') pointer[field] = value[field];
  }
  if (typeof value.publication_revision === 'number' && Number.isSafeInteger(value.publication_revision) && value.publication_revision >= 0) {
    pointer.publication_revision = value.publication_revision;
  }
  if (typeof value.data_url_v2 === 'string' && dashboardDataPath({ data_url_v2: value.data_url_v2 }) !== 'dashboard/data.json') {
    pointer.data_url_v2 = value.data_url_v2;
  }
  return pointer;
}
