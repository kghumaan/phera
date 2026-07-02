import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import {
  parseCsv,
  parseXlsx,
  parseVCard,
  autoMapColumns,
  applyColumnMapping,
  mergeColumnMappings,
  interpretCompanionCell,
  looksLikeSerialColumn,
  AUTO_MAP,
} from '@/lib/admin/guest-import-parsers';
import { sanitizeColumnAnalysis } from '@/lib/admin/smart-column-mapping';

// ─── CSV parsing ───────────────────────────────────────────────────

describe('parseCsv', () => {
  it('parses a standard CSV with headers', () => {
    const csv = `Name,Email,Phone,Side\nPriya Sharma,priya@email.com,+919876543210,bride\nArjun Mehta,arjun@email.com,+14155551234,groom`;
    const { headers, rows } = parseCsv(csv);
    expect(headers).toEqual(['Name', 'Email', 'Phone', 'Side']);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({ Name: 'Priya Sharma', Email: 'priya@email.com', Phone: '+919876543210', Side: 'bride' });
    expect(rows[1].Name).toBe('Arjun Mehta');
  });

  it('skips empty lines', () => {
    const csv = `Name,Email\n\nA,a@x.com\n\n\nB,b@x.com\n`;
    const { rows } = parseCsv(csv);
    expect(rows).toHaveLength(2);
  });

  it('handles quoted values containing commas', () => {
    const csv = `Name,Tag\n"Sharma, Priya","Bride's friends, US"`;
    const { rows } = parseCsv(csv);
    expect(rows[0].Name).toBe('Sharma, Priya');
    expect(rows[0].Tag).toBe("Bride's friends, US");
  });

  it('returns empty rows for an empty CSV body but does not throw', () => {
    const csv = 'Name,Email\n';
    const { headers, rows } = parseCsv(csv);
    expect(headers).toEqual(['Name', 'Email']);
    expect(rows).toEqual([]);
  });
});

// ─── XLSX parsing ──────────────────────────────────────────────────

describe('parseXlsx', () => {
  function buildXlsx(data: any[][]): ArrayBuffer {
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    return out as ArrayBuffer;
  }

  it('parses a basic .xlsx with headers and rows', () => {
    const buffer = buildXlsx([
      ['Name', 'Email', 'Phone'],
      ['Priya Sharma', 'priya@email.com', '+919876543210'],
      ['Arjun Mehta', 'arjun@email.com', '+14155551234'],
    ]);
    const { headers, rows } = parseXlsx(buffer);
    expect(headers).toEqual(['Name', 'Email', 'Phone']);
    expect(rows).toHaveLength(2);
    expect(rows[0].Name).toBe('Priya Sharma');
    expect(rows[1].Email).toBe('arjun@email.com');
  });

  it('fills missing cells with empty strings via defval', () => {
    const buffer = buildXlsx([
      ['Name', 'Email', 'Phone'],
      ['Solo', '', ''],
    ]);
    const { rows } = parseXlsx(buffer);
    expect(rows[0]).toEqual({ Name: 'Solo', Email: '', Phone: '' });
  });

  it('throws on an empty spreadsheet', () => {
    const buffer = buildXlsx([]);
    expect(() => parseXlsx(buffer)).toThrow(/empty/i);
  });
});

// ─── vCard parsing ─────────────────────────────────────────────────

