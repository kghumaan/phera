import { describe, it, expect } from 'vitest';
import {
  generateWaLink,
  generateBulkWaLinks,
  generateBroadcastMessage,
} from '@/lib/whatsapp/deep-links';

describe('generateWaLink', () => {
  it('should generate valid wa.me URL', () => {
    const link = generateWaLink('+919876543210', 'Hello!');
    expect(link).toBe('https://wa.me/919876543210?text=Hello!');
  });

  it('should handle phone with spaces and dashes', () => {
    const link = generateWaLink('+91 98765-43210', 'Test');
    expect(link).toBe('https://wa.me/919876543210?text=Test');
  });

  it('should handle phone without country code prefix', () => {
    const link = generateWaLink('9876543210', 'Hi');
    expect(link).toBe('https://wa.me/9876543210?text=Hi');
  });

  it('should URL-encode message', () => {
    const link = generateWaLink('919876543210', 'Hi Raj! Save the date 🎉');
    expect(link).toContain('wa.me/919876543210?text=');
    expect(link).toContain(encodeURIComponent('Hi Raj! Save the date 🎉'));
  });

  it('should strip all non-numeric characters', () => {
    const link = generateWaLink('+1 (416) 555-1234', 'Test');
    expect(link).toBe('https://wa.me/14165551234?text=Test');
  });
});

describe('generateBulkWaLinks', () => {
  it('should generate links for all guests', () => {
    const guests = [
      { name: 'Raj', phone: '+919876543210' },
      { name: 'Priya', phone: '+919876543211' },
    ];

    const links = generateBulkWaLinks(guests, 'Hi {{name}}, save the date!');
    expect(links).toHaveLength(2);
    expect(links[0].name).toBe('Raj');
    expect(links[0].link).toContain('wa.me/919876543210');
    expect(links[0].link).toContain(encodeURIComponent('Hi Raj, save the date!'));
  });

  it('should replace {{name}} placeholder', () => {
    const guests = [{ name: 'Meena', phone: '919999999999' }];
    const links = generateBulkWaLinks(guests, 'Dear {{name}}, you are invited to {{name}}s event!');
    expect(decodeURIComponent(links[0].link)).toContain('Dear Meena, you are invited to Meenas event!');
  });

  it('should handle empty guests array', () => {
    const links = generateBulkWaLinks([], 'Hello!');
    expect(links).toHaveLength(0);
  });
});

describe('generateBroadcastMessage', () => {
  it('should include couple name and date', () => {
    const msg = generateBroadcastMessage('Priya & Rahul', 'December 15, 2026', 'https://phera.io/priya-rahul');
    expect(msg).toContain('Priya & Rahul');
    expect(msg).toContain('December 15, 2026');
  });

  it('should include website URL', () => {
    const msg = generateBroadcastMessage('Test', 'Jan 1', 'https://phera.io/test');
    expect(msg).toContain('https://phera.io/test');
  });

  it('should mention Phera coordination', () => {
    const msg = generateBroadcastMessage('Test', 'Jan 1', 'https://phera.io/test');
    expect(msg.toLowerCase()).toContain('phera');
  });
});
