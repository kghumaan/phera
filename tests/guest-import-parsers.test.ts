import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import {
  parseCsv,
  parseXlsx,
  parseVCard,
  autoMapColumns,
  applyColumnMapping,
  AUTO_MAP,
} from '@/lib/admin/guest-import-parsers';

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

  it('maps Tag aliases to group field', () => {
    const map = autoMapColumns(['Tag', 'Tags', 'Label', 'Category', 'Group', 'Family']);
    expect(map).toEqual({
      Tag: 'group',
      Tags: 'group',
      Label: 'group',
      Category: 'group',
      Group: 'group',
      Family: 'group',
    });
  });

  it('omits unrecognized headers', () => {
    const map = autoMapColumns(['Name', 'FavoriteIceCream']);
    expect(map).toEqual({ Name: 'name' });
  });

  it('exposes AUTO_MAP for direct lookups', () => {
    expect(AUTO_MAP['surname']).toBe('last_name');
    expect(AUTO_MAP['team']).toBe('group');
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