describe('parseVCard', () => {
  it('parses a single iOS-style vCard 3.0', () => {
    const vcf = `BEGIN:VCARD
VERSION:3.0
N:Sharma;Priya;;;
FN:Priya Sharma
TEL;type=CELL;type=VOICE;type=pref:+91 98765 43210
EMAIL;type=INTERNET;type=HOME;type=pref:priya@email.com
END:VCARD`;
    const contacts = parseVCard(vcf);
    expect(contacts).toHaveLength(1);
    expect(contacts[0]).toEqual({
      Name: 'Priya Sharma',
      Email: 'priya@email.com',
      Phone: '+919876543210',
    });
  });

  it('parses multiple vCards in one file', () => {
    const vcf = `BEGIN:VCARD
VERSION:3.0
FN:Priya Sharma
TEL:+919876543210
EMAIL:priya@email.com
END:VCARD
BEGIN:VCARD
VERSION:3.0
FN:Arjun Mehta
TEL:+14155551234
EMAIL:arjun@email.com
END:VCARD
BEGIN:VCARD
VERSION:4.0
FN:Neha Patel
TEL:(408) 555-9876
EMAIL:neha@email.com
END:VCARD`;
    const contacts = parseVCard(vcf);
    expect(contacts).toHaveLength(3);
    expect(contacts.map((c) => c.Name)).toEqual(['Priya Sharma', 'Arjun Mehta', 'Neha Patel']);
    expect(contacts[2].Phone).toBe('4085559876'); // formatting stripped
  });

  it('falls back to N: when FN is missing', () => {
    const vcf = `BEGIN:VCARD
VERSION:3.0
N:Mehta;Arjun;;;
TEL:+14155551234
END:VCARD`;
    const contacts = parseVCard(vcf);
    expect(contacts[0].Name).toBe('Arjun Mehta');
  });

  it('skips entries with no name', () => {
    const vcf = `BEGIN:VCARD
VERSION:3.0
TEL:+14155551234
EMAIL:nameless@email.com
END:VCARD
BEGIN:VCARD
VERSION:3.0
FN:Has Name
END:VCARD`;
    const contacts = parseVCard(vcf);
    expect(contacts).toHaveLength(1);
    expect(contacts[0].Name).toBe('Has Name');
  });

  it('handles line-folded continuation lines (RFC 6350)', () => {
    // vCard fold: lines longer than 75 octets continue with a leading space
    const vcf = `BEGIN:VCARD
VERSION:3.0
FN:Priya Sharma
NOTE:This is a really long note that wraps across multiple lines per
  the RFC 6350 line-folding rules and should be unfolded properly.
EMAIL:priya@email.com
END:VCARD`;
    const contacts = parseVCard(vcf);
    expect(contacts).toHaveLength(1);
    expect(contacts[0].Email).toBe('priya@email.com');
  });

  it('handles \\r\\n (Windows) line endings from iCloud exports', () => {
    const vcf = `BEGIN:VCARD\r\nVERSION:3.0\r\nFN:Priya Sharma\r\nTEL:+919876543210\r\nEMAIL:priya@email.com\r\nEND:VCARD\r\n`;
    const contacts = parseVCard(vcf);
    expect(contacts).toHaveLength(1);
    expect(contacts[0].Name).toBe('Priya Sharma');
    expect(contacts[0].Phone).toBe('+919876543210');
  });

  it('takes the first TEL/EMAIL when multiple are present', () => {
    const vcf = `BEGIN:VCARD
VERSION:3.0
FN:Priya Sharma
TEL;type=CELL:+919876543210
TEL;type=WORK:+919999999999
EMAIL;type=HOME:priya@home.com
EMAIL;type=WORK:priya@work.com
END:VCARD`;
    const contacts = parseVCard(vcf);
    expect(contacts[0].Phone).toBe('+919876543210');
    expect(contacts[0].Email).toBe('priya@home.com');
  });

  it('returns empty array for empty or invalid input', () => {
    expect(parseVCard('')).toEqual([]);
    expect(parseVCard('not a vcard at all')).toEqual([]);
  });
});

// ─── Column auto-mapping ───────────────────────────────────────────

