import {
  parseCsv,
  parseXlsx,
  parseVCard,
  autoMapColumns,
  applyColumnMapping,
  type ParsedRow,
} from '@/lib/admin/guest-import-parsers';
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

export async function importGuestsFromFile(file: File, weddingSlug: string): Promise<GuestImportResult> {
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

  const guests = applyColumnMapping(rows, autoMapColumns(fields));
  if (guests.length === 0) {
    throw new Error("Couldn't find any guest names in that file.");
  }

  const res = await fetch('/api/guests/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wedding_id: weddingSlug, guests }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Import failed');
  return {
    imported: data.imported ?? 0,
    duplicates: data.duplicates ?? 0,
    errors: data.errors ?? [],
  };
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
