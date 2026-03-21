import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/client', () => {
  const mockFrom = vi.fn();
  return { supabase: { from: mockFrom, rpc: vi.fn() } };
});

vi.mock('@/lib/supabase/outreach-service', () => ({
  outreachService: {
    updateGuestStatus: vi.fn().mockResolvedValue(undefined),
    logEvent: vi.fn().mockResolvedValue({ id: 'e1' }),
  },
}));

import { buildFlowDefinition, handleFlowResponse, FlowResponseData, WeddingEvent } from '@/lib/whatsapp/flows';
import { supabase } from '@/lib/supabase/client';
import { outreachService } from '@/lib/supabase/outreach-service';

const mockFrom = (supabase as any).from as ReturnType<typeof vi.fn>;

const sampleEvents: WeddingEvent[] = [
  { id: 'evt1', name: 'Mehendi', date: 'Dec 13, 2026', time: '2:00 PM', venue: 'Taj Lake Palace', dress_code: 'Festive casual' },
  { id: 'evt2', name: 'Sangeet', date: 'Dec 14, 2026', time: '7:00 PM', venue: 'Taj Lake Palace', dress_code: 'Party wear' },
  { id: 'evt3', name: 'Wedding Ceremony', date: 'Dec 15, 2026', time: '10:00 AM', venue: 'City Palace', dress_code: 'Traditional' },
];

describe('buildFlowDefinition', () => {
  it('should build a flow with 5 screens', () => {
    const flow = buildFlowDefinition({ couple_names: 'Priya & Rahul', events: sampleEvents });
    expect(flow.screens).toHaveLength(5);
    expect(flow.version).toBe('3.0');
  });

  it('should include all screen IDs', () => {
    const flow = buildFlowDefinition({ couple_names: 'Priya & Rahul', events: sampleEvents });
    const screenIds = flow.screens.map((s) => s.id);
    expect(screenIds).toEqual(['WELCOME', 'ATTENDANCE', 'GUEST_COUNT', 'DIETARY', 'CONFIRMATION']);
  });

  it('should include couple names in welcome', () => {
    const flow = buildFlowDefinition({ couple_names: 'Priya & Rahul', events: sampleEvents });
    const welcome = flow.screens[0];
    const heading = welcome.layout.children.find((c: any) => c.type === 'TextHeading');
    expect(heading.text).toContain('Priya & Rahul');
  });

  it('should dynamically populate event checkboxes', () => {
    const flow = buildFlowDefinition({ couple_names: 'Priya & Rahul', events: sampleEvents });
    const attendance = flow.screens[1];
    expect(attendance.data?.events).toHaveLength(3);
    expect(attendance.data?.events[0].title).toContain('Mehendi');
    expect(attendance.data?.events[0].description).toContain('Taj Lake Palace');
  });

  it('should work with single event wedding', () => {
    const flow = buildFlowDefinition({
      couple_names: 'Priya & Rahul',
      events: [{ id: 'evt1', name: 'Wedding', date: 'Dec 15', time: '10 AM', venue: 'Temple' }],
    });
    const attendance = flow.screens[1];
    expect(attendance.data?.events).toHaveLength(1);
  });

  it('should include dietary options', () => {
    const flow = buildFlowDefinition({ couple_names: 'Priya & Rahul', events: sampleEvents });
    const dietary = flow.screens[3];
    expect(dietary.data?.dietary_options).toBeDefined();
    const options = dietary.data?.dietary_options.map((o: any) => o.id);
    expect(options).toContain('vegetarian');
    expect(options).toContain('jain');
    expect(options).toContain('halal');
  });

  it('should have Submit button on confirmation screen', () => {
    const flow = buildFlowDefinition({ couple_names: 'Priya & Rahul', events: sampleEvents });
    const confirm = flow.screens[4];
    const footer = confirm.layout.children.find((c: any) => c.type === 'Footer');
    expect(footer.label).toBe('Submit');
    expect(footer['on-click-action'].name).toBe('complete');
  });

  it('should include dress code in event description when available', () => {
    const flow = buildFlowDefinition({ couple_names: 'Test', events: sampleEvents });
    const attendance = flow.screens[1];
    expect(attendance.data?.events[0].description).toContain('Festive casual');
  });

  it('should handle events without dress code', () => {
    const flow = buildFlowDefinition({
      couple_names: 'Test',
      events: [{ id: 'evt1', name: 'Wedding', date: 'Dec 15', time: '10 AM', venue: 'Temple' }],
    });
    const attendance = flow.screens[1];
    expect(attendance.data?.events[0].description).not.toContain('undefined');
  });
});

describe('handleFlowResponse', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create RSVP records for selected events', async () => {
    const chain: any = {
      upsert: vi.fn().mockResolvedValue({ error: null }),
    };
    mockFrom.mockReturnValue(chain);

    const flowData: FlowResponseData = {
      events_attending: ['evt1', 'evt2'],
      guest_count: 2,
      dietary_preferences: ['vegetarian'],
    };

    await handleFlowResponse(flowData, 'g1', 'test-wedding');

    expect(mockFrom).toHaveBeenCalledWith('rsvps');
    expect(chain.upsert).toHaveBeenCalledTimes(2);
  });

  it('should update outreach status to rsvp_confirmed', async () => {
    const chain: any = {
      upsert: vi.fn().mockResolvedValue({ error: null }),
    };
    mockFrom.mockReturnValue(chain);

    const flowData: FlowResponseData = {
      events_attending: ['evt1'],
      guest_count: 1,
      dietary_preferences: [],
    };

    await handleFlowResponse(flowData, 'g1', 'test-wedding');

    expect(outreachService.updateGuestStatus).toHaveBeenCalledWith(
      'g1',
      'rsvp_confirmed',
      expect.objectContaining({ source: 'whatsapp_flow' })
    );
  });

  it('should log the info_collected event', async () => {
    const chain: any = {
      upsert: vi.fn().mockResolvedValue({ error: null }),
    };
    mockFrom.mockReturnValue(chain);

    const flowData: FlowResponseData = {
      events_attending: ['evt1'],
      guest_count: 1,
      dietary_preferences: ['jain'],
      allergies: 'nuts',
    };

    await handleFlowResponse(flowData, 'g1', 'test-wedding');

    expect(outreachService.logEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event_type: 'info_collected',
        channel: 'whatsapp',
      })
    );
  });

  it('should handle multi-event selection', async () => {
    const chain: any = {
      upsert: vi.fn().mockResolvedValue({ error: null }),
    };
    mockFrom.mockReturnValue(chain);

    const flowData: FlowResponseData = {
      events_attending: ['evt1', 'evt2', 'evt3'],
      guest_count: 3,
      dietary_preferences: ['vegetarian', 'halal'],
    };

    await handleFlowResponse(flowData, 'g1', 'test-wedding');

    expect(chain.upsert).toHaveBeenCalledTimes(3);
  });
});