describe('autoMapColumns', () => {
  it('maps standard headers to their fields', () => {
    const map = autoMapColumns(['Name', 'Email', 'Phone', 'Side']);
    expect(map).toEqual({
      Name: 'name',
      Email: 'email',
      Phone: 'phone',
      Side: 'wedding_side',
    });
  });

  it('is case-insensitive and trims whitespace', () => {
    const map = autoMapColumns(['  FULL NAME ', 'E-Mail', 'Mobile']);
    expect(map['  FULL NAME ']).toBe('name');
    expect(map['E-Mail']).toBe('email');
    expect(map['Mobile']).toBe('phone');
  });

  it('maps first Tag alias to group field (first header wins)', () => {
    // Dedup: the first header that resolves to a given field wins so we
    // don't overwrite ourselves when a spreadsheet has two near-duplicate
    // tag columns. Subsequent Tag aliases are skipped.
    const map = autoMapColumns(['Tag', 'Tags', 'Label', 'Category', 'Group', 'Family']);
    expect(map).toEqual({ Tag: 'group' });
  });

  it('omits unrecognized headers', () => {
    const map = autoMapColumns(['Name', 'FavoriteIceCream']);
    expect(map).toEqual({ Name: 'name' });
  });

  it('exposes AUTO_MAP for direct lookups', () => {
    expect(AUTO_MAP['surname']).toBe('last_name');
    expect(AUTO_MAP['team']).toBe('group');
  });

  it('maps additional-guest columns, allowing several at once', () => {
    const map = autoMapColumns(['Name', 'Additional Guest', 'Guest 2', 'Guest 3', 'Spouse']);
    expect(map).toEqual({
      Name: 'name',
      'Additional Guest': 'additional_guest_name',
      'Guest 2': 'additional_guest_name',
      'Guest 3': 'additional_guest_name',
      Spouse: 'additional_guest_name',
    });
  });

  it('maps "Guest Name 2" as an additional guest, not the primary name', () => {
    const map = autoMapColumns(['Guest Name', 'Guest Name 2']);
    expect(map).toEqual({
      'Guest Name': 'name',
      'Guest Name 2': 'additional_guest_name',
    });
  });
});

// ─── Companion cell interpretation (per-cell, mixed columns) ───────

describe('interpretCompanionCell', () => {
  it('treats a name as one named companion', () => {
    expect(interpretCompanionCell('Aisha Mehta')).toEqual({ names: ['Aisha Mehta'], bump: 1, allowance: false });
  });
  it('treats yes/no flags as unnamed allowance', () => {
    expect(interpretCompanionCell('Yes')).toEqual({ names: [], bump: 1, allowance: true });
    expect(interpretCompanionCell('No')).toEqual({ names: [], bump: 0, allowance: false });
    expect(interpretCompanionCell('TBD')).toEqual({ names: [], bump: 0, allowance: false });
  });
  it('treats integers as counts', () => {
    expect(interpretCompanionCell('2')).toEqual({ names: [], bump: 2, allowance: true });
    expect(interpretCompanionCell('0')).toEqual({ names: [], bump: 0, allowance: false });
  });
  it('splits multiple names in one cell', () => {
    expect(interpretCompanionCell('Aarav, Meera & Dev').names).toEqual(['Aarav', 'Meera', 'Dev']);
  });
  it('keeps honorific couples together', () => {
    expect(interpretCompanionCell('Mr & Mrs Sharma')).toEqual({ names: ['Mr & Mrs Sharma'], bump: 1, allowance: false });
  });
  it('coerces non-string values instead of crashing', () => {
    expect(interpretCompanionCell(2 as unknown as string)).toEqual({ names: [], bump: 2, allowance: true });
    expect(interpretCompanionCell(undefined)).toEqual({ names: [], bump: 0, allowance: false });
  });
});

describe('looksLikeSerialColumn', () => {
  it('detects a 1..N row-number column', () => {
    expect(looksLikeSerialColumn(['1', '2', '3', '4', '5', '6'])).toBe(true);
  });
  it('detects a serial run even after a banner/duplicated-header row', () => {
    expect(looksLikeSerialColumn(['No.', '1', '2', '3', '4', '5', '6'])).toBe(true);
  });
  it('detects short serial runs (4-row sheets)', () => {
    expect(looksLikeSerialColumn(['1', '2', '3', '4'])).toBe(true);
  });
  it('does not flag genuine party sizes', () => {
    expect(looksLikeSerialColumn(['2', '1', '4', '2', '3', '2'])).toBe(false);
    expect(looksLikeSerialColumn(['2', '2', '3', '1'])).toBe(false);
  });
  it('handles numeric values without crashing', () => {
    expect(looksLikeSerialColumn([1, 2, 3, 4] as unknown as string[])).toBe(true);
  });
});

