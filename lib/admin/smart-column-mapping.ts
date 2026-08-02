import {
  autoMapColumns,
  mergeColumnMappings,
  MAPPABLE_FIELDS,
  type ParsedRow,
} from './guest-import-parsers';

/**
 * LLM-assisted column mapping for guest list imports.
 *
 * The heuristic mapper in guest-import-parsers handles conventional headers,
 * but real spreadsheets say "Guest 2", "Bringing someone?", "Accompanied by",
 * or bury companions in columns no dictionary anticipates. We send ONLY the
 * headers plus a few sample rows to `/api/guests/import/analyze` (Gemini),
 * and merge its verdict over the heuristics. Any failure — offline, no API
 * key, timeout — falls back to pure heuristics, so this can never make an
 * import worse than it is today.
 */

/** LLM output fields → internal mapping fields. Identity for most; the
 *  analyzer says `tags`, we store `group` (legacy internal name). */
const FIELD_ALIASES: Record<string, string> = { tags: 'group' };

const VALID_FIELDS = new Set<string>(MAPPABLE_FIELDS);

/** Validate a raw `{ columns: [{ header, field }] }` analysis against the
 *  actual sheet headers. Unknown fields and unknown headers are dropped. */
export function sanitizeColumnAnalysis(
  raw: unknown,
  headers: string[],
): Record<string, string> {
  const out: Record<string, string> = {};
  if (!raw || typeof raw !== 'object') return out;
  const columns = (raw as { columns?: unknown }).columns;
  if (!Array.isArray(columns)) return out;

  const headerSet = new Set(headers);
  for (const entry of columns) {
    if (!entry || typeof entry !== 'object') continue;
    const header = (entry as { header?: unknown }).header;
    const rawField = (entry as { field?: unknown }).field;
    if (typeof header !== 'string' || typeof rawField !== 'string') continue;
    const field = FIELD_ALIASES[rawField] ?? rawField;
    if (!headerSet.has(header) || !VALID_FIELDS.has(field)) continue;
    if (header in out) continue; // first claim per header wins
    out[header] = field;
  }
  return out;
}

const SAMPLE_ROW_LIMIT = 12;
const SAMPLE_CELL_LIMIT = 100;

function buildSampleRows(headers: string[], rows: ParsedRow[]): ParsedRow[] {
  return rows.slice(0, SAMPLE_ROW_LIMIT).map((row) => {
    const sample: ParsedRow = {};
    for (const h of headers) {
      // hasOwnProperty guard: a column literally named "__proto__" must not
      // pick up Object.prototype; non-string cells (numeric XLSX values) are
      // coerced rather than crashing.
      const raw = Object.prototype.hasOwnProperty.call(row, h) ? row[h] : '';
      const v = (typeof raw === 'string' ? raw : String(raw ?? '')).trim();
      sample[h] = v.length > SAMPLE_CELL_LIMIT ? `${v.slice(0, SAMPLE_CELL_LIMIT)}…` : v;
    }
    return sample;
  });
}

export interface SmartMappingResult {
  mapping: Record<string, string>;
  /** 'llm' when the analyzer contributed; 'heuristic' when it was skipped
   *  or failed and the dictionary mapping is all we have. */
  source: 'llm' | 'heuristic';
}

export async function smartMapColumns(
  headers: string[],
  rows: ParsedRow[],
  opts?: { timeoutMs?: number; signal?: AbortSignal },
): Promise<SmartMappingResult> {
  const heuristic = autoMapColumns(headers);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), opts?.timeoutMs ?? 10_000);
    opts?.signal?.addEventListener('abort', () => controller.abort(), { once: true });

    const res = await fetch('/api/guests/import/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ headers, sample_rows: buildSampleRows(headers, rows) }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`analyze failed: ${res.status}`);

    const data = await res.json();
    const llm = sanitizeColumnAnalysis(data, headers);
    if (Object.keys(llm).length === 0) throw new Error('empty analysis');

    const merged = mergeColumnMappings(heuristic, llm, headers);
    // Never accept an analysis that loses the name column entirely.
    const hasName = Object.values(merged).some((f) => f === 'name' || f === 'first_name');
    if (!hasName) throw new Error('analysis dropped the name column');

    return { mapping: merged, source: 'llm' };
  } catch {
    return { mapping: heuristic, source: 'heuristic' };
  }
}
