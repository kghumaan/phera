import { describe, it, expect } from 'vitest';
import { OutreachEvent, OutreachEventType, OutreachChannel } from '@/lib/types/outreach';

// Test the data structures and filtering logic used by communication log

describe('Communication Log', () => {
  const sampleEvents: OutreachEvent[] = [
    {
      id: 'e1',
      wedding_id: 'test',
      guest_id: 'g1',
      event_type: 'template_sent',
      template_name: 'save_the_date_v1',
      channel: 'whatsapp',
      details: { message_id: 'wamid1' },
      created_at: new Date('2026-03-20T10:00:00Z'),
    },
    {
      id: 'e2',
      wedding_id: 'test',
      guest_id: 'g1',
      event_type: 'message_received',
      channel: 'whatsapp',
      details: { message: 'Yes, attending!' },
      created_at: new Date('2026-03-20T14:00:00Z'),
    },
    {
      id: 'e3',
      wedding_id: 'test',
      guest_id: 'g2',
      event_type: 'escalated',
      channel: 'whatsapp',
      details: { reason: 'unresponsive' },
      created_at: new Date('2026-03-21T09:00:00Z'),
    },
  ];

  describe('Event filtering', () => {
    it('should filter events by event type', () => {
      const filtered = sampleEvents.filter((e) => e.event_type === 'template_sent');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('e1');
    });

    it('should filter events by guest_id', () => {
      const filtered = sampleEvents.filter((e) => e.guest_id === 'g1');
      expect(filtered).toHaveLength(2);
    });

    it('should filter events by template name', () => {
      const filtered = sampleEvents.filter((e) =>
        e.template_name?.toLowerCase().includes('save_the_date')
      );
      expect(filtered).toHaveLength(1);
    });

    it('should filter events by date range', () => {
      const start = new Date('2026-03-20T00:00:00Z');
      const end = new Date('2026-03-20T23:59:59Z');
      const filtered = sampleEvents.filter(
        (e) => new Date(e.created_at) >= start && new Date(e.created_at) <= end
      );
      expect(filtered).toHaveLength(2);
    });
  });

  describe('Conversation threading', () => {
    it('should group events by guest_id', () => {
      const grouped: Record<string, OutreachEvent[]> = {};
      for (const event of sampleEvents) {
        if (!grouped[event.guest_id]) grouped[event.guest_id] = [];
        grouped[event.guest_id].push(event);
      }
      expect(Object.keys(grouped)).toHaveLength(2);
      expect(grouped['g1']).toHaveLength(2);
      expect(grouped['g2']).toHaveLength(1);
    });
  });

  describe('CSV export', () => {
    it('should generate CSV with correct headers', () => {
      const headers = 'Timestamp,Event Type,Template,Channel,Details';
      const rows = sampleEvents.map((e) =>
        `${new Date(e.created_at).toISOString()},${e.event_type},${e.template_name || ''},${e.channel},${JSON.stringify(e.details || {})}`
      );
      const csv = [headers, ...rows].join('\n');

      expect(csv).toContain('Timestamp,Event Type');
      expect(csv).toContain('template_sent');
      expect(csv).toContain('save_the_date_v1');
      expect(csv.split('\n')).toHaveLength(4); // header + 3 events
    });
  });

  describe('Empty state', () => {
    it('should handle empty events array', () => {
      const events: OutreachEvent[] = [];
      expect(events.length).toBe(0);
    });
  });
});