// ─── mergeColumnMappings (heuristic + LLM) ─────────────────────────

describe('mergeColumnMappings', () => {
  const headers = ['Name', 'Bringing Someone?', 'No.', 'Guest 2'];

  it('lets the LLM claim columns heuristics missed', () => {
    const heuristic = { Name: 'name', 'No.': 'party_size' };
    const llm = { 'Bringing Someone?': 'plus_one_flag', 'No.': 'ignore', 'Guest 2': 'additional_guest_name' };
    expect(mergeColumnMappings(heuristic, llm, headers)).toEqual({
      Name: 'name',
      'Bringing Someone?': 'plus_one_flag',
      'Guest 2': 'additional_guest_name',
    });
  });

  it('LLM ignore unmaps a heuristic false positive', () => {
    const heuristic = { Name: 'name', 'No.': 'party_size' };
    const llm = { 'No.': 'ignore' };
    expect(mergeColumnMappings(heuristic, llm, headers)).toEqual({ Name: 'name' });
  });

  it('keeps non-repeatable fields unique with LLM claims winning', () => {
    const heuristic = { Name: 'name', 'Guest 2': 'email' };
    const llm = { 'Bringing Someone?': 'email' };
    expect(mergeColumnMappings(heuristic, llm, headers)).toEqual({
      Name: 'name',
      'Bringing Someone?': 'email',
    });
  });
});

// ─── sanitizeColumnAnalysis (LLM output validation) ────────────────

describe('sanitizeColumnAnalysis', () => {
  const headers = ['Name', 'Plus One', 'Group'];

  it('accepts valid columns and aliases tags → group', () => {
    const raw = {
      columns: [
        { header: 'Name', field: 'name' },
        { header: 'Plus One', field: 'plus_one_flag' },
        { header: 'Group', field: 'tags' },
      ],
    };
    expect(sanitizeColumnAnalysis(raw, headers)).toEqual({
      Name: 'name',
      'Plus One': 'plus_one_flag',
      Group: 'group',
    });
  });

  it('drops unknown headers, unknown fields, and malformed entries', () => {
    const raw = {
      columns: [
        { header: 'Nope', field: 'name' },
        { header: 'Name', field: 'made_up_field' },
        { header: 'Plus One' },
        'garbage',
        { header: 'Group', field: 'group' },
      ],
    };
    expect(sanitizeColumnAnalysis(raw, headers)).toEqual({ Group: 'group' });
  });

  it('returns empty for non-object input', () => {
    expect(sanitizeColumnAnalysis(null, headers)).toEqual({});
    expect(sanitizeColumnAnalysis('x', headers)).toEqual({});
    expect(sanitizeColumnAnalysis({ columns: 'x' }, headers)).toEqual({});
  });
});

// ─── applyColumnMapping (build payload) ────────────────────────────

