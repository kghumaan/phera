import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/client', () => {
  const mockFrom = vi.fn();
  return {
    supabase: { from: mockFrom },
  };
});

vi.mock('@/lib/supabase/outreach-service', () => ({
  outreachService: {
    logEvent: vi.fn().mockResolvedValue({ id: 'e1' }),
    updateGuestStatus: vi.fn().mockResolvedValue(undefined),
  },
}));

import { GuestCoordinator, GuestContext } from '@/lib/ai/guest-coordinator';
import { supabase } from '@/lib/supabase/client';

const mockFrom = (supabase as any).from as ReturnType<typeof vi.fn>;

function makeGuestContext(overrides?: Partial<GuestContext>): GuestContext {
  return {
    id: 'g1',
    name: 'Raj Sharma',
    phone: '+919876543210',
    email: 'raj@example.com',
    wedding_id: 'priya-rahul-2026',
    outreach_status: 'rsvp_requested',
    outreach_last_contacted_at: null,
    outreach_attempt_count: 0,
    whatsapp_opted_out: false,
    contact_type: 'guest',
    is_family_liaison: false,
    liaison_for: null,
    logistics_data: null,
    consent_given_at: null,
    ...overrides,
  };
}

function mockGuestQuery(guest: GuestContext | null) {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: guest, error: guest ? null : { message: 'not found' } }),
  };
  mockFrom.mockReturnValue(chain);
}

