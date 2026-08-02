import { describe, it, expect } from 'vitest';
import { parseCSV, parseGuestText, deduplicateGuests, ParsedGuest } from '@/lib/utils/guest-parser';

describe('parseCSV', () => {
  it('should parse CSV with standard columns', () => {
    const csv = 'Name,Phone,Email,Side\nRaj Sharma,9876543210,raj@email.com,groom\nPriya Singh,9876543211,priya@email.com,bride';
    const guests = parseCSV(csv, { name: 'name', phone: 'phone', email: 'email', wedding_side: 'side' });
    expect(guests).toHaveLength(2);
    expect(guests[0].name).toBe('Raj Sharma');
    expect(guests[0].phone).toBe('9876543210');
    expect(guests[0].email).toBe('raj@email.com');
  });

  it('should handle missing columns', () => {
    const csv = 'Name,Phone\nRaj,9876543210';
    const guests = parseCSV(csv, { name: 'name', phone: 'phone', email: 'email' });
    expect(guests).toHaveLength(1);
    expect(guests[0].email).toBeUndefined();
  });

  it('should skip rows without name', () => {
    const csv = 'Name,Phone\n,9876543210\nRaj,9876543211';
    const guests = parseCSV(csv, { name: 'name', phone: 'phone' });
    expect(guests).toHaveLength(1);
  });

  it('should return empty for header-only CSV', () => {
    const csv = 'Name,Phone';
    expect(parseCSV(csv, { name: 'name' })).toHaveLength(0);
  });
});

describe('parseGuestText', () => {
  it('should parse "Name - Phone" format', () => {
    const guests = parseGuestText('Raj Sharma - 9876543210');
    expect(guests).toHaveLength(1);
    expect(guests[0].name).toBe('Raj Sharma');
    expect(guests[0].phone).toBe('9876543210');
  });

  it('should parse "Name email phone" format', () => {
    const guests = parseGuestText('Priya Singh priya@email.com +1-416-555-1234');
    expect(guests).toHaveLength(1);
    expect(guests[0].name).toContain('Priya');
    expect(guests[0].email).toBe('priya@email.com');
    expect(guests[0].phone).toBeDefined();
  });

  it('should parse "Name, phone, side" format', () => {
    const guests = parseGuestText('Mr Gupta, 9871234567, bride side');
    expect(guests).toHaveLength(1);
    expect(guests[0].wedding_side).toBe('bride');
  });

  it('should parse multiple lines', () => {
    const text = 'Raj Sharma - 9876543210\nPriya Singh - 9876543211\nMeena Gupta - 9876543212';
    const guests = parseGuestText(text);
    expect(guests).toHaveLength(3);
  });

  it('should handle empty lines', () => {
    const text = 'Raj - 9876543210\n\n\nPriya - 9876543211';
    const guests = parseGuestText(text);
    expect(guests).toHaveLength(2);
  });

  it('should extract email from mixed text', () => {
    const guests = parseGuestText('John Smith john@gmail.com');
    expect(guests[0].email).toBe('john@gmail.com');
  });
});

describe('deduplicateGuests', () => {
  it('should detect duplicate by phone', () => {
    const newGuests: ParsedGuest[] = [
      { name: 'Raj', phone: '9876543210' },
      { name: 'Priya', phone: '9876543211' },
    ];
    const existing = [{ phone: '9876543210', email: null }];

    const { unique, duplicates } = deduplicateGuests(newGuests, existing);
    expect(unique).toHaveLength(1);
    expect(duplicates).toHaveLength(1);
    expect(duplicates[0].name).toBe('Raj');
  });

  it('should detect duplicate by email', () => {
    const newGuests: ParsedGuest[] = [
      { name: 'Raj', email: 'raj@email.com' },
    ];
    const existing = [{ phone: null, email: 'raj@email.com' }];

    const { unique, duplicates } = deduplicateGuests(newGuests, existing);
    expect(unique).toHaveLength(0);
    expect(duplicates).toHaveLength(1);
  });

  it('should keep unique guests', () => {
    const newGuests: ParsedGuest[] = [
      { name: 'New Guest', phone: '1111111111' },
    ];
    const existing = [{ phone: '2222222222', email: null }];

    const { unique } = deduplicateGuests(newGuests, existing);
    expect(unique).toHaveLength(1);
  });

  it('should deduplicate within new list', () => {
    const newGuests: ParsedGuest[] = [
      { name: 'Raj A', phone: '9876543210' },
      { name: 'Raj B', phone: '9876543210' },
    ];

    const { unique, duplicates } = deduplicateGuests(newGuests, []);
    expect(unique).toHaveLength(1);
    expect(duplicates).toHaveLength(1);
  });
});