describe('applyColumnMapping', () => {
  it('applies the mapping and trims values', () => {
    const rows = [
      { Name: '  Priya Sharma  ', Email: 'priya@email.com', Phone: '+919876543210' },
      { Name: 'Arjun Mehta', Email: '', Phone: '+14155551234' },
    ];
    const map = { Name: 'name', Email: 'email', Phone: 'phone' };
    const result = applyColumnMapping(rows, map);
    expect(result).toEqual([
      { name: 'Priya Sharma', email: 'priya@email.com', phone: '+919876543210' },
      { name: 'Arjun Mehta', phone: '+14155551234' },
    ]);
  });

  it('combines first + last when no full name is mapped', () => {
    const rows = [{ First: 'Priya', Last: 'Sharma', Email: 'p@x.com' }];
    const map = { First: 'first_name', Last: 'last_name', Email: 'email' };
    const result = applyColumnMapping(rows, map);
    expect(result[0]).toEqual({ name: 'Priya Sharma', email: 'p@x.com' });
  });

  it('uses full name over first/last when both are mapped', () => {
    const rows = [{ Full: 'Priya Sharma', First: 'Ignored', Last: 'Ignored' }];
    const map = { Full: 'name', First: 'first_name', Last: 'last_name' };
    const result = applyColumnMapping(rows, map);
    expect(result[0]).toEqual({ name: 'Priya Sharma' });
  });

  it('drops rows with no name', () => {
    const rows = [
      { Name: 'Priya Sharma' },
      { Name: '' },
      { Name: 'Arjun Mehta' },
    ];
    const result = applyColumnMapping(rows, { Name: 'name' });
    expect(result).toHaveLength(2);
  });

  it('returns empty when mapping has no name column', () => {
    const rows = [{ Email: 'p@x.com' }];
    const result = applyColumnMapping(rows, { Email: 'email' });
    expect(result).toEqual([]);
  });

  // ── Plus-ones & companions ────────────────────────────────────────

  it('keeps a plus-one NAME column as plus_one_name and bumps party size', () => {
    const rows = [
      { Name: 'Arjun Mehta', 'Plus One': 'Aisha Mehta' },
      { Name: 'Priya Sharma', 'Plus One': '' },
    ];
    const result = applyColumnMapping(rows, { Name: 'name', 'Plus One': 'plus_one_name' });
    expect(result[0]).toEqual({ name: 'Arjun Mehta', plus_one_name: 'Aisha Mehta', party_size: 2 });
    expect(result[1]).toEqual({ name: 'Priya Sharma' });
  });

  it('treats a yes/no plus-one column as an allowance: party size + tag, no fake name', () => {
    const rows = [
      { Name: 'Arjun Mehta', 'Plus One': 'Yes', Group: 'family' },
      { Name: 'Priya Sharma', 'Plus One': 'No', Group: 'family' },
    ];
    const result = applyColumnMapping(rows, { Name: 'name', 'Plus One': 'plus_one_name', Group: 'group' });
    expect(result[0].plus_one_name).toBeUndefined();
    expect(result[0].party_size).toBe(2);
    expect(result[0].tags).toEqual(['family', 'plus-one-allowed']);
    expect(result[1].party_size).toBeUndefined();
    expect(result[1].tags).toBeUndefined();
    expect(result[1].group).toBe('family');
  });

  it('treats an all-integer plus-one column as a count', () => {
    const rows = [
      { Name: 'Arjun Mehta', 'Plus Ones': '2' },
      { Name: 'Priya Sharma', 'Plus Ones': '0' },
    ];
    const result = applyColumnMapping(rows, { Name: 'name', 'Plus Ones': 'plus_one_name' });
    expect(result[0].party_size).toBe(3);
    expect(result[0].tags).toContain('plus-one-allowed');
    expect(result[1].party_size).toBeUndefined();
  });

  it('supports a dedicated plus_one_flag column', () => {
    const rows = [{ Name: 'Arjun', 'Bringing someone?': 'Y' }];
    const result = applyColumnMapping(rows, { Name: 'name', 'Bringing someone?': 'plus_one_flag' });
    expect(result[0].party_size).toBe(2);
    expect(result[0].tags).toEqual(['plus-one-allowed']);
  });

  it('collects multiple additional-guest columns into additional_guests', () => {
    const rows = [
      { Name: 'Arjun Mehta', 'Guest 2': 'Aisha Mehta', 'Guest 3': 'Rohan Mehta' },
      { Name: 'Priya Sharma', 'Guest 2': 'Dev Sharma', 'Guest 3': '' },
    ];
    const map = { Name: 'name', 'Guest 2': 'additional_guest_name', 'Guest 3': 'additional_guest_name' };
    const result = applyColumnMapping(rows, map);
    expect(result[0].additional_guests).toEqual([
      { name: 'Aisha Mehta', phone: '' },
      { name: 'Rohan Mehta', phone: '' },
    ]);
    expect(result[0].party_size).toBe(3);
    expect(result[1].additional_guests).toEqual([{ name: 'Dev Sharma', phone: '' }]);
    expect(result[1].party_size).toBe(2);
  });

  it('splits several names inside one additional-guest cell', () => {
    const rows = [{ Name: 'Arjun Mehta', 'Additional Guests': 'Aarav, Meera & Dev' }];
    const result = applyColumnMapping(rows, { Name: 'name', 'Additional Guests': 'additional_guest_name' });
    expect(result[0].additional_guests?.map((g) => g.name)).toEqual(['Aarav', 'Meera', 'Dev']);
    expect(result[0].party_size).toBe(4);
  });

  it('pairs additional-guest phone columns by position', () => {
    const rows = [{ Name: 'Arjun', 'Guest 2': 'Aisha', 'Guest 2 Phone': '+14155550101' }];
    const map = {
      Name: 'name',
      'Guest 2': 'additional_guest_name',
      'Guest 2 Phone': 'additional_guest_phone',
    };
    const result = applyColumnMapping(rows, map);
    expect(result[0].additional_guests).toEqual([{ name: 'Aisha', phone: '+14155550101' }]);
  });

  it('treats a numeric companion column ("Kids") as an unnamed headcount bump', () => {
    const rows = [
      { Name: 'Arjun', Kids: '2' },
      { Name: 'Priya', Kids: '0' },
    ];
    const result = applyColumnMapping(rows, { Name: 'name', Kids: 'additional_guest_name' });
    expect(result[0].additional_guests).toBeUndefined();
    expect(result[0].party_size).toBe(3);
    expect(result[1].party_size).toBeUndefined();
  });

  // ── Party size ────────────────────────────────────────────────────

  it('never reports a party size below what companion columns prove', () => {
    const rows = [{ Name: 'Arjun', 'Plus One': 'Aisha', 'Party Size': '1' }];
    const map = { Name: 'name', 'Plus One': 'plus_one_name', 'Party Size': 'party_size' };
    const result = applyColumnMapping(rows, map);
    expect(result[0].party_size).toBe(2);
  });

  it('respects a larger explicit party size', () => {
    const rows = [{ Name: 'Arjun', 'Party Size': '5' }];
    const result = applyColumnMapping(rows, { Name: 'name', 'Party Size': 'party_size' });
    expect(result[0].party_size).toBe(5);
  });

  it('ignores a serial row-number column mapped to party_size', () => {
    const rows = ['A', 'B', 'C', 'D', 'E', 'F'].map((n, i) => ({ Name: n, 'No.': String(i + 1) }));
    const result = applyColumnMapping(rows, { Name: 'name', 'No.': 'party_size' });
    expect(result.every((g) => g.party_size === undefined)).toBe(true);
  });

  it('still detects the serial column when a duplicated header row offsets it', () => {
    const rows = [
      { Name: 'Name', 'No.': 'No.' }, // duplicated header row
      ...['A', 'B', 'C', 'D', 'E', 'F'].map((n, i) => ({ Name: n, 'No.': String(i + 1) })),
    ];
    const result = applyColumnMapping(rows, { Name: 'name', 'No.': 'party_size' });
    expect(result).toHaveLength(6); // header row filtered by blocklist
    expect(result.every((g) => g.party_size === undefined)).toBe(true);
  });

  // ── Regressions from the adversarial review ───────────────────────

  it('handles a MIXED plus-one column per cell (names + Yes/No together)', () => {
    const rows = [
      { Name: 'Arjun', 'Plus One': 'Aisha Mehta' },
      { Name: 'Priya', 'Plus One': 'No' },
      { Name: 'Dev', 'Plus One': 'Yes' },
    ];
    const result = applyColumnMapping(rows, { Name: 'name', 'Plus One': 'plus_one_name' });
    expect(result[0]).toEqual({ name: 'Arjun', plus_one_name: 'Aisha Mehta', party_size: 2 });
    expect(result[1]).toEqual({ name: 'Priya' }); // no fake "No" companion
    expect(result[2].plus_one_name).toBeUndefined(); // no fake "Yes" companion
    expect(result[2].party_size).toBe(2);
    expect(result[2].tags).toEqual(['plus-one-allowed']);
  });

  it('overflows a two-name plus-one cell into additional_guests', () => {
    const rows = [{ Name: 'X', 'Plus One': 'Aarav & Meera' }];
    const result = applyColumnMapping(rows, { Name: 'name', 'Plus One': 'plus_one_name' });
    expect(result[0].plus_one_name).toBe('Aarav');
    expect(result[0].additional_guests).toEqual([{ name: 'Meera', phone: '' }]);
    expect(result[0].party_size).toBe(3);
  });

  it('keeps "Mr & Mrs Sharma" as a single companion', () => {
    const rows = [{ Name: 'X', 'Guest 2': 'Mr & Mrs Sharma' }];
    const result = applyColumnMapping(rows, { Name: 'name', 'Guest 2': 'additional_guest_name' });
    expect(result[0].additional_guests).toEqual([{ name: 'Mr & Mrs Sharma', phone: '' }]);
    expect(result[0].party_size).toBe(2);
  });

  it('pairs companion phones by header affinity, not blind position', () => {
    // Phone only exists for Guest 3 — it must NOT attach to Guest 2.
    const rows = [{ Name: 'X', 'Guest 2': 'Meera', 'Guest 3': 'Rohan', 'Guest 3 Phone': '+15551234' }];
    const map = {
      Name: 'name',
      'Guest 2': 'additional_guest_name',
      'Guest 3': 'additional_guest_name',
      'Guest 3 Phone': 'additional_guest_phone',
    };
    const result = applyColumnMapping(rows, map);
    expect(result[0].additional_guests).toEqual([
      { name: 'Meera', phone: '' },
      { name: 'Rohan', phone: '+15551234' },
    ]);
  });

  it('does not crash on numeric cells (raw XLSX values)', () => {
    const rows = [
      { Name: 'Priya', 'No.': 1, 'Party Size': 2, Phone: 919876543210 },
      { Name: 'Arjun', 'No.': 2, 'Party Size': 3, Phone: 14155551234 },
      { Name: 'Dev', 'No.': 3, 'Party Size': 2, Phone: 0 },
    ] as unknown as Record<string, string>[];
    const map = { Name: 'name', 'No.': 'party_size', Phone: 'phone' };
    const result = applyColumnMapping(rows, map);
    expect(result).toHaveLength(3);
    expect(result[0].phone).toBe('919876543210');
  });
});