describe('GuestCoordinator', () => {
  let coordinator: GuestCoordinator;

  beforeEach(() => {
    vi.clearAllMocks();
    coordinator = new GuestCoordinator('priya-rahul-2026', 'g1');
  });

  describe('handleIncomingMessage', () => {
    it('should handle unknown guest', async () => {
      mockGuestQuery(null);
      const result = await coordinator.handleIncomingMessage('Hello!', '+919876543210');
      expect(result.message).toContain('couldn\'t find your details');
    });

    it('should handle opt-out message', async () => {
      mockGuestQuery(makeGuestContext());
      const result = await coordinator.handleIncomingMessage('STOP', '+919876543210');
      expect(result.message).toContain('opted out');
      expect(result.actions).toContainEqual(
        expect.objectContaining({ type: 'mark_opted_out' })
      );
    });

    it('should record consent on first reply', async () => {
      mockGuestQuery(makeGuestContext({ consent_given_at: null }));
      const result = await coordinator.handleIncomingMessage('Yes, attending!', '+919876543210');
      expect(result.actions).toContainEqual(
        expect.objectContaining({ type: 'record_consent' })
      );
    });

    it('should NOT record consent if already given', async () => {
      mockGuestQuery(makeGuestContext({ consent_given_at: '2026-03-01T00:00:00Z' }));
      const result = await coordinator.handleIncomingMessage('Yes!', '+919876543210');
      const consentActions = result.actions.filter((a) => a.type === 'record_consent');
      expect(consentActions).toHaveLength(0);
    });
  });

  describe('RSVP collection flow', () => {
    it('should confirm RSVP when guest says yes', async () => {
      mockGuestQuery(makeGuestContext({ outreach_status: 'rsvp_requested' }));
      const result = await coordinator.handleIncomingMessage('Yes, I\'ll be there!', '+919876543210');
      expect(result.actions).toContainEqual(
        expect.objectContaining({ type: 'update_status', data: { status: 'rsvp_confirmed' } })
      );
      expect(result.message).toContain('confirmed');
    });

    it('should handle negative RSVP', async () => {
      mockGuestQuery(makeGuestContext({ outreach_status: 'rsvp_requested' }));
      const result = await coordinator.handleIncomingMessage('Sorry, can\'t make it', '+919876543210');
      expect(result.actions).toContainEqual(
        expect.objectContaining({ type: 'update_rsvp', data: { attending: false } })
      );
    });

    it('should handle guest count in RSVP', async () => {
      mockGuestQuery(makeGuestContext({ outreach_status: 'rsvp_requested' }));
      const result = await coordinator.handleIncomingMessage('Yes! 3 people coming', '+919876543210');
      expect(result.extractedData?.guest_count).toBe(3);
      expect(result.extractedData?.rsvp_attending).toBe(true);
    });
  });

  describe('travel info collection', () => {
    it('should collect flight info from confirmed guest', async () => {
      mockGuestQuery(makeGuestContext({ outreach_status: 'rsvp_confirmed' }));
      const result = await coordinator.handleIncomingMessage(
        'Flying in on AI302 arriving 12th December',
        '+919876543210'
      );
      expect(result.extractedData?.flight_number).toBe('AI302');
      expect(result.actions).toContainEqual(
        expect.objectContaining({ type: 'update_travel' })
      );
      expect(result.actions).toContainEqual(
        expect.objectContaining({ type: 'update_status', data: { status: 'travel_collected' } })
      );
    });

    it('should prompt for travel details when none provided', async () => {
      mockGuestQuery(makeGuestContext({ outreach_status: 'rsvp_confirmed' }));
      const result = await coordinator.handleIncomingMessage('Hi!', '+919876543210');
      expect(result.message).toContain('travel details');
    });
  });

  describe('structured data extraction', () => {
    it('should extract dietary preferences', () => {
      const guest = makeGuestContext({ outreach_status: 'travel_collected' });
      const data = coordinator.extractStructuredData('I am vegetarian and gluten-free', guest);
      expect(data.dietary_preferences).toContain('vegetarian');
      expect(data.dietary_preferences).toContain('gluten-free');
    });

    it('should extract hotel name', () => {
      const guest = makeGuestContext();
      const data = coordinator.extractStructuredData('We are staying at Taj Lake Palace', guest);
      expect(data.hotel_name).toBe('Taj Lake Palace');
    });

    it('should extract flight number', () => {
      const guest = makeGuestContext();
      const data = coordinator.extractStructuredData('My flight is EK504', guest);
      expect(data.flight_number).toBe('EK504');
    });

    it('should extract guest count', () => {
      const guest = makeGuestContext();
      const data = coordinator.extractStructuredData('We are 4 people', guest);
      expect(data.guest_count).toBe(4);
    });
  });

  describe('family liaison support', () => {
    it('should extract names for liaison', () => {
      const guest = makeGuestContext({
        is_family_liaison: true,
        liaison_for: ['g2', 'g3'],
      });
      const data = coordinator.extractStructuredData(
        'Auntie Meena and Uncle Raj are both coming',
        guest
      );
      expect(data.names).toContain('Meena');
      expect(data.names).toContain('Raj');
    });

    it('should NOT extract names for non-liaison', () => {
      const guest = makeGuestContext({ is_family_liaison: false });
      const data = coordinator.extractStructuredData(
        'Auntie Meena and Uncle Raj are both coming',
        guest
      );
      expect(data.names).toBeUndefined();
    });
  });

  describe('system prompt generation', () => {
    it('should include guest name and status', () => {
      const guest = makeGuestContext();
      const prompt = coordinator.getSystemPrompt(guest);
      expect(prompt).toContain('Raj Sharma');
      expect(prompt).toContain('rsvp_requested');
    });

    it('should include missing info', () => {
      const guest = makeGuestContext({ outreach_status: 'rsvp_confirmed' });
      const prompt = coordinator.getSystemPrompt(guest);
      expect(prompt).toContain('travel details');
    });

    it('should note family liaison role', () => {
      const guest = makeGuestContext({
        is_family_liaison: true,
        liaison_for: ['g2', 'g3'],
      });
      const prompt = coordinator.getSystemPrompt(guest);
      expect(prompt).toContain('family liaison');
      expect(prompt).toContain('2 other guests');
    });
  });

  describe('unresponsive guest handling', () => {
    it('should reactivate unresponsive guest who replies', async () => {
      mockGuestQuery(makeGuestContext({ outreach_status: 'unresponsive' }));
      const result = await coordinator.handleIncomingMessage('Sorry for the late reply! Yes, attending', '+919876543210');
      expect(result.actions).toContainEqual(
        expect.objectContaining({ type: 'update_status', data: { status: 'rsvp_confirmed' } })
      );
    });
  });
});
