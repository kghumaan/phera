import {
  parseCsv,
  parseXlsx,
  parseVCard,
  applyColumnMapping,
  type ParsedRow,
} from '@/lib/admin/guest-import-parsers';
import { smartMapColumns } from '@/lib/admin/smart-column-mapping';
import { roomsService } from '@/lib/supabase/rooms-service';

/**
 * In-chat upload helpers — reuse the exact parse + import paths the
 * dedicated Guest Import wizard and Room Assignments page use, so the user
 * can do everything from the Planner chat.
 */

export interface GuestImportResult {
  imported: number;
  duplicates: number;
  errors: string[];
}

export interface GuestImportProgress {
  /** rows handed to the server so far */
  done: number;
  /** total rows parsed from the file */
  total: number;
  phase: 'parsing' | 'importing';
}

// Import rows in batches so the UI can show real progress. Kept small enough
// that a few hundred guests still tick the bar a few times.
const IMPORT_CHUNK = 150;

export async function importGuestsFromFile(
  file: File,
  weddingSlug: string,
  onProgress?: (p: GuestImportProgress) => void,
): Promise<GuestImportResult> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  let fields: string[];
  let rows: ParsedRow[];

  if (ext === 'csv' || ext === 'tsv' || ext === 'txt') {
    ({ headers: fields, rows } = parseCsv(await file.text()));
  } else if (ext === 'xlsx' || ext === 'xls') {
    ({ headers: fields, rows } = parseXlsx(await file.arrayBuffer()));
  } else if (ext === 'vcf' || ext === 'vcard') {
    fields = ['Name', 'Email', 'Phone'];
    rows = parseVCard(await file.text());
  } else {
    throw new Error('Unsupported file — use CSV, Excel (.xlsx), or vCard (.vcf).');
  }

  // The chat path imports without a preview step, so smart column mapping
  // matters even more here — an unrecognized plus-one column would be
  // silently dropped. Falls back to heuristics on any analyzer failure.
  const { mapping } = await smartMapColumns(fields, rows);
  const guests = applyColumnMapping(rows, mapping);
  if (guests.length === 0) {
    throw new Error("Couldn't find any guest names in that file.");
  }

  const total = guests.length;
  onProgress?.({ done: 0, total, phase: 'parsing' });

  // Post sequentially in chunks. Sequential matters: each chunk's server-side
  // dedup sees the prior chunks' inserts, so cross-chunk duplicates are still
  // caught (same behaviour as one big request, just observable).
  let imported = 0;
  let duplicates = 0;
  const errors: string[] = [];

  for (let i = 0; i < total; i += IMPORT_CHUNK) {
    const chunk = guests.slice(i, i + IMPORT_CHUNK);
    const res = await fetch('/api/guests/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wedding_id: weddingSlug, guests: chunk }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Import failed');
    imported += data.imported ?? 0;
    duplicates += data.duplicates ?? 0;
    if (Array.isArray(data.errors)) errors.push(...data.errors);
    onProgress?.({ done: Math.min(i + IMPORT_CHUNK, total), total, phase: 'importing' });
  }

  return { imported, duplicates, errors };
}

export interface RoomImportResult {
  count: number;
}

export async function importRoomsFromFile(file: File, weddingSlug: string): Promise<RoomImportResult> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch('/api/rooms/parse', { method: 'POST', body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Could not read that floor plan');
  const rooms = data.rooms ?? [];
  if (rooms.length === 0) throw new Error('No rooms found in that file.');
  const inserted = await roomsService.insertMany(weddingSlug, rooms);
  return { count: inserted.length };
}