// ─── autoMapColumns regressions from the adversarial review ────────

describe('autoMapColumns regressions', () => {
  it('companion phone columns do not steal the primary phone field', () => {
    const map = autoMapColumns(['Name', 'Guest 2', 'Guest 2 Phone', 'Phone']);
    expect(map).toEqual({
      Name: 'name',
      'Guest 2': 'additional_guest_name',
      'Guest 2 Phone': 'additional_guest_phone',
      Phone: 'phone',
    });
  });

  it('plus-one phone variants map to plus_one_phone even before the primary phone', () => {
    const map = autoMapColumns(['Name', 'Plus One Mobile', 'Mobile']);
    expect(map).toEqual({
      Name: 'name',
      'Plus One Mobile': 'plus_one_phone',
      Mobile: 'phone',
    });
  });

  it('headcount variants containing "guest" map to party_size, not name', () => {
    expect(autoMapColumns(['Name', 'No of Guests'])).toEqual({ Name: 'name', 'No of Guests': 'party_size' });
    expect(autoMapColumns(['Name', 'Guest Count'])).toEqual({ Name: 'name', 'Guest Count': 'party_size' });
    expect(autoMapColumns(['Name', 'Total Guests'])).toEqual({ Name: 'name', 'Total Guests': 'party_size' });
  });

  it('a sheet whose only name-ish column is Spouse still imports (fallback re-purposes it)', () => {
    const map = autoMapColumns(['Spouse', 'Phone']);
    expect(map).toEqual({ Spouse: 'name', Phone: 'phone' });
    const result = applyColumnMapping([{ Spouse: 'Priya Sharma', Phone: '+15551234' }], map);
    expect(result).toEqual([{ name: 'Priya Sharma', phone: '+15551234' }]);
  });
});

