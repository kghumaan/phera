import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export type ParsedRow = Record<string, string>;

export interface ParsedFile {
  headers: string[];
  rows: ParsedRow[];
}

/** A guest built from a mapped spreadsheet row — mirrors the shape
 *  `/api/guests/import` accepts. */
export interface MappedGuest {
  name?: string;
  email?: string;
  phone?: string;
  wedding_side?: string;
  /** Raw tag cell (legacy single-string path — the API splits on , ; |). */
  group?: string;
  /** Preferred multi-tag field. Set when we add derived tags (e.g.
   *  `plus-one-allowed` from a yes/no plus-one column); the raw tag cell is
   *  merged in so nothing is lost. */
  tags?: string[];
  plus_one_name?: string;
  plus_one_phone?: string;
  additional_guests?: Array<{ name: string; phone: string }>;
  /** Expected attendees for this invite (primary + companions). Computed
   *  from plus-one/additional-guest columns when not explicit in the file. */
  party_size?: number;
}

/** Excel hands numeric cells back as numbers; every consumer of ParsedRow
 *  assumes strings. Coerce at the boundary AND at each use site (rows can
 *  arrive from anywhere). */
function toStr(v: unknown): string {
  if (typeof v === 'string') return v;
  if (v == null) return '';
  return String(v);
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
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
  if (json.length === 0) {
    throw new Error('Spreadsheet is empty');
  }
  // sheet_to_json returns raw cell values — numbers stay numbers. Coerce
  // everything to strings so ParsedRow's contract actually holds (a numeric
  // "No." or "Party Size" column must not crash downstream .trim() calls).
  const rows: ParsedRow[] = json.map((raw) => {
    const row: ParsedRow = {};
    for (const key of Object.keys(raw)) {
      row[key] = toStr(raw[key]);
    }
    return row;
  });
  return {
    headers: Object.keys(json[0]),
    rows,
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

/** Fields that may be claimed by MORE than one column — spreadsheets often
 *  carry "Guest 2", "Guest 3", "Spouse", "Kids" side by side. */
export const REPEATABLE_FIELDS = new Set(['additional_guest_name', 'additional_guest_phone']);

/** Every internal field a column can map to. Shared with the LLM column
 *  analyzer so its vocabulary and ours stay in lockstep. */
export const MAPPABLE_FIELDS = [
  'name',
  'first_name',
  'last_name',
  'email',
  'phone',
  'wedding_side',
  'group',
  'plus_one_name',
  'plus_one_flag',
  'plus_one_phone',
  'additional_guest_name',
  'additional_guest_phone',
  'party_size',
  'ignore',
] as const;
export type MappableField = (typeof MAPPABLE_FIELDS)[number];

export const AUTO_MAP: Record<string, string> = {
  name: 'name', 'full name': 'name', full_name: 'name', guest: 'name', 'guest name': 'name',
  'first name': 'first_name', first_name: 'first_name', firstname: 'first_name', first: 'first_name',
  'last name': 'last_name', last_name: 'last_name', lastname: 'last_name', last: 'last_name', surname: 'last_name',
  email: 'email', 'email address': 'email', 'e-mail': 'email',
  phone: 'phone', 'phone number': 'phone', mobile: 'phone', cell: 'phone', telephone: 'phone', 'contact number': 'phone', 'phone no': 'phone',
  side: 'wedding_side', 'wedding side': 'wedding_side', wedding_side: 'wedding_side',
  tag: 'group', tags: 'group', label: 'group', category: 'group',
  group: 'group', family: 'group', 'group name': 'group', 'family name': 'group', team: 'group',
  // Plus-one + party-size columns. A "plus one" column may hold a NAME, a
  // yes/no flag, or a count — applyColumnMapping interprets each cell.
  'plus one': 'plus_one_name', plus_one: 'plus_one_name', plusone: 'plus_one_name', 'plus one name': 'plus_one_name',
  'plus 1': 'plus_one_name', 'plus+1': 'plus_one_name', '+1': 'plus_one_name', '+1 name': 'plus_one_name',
  'companion': 'plus_one_name', 'guest plus one': 'plus_one_name',
  'plus one phone': 'plus_one_phone', 'plus_one_phone': 'plus_one_phone', 'plus 1 phone': 'plus_one_phone',
  '+1 phone': 'plus_one_phone', 'companion phone': 'plus_one_phone',
  // Extra companions beyond the plus one.
  'additional guest': 'additional_guest_name', 'additional guests': 'additional_guest_name',
  'second guest': 'additional_guest_name', 'other guests': 'additional_guest_name',
  spouse: 'additional_guest_name', partner: 'additional_guest_name',
  'party size': 'party_size', party_size: 'party_size', 'partysize': 'party_size',
  'headcount': 'party_size', 'head count': 'party_size', 'party count': 'party_size',
  'number of guests': 'party_size', 'no': 'party_size', 'no.': 'party_size', 'count': 'party_size',
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

  // Companion / plus-one PHONES — must run BEFORE the generic phone rule,
  // or "Plus One Phone" / "Guest 2 Phone" claims the primary phone field.
  const phoneish = /(phone|mobile|cell|whatsapp|telephone|contactno|contactnumber)/.test(squashed);
  if (phoneish) {
    if (/(plusone|plus1|companion)/.test(squashed)) return 'plus_one_phone';
    if (
      /^(guest|attendee|invitee|person)\d+/.test(squashed) ||
      /^(additional|extra|other)guests?\d*/.test(squashed) ||
      /^(spouse|partner)/.test(squashed)
    ) {
      return 'additional_guest_phone';
    }
  }

  // Phone (primary guest)
  if (/(phone|mobile|cell|telephone|^tel$|whatsapp|contactno|contactnumber)/.test(squashed)) return 'phone';

  // First / Last name variants
  if (squashed.includes('firstname') || squashed === 'first' || squashed === 'given' || squashed === 'givenname') return 'first_name';
  if (squashed.includes('lastname') || squashed === 'last' || squashed === 'surname' || squashed === 'familyname') return 'last_name';

  // Additional companions — "Guest 2", "Guest 3", "Additional Guest 1",
  // "2nd Guest", spouse/partner columns. Checked BEFORE the generic
  // guest→name rule so "Guest 2" doesn't collapse into the primary name.
  if (/^(additional|extra|other|accompanying)guests?\d*$/.test(squashed)) return 'additional_guest_name';
  if (/^(guest|attendee|invitee|member|person)?name[2-9]$/.test(squashed)) return 'additional_guest_name';
  if (/^(guest|attendee|invitee|member|person)[2-9]$/.test(squashed)) return 'additional_guest_name';
  if (/^(2nd|3rd|[4-9]th|second|third|fourth|fifth)(guest|attendee|name|person)$/.test(squashed)) return 'additional_guest_name';
  if (squashed === 'spouse' || squashed === 'partner' || squashed === 'spousename' || squashed === 'partnername') return 'additional_guest_name';

  // Headcount variants that CONTAIN "guest" — must run before the generic
  // guest→name rule below ("No of Guests", "Guest Count", "Total Guests").
  if (/(numberofguests|noofguests|guestcount|totalguests|guestscount)/.test(squashed)) return 'party_size';

  // Full name / person-ish
  if (squashed.includes('fullname') || squashed === 'name' || squashed.endsWith('name')) return 'name';
  if (/(guest|invitee|attendee|contact|person)/.test(squashed)) return 'name';

  // Side
  if (squashed.includes('side')) return 'wedding_side';

  // Plus-one names (phones were handled above).
  if (squashed.includes('plusone') || squashed.includes('plus1') || squashed === 'companion' || squashed === '+1') {
    return 'plus_one_name';
  }

  // Party size / headcount
  if (/(partysize|headcount|partycount|numberofguests)/.test(squashed) || squashed === 'count') {
    return 'party_size';
  }

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
    // Don't overwrite a field already claimed by an earlier column — except
    // repeatable fields, which several columns can share.
    if (taken.has(field) && !REPEATABLE_FIELDS.has(field)) continue;
    mapping[header] = field;
    taken.add(field);
  }

  // Fallback: if nothing maps to a name at all, use the first non-empty
  // header — re-purposing a companion-name claim if that's what it got
  // (a sheet whose only name-ish column is "Spouse" must still import).
  const hasName = Object.values(mapping).some((v) => v === 'name' || v === 'first_name');
  if (!hasName && headers.length > 0) {
    const first = headers.find((h) => h && h.trim());
    if (first && (!mapping[first] || mapping[first] === 'additional_guest_name')) {
      mapping[first] = 'name';
    }
  }

  return mapping;
}

/** Merge the heuristic mapping with an LLM column analysis. The LLM is
 *  authoritative where it makes a claim ('ignore' unmaps a header); the
 *  heuristic fills in headers the LLM said nothing about. Non-repeatable
 *  fields stay unique across the merged result. */
export function mergeColumnMappings(
  heuristic: Record<string, string>,
  llm: Record<string, string>,
  headers: string[],
): Record<string, string> {
  const result: Record<string, string> = {};
  const claimed = new Set<string>();

  const claim = (header: string, field: string) => {
    if (!REPEATABLE_FIELDS.has(field)) {
      if (claimed.has(field)) return;
      claimed.add(field);
    }
    result[header] = field;
  };

  // LLM claims first, in sheet column order.
  for (const header of headers) {
    const field = llm[header];
    if (!field || field === 'ignore') continue;
    claim(header, field);
  }
  // Heuristic fills only headers the LLM didn't rule on.
  for (const header of headers) {
    if (header in result || header in llm) continue;
    const field = heuristic[header];
    if (!field || field === 'ignore') continue;
    claim(header, field);
  }

  return result;
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

// ─── Companion cell interpretation ──────────────────────────────────
// A "Plus One" / "Guest 2" cell can hold a name ("Aisha Mehta"), a yes/no
// flag, or a count — often MIXED within one column (name when known, Yes
// otherwise). So interpretation is per-cell, not per-column.

const FLAG_TRUE = new Set(['y', 'yes', 'true', 'x', '✓', '✔']);
const FLAG_FALSE = new Set(['n', 'no', 'false', 'none', 'na', 'n/a', '-', '—', 'tbd', '?']);

export interface CompanionCell {
  /** Named companions found in the cell (already split). */
  names: string[];
  /** How many extra attendees this cell implies (named or not). */
  bump: number;
  /** True when the cell says "yes, allowed/bringing one" without a name. */
  allowance: boolean;
}

export function interpretCompanionCell(raw: unknown): CompanionCell {
  const value = toStr(raw).trim();
  if (!value) return { names: [], bump: 0, allowance: false };
  const lower = value.toLowerCase();
  if (FLAG_FALSE.has(lower)) return { names: [], bump: 0, allowance: false };
  if (FLAG_TRUE.has(lower)) return { names: [], bump: 1, allowance: true };
  if (/^\d+$/.test(value)) {
    const n = Number.parseInt(value, 10);
    return { names: [], bump: n > 0 ? n : 0, allowance: n > 0 };
  }
  const names = splitNameCell(value);
  return { names, bump: names.length, allowance: false };
}

/** A "No." column holding 1, 2, 3… is a serial row index, not a party size.
 *  Consecutive-increment detection (not index-anchored) so banner rows or
 *  duplicated-header rows don't hide the pattern. */
export function looksLikeSerialColumn(values: unknown[]): boolean {
  const nums = values
    .map((v) => toStr(v).trim())
    .filter(Boolean)
    .map((t) => Number.parseInt(t, 10))
    .filter((n) => Number.isFinite(n));
  if (nums.length < 3 || nums[0] !== 1) return false;
  let increments = 0;
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] === nums[i - 1] + 1) increments++;
  }
  return increments / (nums.length - 1) >= 0.9;
}

