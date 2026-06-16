import { describe, it, expect, vi } from 'vitest';

// Tool modules pull in WeddingService → lib/supabase/client; stub the browser client.
vi.mock('@/lib/supabase/client', () => ({
  supabase: { from: vi.fn() },
  publicSupabase: { from: vi.fn() },
}));

import { getAllTools } from '@/lib/agent/tools';

describe('agent tool catalog', () => {
  const tools = getAllTools();

  it('registers the Phase 1 tool surface', () => {
    expect(tools.length).toBeGreaterThanOrEqual(15);
    const names = tools.map((t) => t.name);
    for (const expected of [
      'get_wedding_overview',
      'update_wedding_details',
      'list_guests',
      'get_guest',
      'get_rsvp_summary',
      'add_guest',
      'update_guest',
      'record_rsvp',
      'list_rooms',
      'assign_guests_to_room',
      'get_schedule',
      'create_schedule_day',
      'create_event',
      'create_schedule_item',
      'get_site_content',
      'add_faq',
      'get_tasks',
      'create_task',
      'get_travel_info',
      'get_transportation',
      'get_vendors',
      'search_knowledge',
      'ask_user',
    ]) {
      expect(names).toContain(expected);
    }
  });

  it('has unique names and valid risk tiers', () => {
    const names = tools.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
    for (const tool of tools) {
      expect(['read', 'write', 'gated']).toContain(tool.risk);
    }
  });

  it('every tool has a prescriptive description and an object schema', () => {
    for (const tool of tools) {
      expect(tool.description.length, tool.name).toBeGreaterThan(40);
      expect(tool.description, tool.name).toMatch(/call|use/i);
      expect((tool.inputSchema as { type?: string }).type, tool.name).toBe('object');
      expect(tool.label.length, tool.name).toBeGreaterThan(0);
    }
  });

  it('is idempotent across repeated registration', () => {
    expect(getAllTools().length).toBe(tools.length);
  });

  it('room reassignment is gated, basic edits are not', () => {
    const byName = new Map(tools.map((t) => [t.name, t]));
    expect(byName.get('assign_guests_to_room')?.risk).toBe('gated');
    expect(byName.get('update_wedding_details')?.risk).toBe('write');
    expect(byName.get('list_guests')?.risk).toBe('read');
  });
});