// ─── XLSX end-to-end with numeric cells (raw Excel behavior) ───────

describe('XLSX numeric cells end-to-end', () => {
  it('parses, maps, and applies a sheet with numeric No./Party Size/Phone columns', () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Name', 'No.', 'Phone', 'Plus One'],
      ['Priya Sharma', 1, 919876543210, 'Yes'],
      ['Arjun Mehta', 2, 14155551234, 'No'],
      ['Dev Patel', 3, 14155559999, 1],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;

    const { headers, rows } = parseXlsx(buffer);
    expect(rows[0]['No.']).toBe('1'); // coerced to string at the boundary
    const map = autoMapColumns(headers);
    const guests = applyColumnMapping(rows, map);
    expect(guests).toHaveLength(3);
    expect(guests[0].phone).toBe('919876543210');
    expect(guests[0].party_size).toBe(2); // "Yes" plus-one
    expect(guests[0].tags).toContain('plus-one-allowed');
    expect(guests[1].party_size).toBeUndefined(); // "No"
    expect(guests[2].party_size).toBe(2); // numeric 1
    expect(guests.every((g) => g.party_size === undefined || g.party_size <= 2)).toBe(true); // serial No. ignored
  });
});

// ─── End-to-end: each upload type → ready-to-import payload ────────

