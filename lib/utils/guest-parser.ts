/**
 * Guest data parser — extracts structured guest info from various formats.
 */

export interface ParsedGuest {
  name: string;
  phone?: string;
  email?: string;
  wedding_side?: 'bride' | 'groom' | 'both';
}

/**
 * Parse CSV text into guest objects.
 */
export function parseCSV(
  csvText: string,
  columnMap: Record<string, string>
): ParsedGuest[] {
  const lines = csvText.split('\n').filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const guests: ParsedGuest[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim());
    const guest: ParsedGuest = { name: '' };

    for (const [field, headerName] of Object.entries(columnMap)) {
      const idx = headers.indexOf(headerName.toLowerCase());
      if (idx >= 0 && values[idx]) {
        (guest as any)[field] = values[idx];
      }
    }

    if (guest.name) {
      guests.push(guest);
    }
  }

  return guests;
}

/**
 * Parse free-text guest list using pattern matching.
 * Handles formats like:
 * - "Raj Sharma - 9876543210"
 * - "Priya Singh priya@email.com +1-416-555-1234"
 * - "Mr and Mrs Gupta, 9871234567, bride side"
 */
export function parseGuestText(text: string): ParsedGuest[] {
  const lines = text.split('\n').filter((l) => l.trim());
  const guests: ParsedGuest[] = [];

  for (const line of lines) {
    const guest = parseSingleLine(line.trim());
    if (guest && guest.name) {
      guests.push(guest);
    }
  }

  return guests;
}

function parseSingleLine(line: string): ParsedGuest | null {
  if (!line) return null;

  const guest: ParsedGuest = { name: '' };

  // Extract email
  const emailMatch = line.match(/[\w.+-]+@[\w.-]+\.\w{2,}/);
  if (emailMatch) {
    guest.email = emailMatch[0];
    line = line.replace(emailMatch[0], '').trim();
  }

  // Extract phone (various formats)
  const phoneMatch = line.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+?\d{10,13}/);
  if (phoneMatch) {
    guest.phone = phoneMatch[0].replace(/[^\d+]/g, '');
    line = line.replace(phoneMatch[0], '').trim();
  }

  // Extract wedding side
  const sideMatch = line.match(/\b(bride|groom|both)\s*(?:side|'s)?\b/i);
  if (sideMatch) {
    guest.wedding_side = sideMatch[1].toLowerCase() as 'bride' | 'groom' | 'both';
    line = line.replace(sideMatch[0], '').trim();
  }

  // Clean up separators and extract name
  const name = line
    .replace(/[-,;|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (name) {
    guest.name = name;
  }

  return guest.name ? guest : null;
}

/**
 * Detect and remove duplicate guests by phone or email.
 */
export function deduplicateGuests(
  newGuests: ParsedGuest[],
  existingGuests: Array<{ phone?: string | null; email?: string | null }>
): { unique: ParsedGuest[]; duplicates: ParsedGuest[] } {
  const existingPhones = new Set(existingGuests.map((g) => g.phone).filter(Boolean));
  const existingEmails = new Set(existingGuests.map((g) => g.email?.toLowerCase()).filter(Boolean));

  const unique: ParsedGuest[] = [];
  const duplicates: ParsedGuest[] = [];

  for (const guest of newGuests) {
    const phoneClean = guest.phone?.replace(/[^\d]/g, '');
    const emailClean = guest.email?.toLowerCase();

    if (
      (phoneClean && existingPhones.has(phoneClean)) ||
      (emailClean && existingEmails.has(emailClean))
    ) {
      duplicates.push(guest);
    } else {
      unique.push(guest);
      if (phoneClean) existingPhones.add(phoneClean);
      if (emailClean) existingEmails.add(emailClean);
    }
  }

  return { unique, duplicates };
}