const HONORIFIC_RE = /^(mr|mrs|ms|mx|dr|prof|shri|smt)\.?$/i;

/** Split a cell holding several companion names: "Aarav, Meera" /
 *  "Aarav & Meera" / "Aarav and Meera". Honorific couples ("Mr & Mrs
 *  Sharma") stay together as one entry. */
function splitNameCell(raw: string): string[] {
  const parts = raw
    .split(/[,;/&]|\band\b/i)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.some((p) => HONORIFIC_RE.test(p))) return [raw.trim()];
  return parts;
}

const AUTO_PLUS_ONE_TAG = 'plus-one-allowed';

// ─── Apply mapping to build final guest payload ─────────────────────

export function applyColumnMapping(
  rows: ParsedRow[],
  columnMap: Record<string, string>,
): MappedGuest[] {
  // Group headers by field, preserving sheet column order.
  const headersByField = new Map<string, string[]>();
  for (const [header, field] of Object.entries(columnMap)) {
    if (!field) continue;
    const list = headersByField.get(field) || [];
    list.push(header);
    headersByField.set(field, list);
  }
  const single = (field: string): string | undefined => headersByField.get(field)?.[0];

  const partyHeader = single('party_size');
  const partyIsSerial = partyHeader
    ? looksLikeSerialColumn(rows.map((r) => r[partyHeader]))
    : false;

  const additionalNameHeaders = headersByField.get('additional_guest_name') || [];
  const additionalPhoneHeaders = headersByField.get('additional_guest_phone') || [];

  // Pair companion phone columns to companion name columns by header
  // affinity ("Guest 3 Phone" ↔ "Guest 3"), falling back to position.
  const squash = (h: string) =>
    h.trim().toLowerCase().replace(/[_\-.]+/g, ' ').replace(/\s+/g, '');
  const stripPhoneWords = (h: string) =>
    squash(h).replace(/(phone|mobile|cell|whatsapp|telephone|contactnumber|contactno|number|tel|no)/g, '');
  const phoneForName = new Map<string, string>();
  const unpairedPhones = [...additionalPhoneHeaders];
  for (const nameHeader of additionalNameHeaders) {
    const nameKey = squash(nameHeader);
    const idx = unpairedPhones.findIndex((p) => {
      const phoneKey = stripPhoneWords(p);
      return phoneKey === nameKey || (phoneKey.length > 0 && nameKey.startsWith(phoneKey));
    });
    if (idx !== -1) {
      phoneForName.set(nameHeader, unpairedPhones[idx]);
      unpairedPhones.splice(idx, 1);
    }
  }
  // Positional fallback for phones with no affinity match.
  for (const nameHeader of additionalNameHeaders) {
    if (phoneForName.has(nameHeader)) continue;
    const next = unpairedPhones.shift();
    if (!next) break;
    phoneForName.set(nameHeader, next);
  }

  return rows
    .map((row) => {
      const guest: MappedGuest = {};
      const cell = (header: string | undefined): string => {
        if (!header || !Object.prototype.hasOwnProperty.call(row, header)) return '';
        return toStr(row[header]).trim();
      };

      const fullName = cell(single('name'));
      const firstName = cell(single('first_name'));
      const lastName = cell(single('last_name'));
      guest.name = fullName || [firstName, lastName].filter(Boolean).join(' ') || undefined;

      const email = cell(single('email'));
      if (email) guest.email = email;
      const phone = cell(single('phone'));
      if (phone) guest.phone = phone;
      const side = cell(single('wedding_side'));
      if (side) guest.wedding_side = side;
      const group = cell(single('group'));
      if (group) guest.group = group;

      const additional: Array<{ name: string; phone: string }> = [];
      let unnamedExtra = 0;

      // ── Plus one — per-cell: name(s), yes/no flag, or count.
      let plusBump = 0;
      let plusOneAllowed = false;
      const plusOne = interpretCompanionCell(cell(single('plus_one_name')));
      if (plusOne.names.length > 0) {
        guest.plus_one_name = plusOne.names[0];
        // Overflow: "Plus One: Aarav & Meera" → second name becomes an
        // additional guest so the headcount stays honest.
        for (const extra of plusOne.names.slice(1)) {
          additional.push({ name: extra, phone: '' });
        }
        plusBump = 1; // the named plus one; overflow counts via `additional`
      } else if (plusOne.bump > 0) {
        plusBump = plusOne.bump;
        plusOneAllowed = plusOne.allowance;
      }
      // Dedicated yes/no column (usually from the LLM analyzer).
      if (plusBump === 0) {
        const flag = interpretCompanionCell(cell(single('plus_one_flag')));
        if (flag.bump > 0 && flag.names.length === 0) {
          plusBump = flag.bump;
          plusOneAllowed = flag.allowance;
        }
      }
      const plusOnePhone = cell(single('plus_one_phone'));
      if (plusOnePhone) guest.plus_one_phone = plusOnePhone;

      // ── Additional companions — one entry per named person; flag/count
      //    cells ("Kids: 2", "Yes") bump the headcount without names.
      for (const header of additionalNameHeaders) {
        const parsed = interpretCompanionCell(cell(header));
        if (parsed.names.length > 0) {
          const pairedPhone = cell(phoneForName.get(header));
          parsed.names.forEach((n, i) => {
            additional.push({ name: n, phone: i === 0 ? pairedPhone : '' });
          });
        } else {
          unnamedExtra += parsed.bump;
        }
      }
      // Phone-only companion columns never claimed by a name column.
      for (const header of unpairedPhones) {
        const value = cell(header);
        if (value) additional.push({ name: '', phone: value });
      }
      if (additional.length > 0) guest.additional_guests = additional;

      // ── Party size — explicit column wins unless it's a serial index;
      //    otherwise computed from companions. Never report less than what
      //    the companion columns prove.
      let explicit: number | undefined;
      if (partyHeader && !partyIsSerial) {
        const n = Number.parseInt(cell(partyHeader), 10);
        if (Number.isFinite(n) && n > 0) explicit = n;
      }
      const computed = 1 + plusBump + additional.length + unnamedExtra;
      const partySize = Math.max(explicit ?? 0, computed);
      if (partySize > 1) guest.party_size = partySize;
      else if (explicit) guest.party_size = explicit;

      // ── Tags — surface an unnamed plus-one allowance as the
      //    `plus-one-allowed` tag so it's visible and actionable later.
      if (plusOneAllowed) {
        guest.tags = [...(group ? [group] : []), AUTO_PLUS_ONE_TAG];
      }

      return guest;
    })
    .filter((g) => {
      if (!g.name) return false;
      const lower = g.name.toLowerCase().replace(/\s+/g, ' ').trim();
      if (HEADER_NAME_BLOCKLIST.has(lower)) return false;
      return true;
    });
}