describe('end-to-end upload flow per file type', () => {
  it('CSV upload: parse → auto-map → build payload', () => {
    const csv = `Name,Email,Mobile,Side,Tag\nPriya Sharma,priya@email.com,+919876543210,bride,Priya's Friends`;
    const { headers, rows } = parseCsv(csv);
    const map = autoMapColumns(headers);
    const guests = applyColumnMapping(rows, map);
    expect(guests).toEqual([
      {
        name: 'Priya Sharma',
        email: 'priya@email.com',
        phone: '+919876543210',
        wedding_side: 'bride',
        group: "Priya's Friends",
      },
    ]);
  });

  it('XLSX upload: parse → auto-map → build payload', () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Full Name', 'Email Address', 'Phone Number', 'Family'],
      ['Priya Sharma', 'priya@email.com', '+919876543210', "Priya's Friends"],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;

    const { headers, rows } = parseXlsx(buffer);
    const map = autoMapColumns(headers);
    const guests = applyColumnMapping(rows, map);
    expect(guests[0]).toEqual({
      name: 'Priya Sharma',
      email: 'priya@email.com',
      phone: '+919876543210',
      group: "Priya's Friends",
    });
  });

  it('vCard upload: parse → auto-map → build payload', () => {
    const vcf = `BEGIN:VCARD
VERSION:3.0
FN:Priya Sharma
TEL:+919876543210
EMAIL:priya@email.com
END:VCARD
BEGIN:VCARD
VERSION:3.0
FN:Arjun Mehta
TEL:+1 (415) 555-1234
EMAIL:arjun@email.com
END:VCARD`;
    const rows = parseVCard(vcf);
    const headers = ['Name', 'Email', 'Phone'];
    const map = autoMapColumns(headers);
    const guests = applyColumnMapping(rows, map);
    expect(guests).toEqual([
      { name: 'Priya Sharma', email: 'priya@email.com', phone: '+919876543210' },
      { name: 'Arjun Mehta', email: 'arjun@email.com', phone: '+14155551234' },
    ]);
  });
});
