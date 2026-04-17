import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export type ParsedRow = Record<string, string>;

export interface ParsedFile {
  headers: string[];
  rows: ParsedRow[];
}

// ─── CSV / TSV ──────────────────────────────────────────────────────

export function parseCsv(text: string): ParsedFile {
  const result = Papa.parse<ParsedRow>(text, { header: true, skipEmptyLines: true });
  if (result.errors.length > 0 && result.data.length === 0) {
    throw new Error(`CSV parse error: ${result.errors[0].message}`);
  }
  return {
    headers: result.meta.fields || [],
    rows: result.data,
  };
}

// ─── Excel (.xlsx / .xls) ───────────────────────────────────────────

export function parseXlsx(buffer: ArrayBuffer): ParsedFile {
  const data = new Uint8Array(buffer);
  const wb = XLSX.read(data, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json<ParsedRow>(ws, { defval: '' });
  if (json.length === 0) {
    throw new Error('Spreadsheet is empty');
  }
  return {
    headers: Object.keys(json[0]),
    rows: json,
  };
}

// ─── vCard (.vcf) — RFC 6350 vCard 3.0 / 4.0 ────────────────────────
// Handles exports from iOS Contacts, iCloud, Android Contacts, Google Contacts.

export function parseVCard(text: string): ParsedRow[] {
  // Unfold continuation lines (lines starting with space or tab continue the previous)
  const unfolded = text.replace(/\r?\n[ \t]/g, '');
  const blocks = unfolded.split(/BEGIN:VCARD/i).slice(1);

  const contacts: ParsedRow[] = [];
  for (const block of blocks) {
    const card = block.split(/END:VCARD/i)[0];
    const lines = card.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

    let name = '';
    let email = '';
    let phone = '';

    for (const line of lines) {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;
      const left = line.slice(0, colonIdx);
      const value = line.slice(colonIdx + 1).trim();
      const property = left.split(';')[0].toUpperCase();

      if (property === 'FN' && value) {
        name = value;
      } else if (property === 'N' && !name && value) {
        // N: Family;Given;Middle;Prefix;Suffix
        const parts = value.split(';');
        const given = parts[1] || '';
        const family = parts[0] || '';
        name = [given, family].filter(Boolean).join(' ').trim();
      } else if (property === 'EMAIL' && !email && value) {
        email = value;
      } else if (property === 'TEL' && !phone && value) {
        // Strip formatting (spaces, dashes, parens) but keep leading +
        phone = value.replace(/[^\d+]/g, '');
      }
    }

    if (name) {
      contacts.push({ Name: name, Email: email, Phone: phone });
    }
  }

  return contacts;
}

// ─── Column auto-mapping ────────────────────────────────────────────

export const AUTO_MAP: Record<string, string> = {
  name: 'name', 'full name': 'name', full_name: 'name', guest: 'name', 'guest name': 'name',
  'first name': 'first_name', first_name: 'first_name', firstname: 'first_name', first: 'first_name',
  'last name': 'last_name', last_name: 'last_name', lastname: 'last_name', last: 'last_name', surname: 'last_name',
  email: 'email', 'email address': 'email', 'e-mail': 'email',
  phone: 'phone', 'phone number': 'phone', mobile: 'phone', cell: 'phone', telephone: 'phone', 'contact number': 'phone', 'phone no': 'phone',
  side: 'wedding_side', 'wedding side': 'wedding_side', wedding_side: 'wedding_side',
  tag: 'group', tags: 'group', label: 'group', category: 'group',
  group: 'group', family: 'group', 'group name': 'group', 'family name': 'group', team: 'group',
};

// Fuzzy match: exact hit first, then substring heuristics.
function matchField(rawHeader: string): string | null {
  const key = rawHeader.trim().toLowerCase();
  if (!key) return null;
  if (AUTO_MAP[key]) return AUTO_MAP[key];

  // Normalize separators so "phone_number" / "phone-number" / "phone number" all collapse.
  const norm = key.replace(/[_\-.]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (AUTO_MAP[norm]) return AUTO_MAP[norm];

  // Concatenated / camelCase forms — strip whitespace and do substring checks.
  const squashed = norm.replace(/\s+/g, '');

  // Email
  if (squashed.includes('email') || squashed.includes('emailaddress') || /e-?mail/.test(squashed)) return 'email';

  // Phone
  if (/(phone|mobile|cell|telephone|^tel$|whatsapp|contactno|contactnumber)/.test(squashed)) return 'phone';

  // First / Last name variants
  if (squashed.includes('firstname') || squashed === 'first' || squashed === 'given' || squashed === 'givenname') return 'first_name';
  if (squashed.includes('lastname') || squashed === 'last' || squashed === 'surname' || squashed === 'familyname') return 'last_name';

  // Full name / person-ish
  if (squashed.includes('fullname') || squashed === 'name' || squashed.endsWith('name')) return 'name';
  if (/(guest|invitee|attendee|contact|person)/.test(squashed)) return 'name';

  // Side
  if (squashed.includes('side')) return 'wedding_side';

  // Tag / group
  if (/(tag|group|category|label|team)/.test(squashed)) return 'group';

  return null;
}

export function autoMapColumns(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const taken = new Set<string>();

  for (const header of headers) {
    const field = matchField(header);
    if (!field) continue;
    // Don't overwrite a field already claimed by an earlier column.
    if (taken.has(field)) continue;
    mapping[header] = field;
    taken.add(field);
  }

  // Fallback: if nothing maps to a name at all, use the first non-empty header.
  const hasName = Object.values(mapping).some((v) => v === 'name' || v === 'first_name');
  if (!hasName && headers.length > 0) {
    const first = headers.find((h) => h && h.trim());
    if (first && !mapping[first]) {
      mapping[first] = 'name';
    }
  }

  return mapping;
}

// Rows whose "name" is actually a header label repeated in the data.
// Catches spreadsheets with title/banner rows or header duplication.
const HEADER_NAME_BLOCKLIST = new Set([
  'name', 'full name', 'fullname',
  'guest', 'guests', 'guest name', 'guestname', 'guest names',
  'first name', 'firstname', 'first',
  'last name', 'lastname', 'last', 'surname',
  'contact', 'contacts', 'contact name',
  'invitee', 'invitees', 'attendee', 'attendees',
  'person', 'people',
]);

// ─── Apply mapping to build final guest payload ─────────────────────

export function applyColumnMapping(
  rows: ParsedRow[],
  columnMap: Record<string, string>,
): ParsedRow[] {
  return rows
    .map((row) => {
      const guest: ParsedRow = {};
      for (const [header, field] of Object.entries(columnMap)) {
        if (field && row[header]) {
          guest[field] = row[header].trim();
        }
      }
      // Combine first + last if no name mapped
      if (!guest.name && (guest.first_name || guest.last_name)) {
        guest.name = [guest.first_name, guest.last_name].filter(Boolean).join(' ');
      }
      delete guest.first_name;
      delete guest.last_name;
      return guest;
    })
    .filter((g) => {
      if (!g.name) return false;
      const lower = g.name.toLowerCase().replace(/\s+/g, ' ').trim();
      if (HEADER_NAME_BLOCKLIST.has(lower)) return false;
      return true;
    });
}
