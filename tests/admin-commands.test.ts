import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/client', () => {
  const mockFrom = vi.fn();
  return { supabase: { from: mockFrom, rpc: vi.fn() } };
});

vi.mock('@/lib/supabase/outreach-service', () => ({
  outreachService: {
    getOutreachSummary: vi.fn().mockResolvedValue({
      total_guests: 200,
      not_contacted: 50,
      rsvp_confirmed: 80,
      escalations_open: 3,
      unresponsive: 5,
    }),
    updateGuestStatus: vi.fn().mockResolvedValue(undefined),
  },
}));

import { AdminCommandParser } from '@/lib/whatsapp/admin-commands';
import { supabase } from '@/lib/supabase/client';
import { outreachService } from '@/lib/supabase/outreach-service';

const mockFrom = (supabase as any).from as ReturnType<typeof vi.fn>;

describe('AdminCommandParser', () => {
  let parser: AdminCommandParser;

  beforeEach(() => {
    vi.clearAllMocks();
    parser = new AdminCommandParser();
  });

  describe('parseCommand', () => {
    it('should parse status command', async () => {
      const result = await parser.parseCommand('What is the status?', 'admin');
      expect(result.intent).toBe('get_status');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should parse "how many" as status', async () => {
      const result = await parser.parseCommand('How many guests have RSVP\'d?', 'admin');
      expect(result.intent).toBe('get_status');
    });

    it('should parse remove from shuttle', async () => {
      const result = await parser.parseCommand('Remove Raj Sharma from shuttle', 'admin');
      expect(result.intent).toBe('remove_from_shuttle');
      expect(result.params.guest_name).toContain('Raj');
    });

    it('should parse add to shuttle', async () => {
      const result = await parser.parseCommand('Add Priya to shuttle 2', 'admin');
      expect(result.intent).toBe('add_to_shuttle');
      expect(result.params.guest_name).toContain('Priya');
    });

    it('should parse cancel guest', async () => {
      const result = await parser.parseCommand('Cancel Meena', 'admin');
      expect(result.intent).toBe('cancel_guest');
      expect(result.params.guest_name).toContain('Meena');
    });

    it('should parse broadcast', async () => {
      const result = await parser.parseCommand('Broadcast: venue has been changed to Hotel XYZ', 'admin');
      expect(result.intent).toBe('broadcast_update');
    });

    it('should parse schedule update', async () => {
      const result = await parser.parseCommand('Update the sangeet time to 8 PM', 'admin');
      expect(result.intent).toBe('update_schedule');
    });

    it('should return unknown for unclear commands', async () => {
      const result = await parser.parseCommand('Hello world', 'admin');
      expect(result.intent).toBe('unknown');
    });

    it('should reject non-admin commands', async () => {
      const result = await parser.parseCommand('Status', 'guest');
      expect(result.intent).toBe('unknown');
      expect(result.confirmationMessage).toContain('Only admins');
    });
  });

  describe('executeCommand', () => {
    it('should execute status command', async () => {
      const parsed = { intent: 'get_status' as const, params: {}, confirmationMessage: '', confidence: 1 };
      const result = await parser.executeCommand(parsed, 'test-wedding');
      expect(result).toContain('200');
      expect(result).toContain('80');
    });

    it('should execute cancel guest command', async () => {
      const chain: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [{ id: 'g1', name: 'Meena' }] }),
      };
      mockFrom.mockReturnValue(chain);

      const parsed = { intent: 'cancel_guest' as const, params: { guest_name: 'Meena' }, confirmationMessage: '', confidence: 1 };
      const result = await parser.executeCommand(parsed, 'test-wedding');
      expect(result).toContain('Meena');
      expect(result).toContain('cancelled');
      expect(outreachService.updateGuestStatus).toHaveBeenCalled();
    });

    it('should handle guest not found', async () => {
      const chain: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [] }),
      };
      mockFrom.mockReturnValue(chain);

      const parsed = { intent: 'cancel_guest' as const, params: { guest_name: 'Nobody' }, confirmationMessage: '', confidence: 1 };
      const result = await parser.executeCommand(parsed, 'test-wedding');
      expect(result).toContain('Could not find');
    });

    it('should return help text for unknown commands', async () => {
      const parsed = { intent: 'unknown' as const, params: {}, confirmationMessage: 'I didn\'t understand', confidence: 0.3 };
      const result = await parser.executeCommand(parsed, 'test-wedding');
      expect(result).toContain("didn't understand");
    });
  });

  describe('handleVoiceCommand', () => {
    it('should return placeholder for voice commands', async () => {
      const result = await parser.handleVoiceCommand(Buffer.from('audio'), 'test-wedding');
      expect(result).toContain('Voice commands');
    });
  });
});
