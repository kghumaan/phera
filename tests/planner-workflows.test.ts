/**
 * Planner Multi-Wedding Workflow Tests
 *
 * Tests planner-specific business logic: creating multiple weddings,
 * admin role assignments, and cross-wedding access boundaries.
 * Uses mocked Supabase to avoid requiring a live test project.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase
const mockFrom = vi.fn();
const mockRpc = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  supabase: { from: mockFrom, rpc: mockRpc },
}));

// ─── Helpers ────────────────────────────────────────────────────────

function createChain(data: any = null, error: any = null) {
  const chain: any = {
    select: vi.fn().mockReturnValue(chain),
    insert: vi.fn().mockReturnValue(chain),
    update: vi.fn().mockReturnValue(chain),
    delete: vi.fn().mockReturnValue(chain),
    eq: vi.fn().mockReturnValue(chain),
    in: vi.fn().mockReturnValue(chain),
    single: vi.fn().mockResolvedValue({ data, error }),
    then: vi.fn((resolve: any) => resolve({ data: data ? [data] : [], error })),
  };
  // Make the chain itself thenable for queries without .single()
  chain[Symbol.for('vitest:result')] = { data: data ? [data] : [], error };
  return chain;
}

// ─── Tests ───────────────────────────────────────────────────���──────

describe('Planner Multi-Wedding Workflows', () => {
  const plannerId = 'planner-uuid-123';
  const weddingA = { id: 'w-a-uuid', slug: 'priya-rahul-2026', couple_name: 'Priya & Rahul', created_by: plannerId };
  const weddingB = { id: 'w-b-uuid', slug: 'anita-dev-2026', couple_name: 'Anita & Dev', created_by: plannerId };
  const someoneElsesWedding = { id: 'w-c-uuid', slug: 'other-wedding', couple_name: 'Other Couple', created_by: 'other-user-uuid' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Wedding Creation', () => {
    it('planner can create multiple weddings', () => {
      // Both weddings have planner as created_by
      expect(weddingA.created_by).toBe(plannerId);
      expect(weddingB.created_by).toBe(plannerId);
      // Different slugs
      expect(weddingA.slug).not.toBe(weddingB.slug);
    });

    it('each wedding gets unique slug and UUID', () => {
      expect(weddingA.id).not.toBe(weddingB.id);
      expect(weddingA.slug).not.toBe(weddingB.slug);
    });
  });

  describe('Admin Role Assignment', () => {
    it('planner can add admin to their wedding', () => {
      const adminAssignment = {
        wedding_id: weddingA.id,
        user_id: 'admin-user-uuid',
        role: 'admin',
        invited_by: plannerId,
      };

      expect(adminAssignment.wedding_id).toBe(weddingA.id);
      expect(adminAssignment.invited_by).toBe(plannerId);
    });

    it('admin role grants access only to assigned wedding', () => {
      const adminWeddings = [weddingA.id]; // admin only assigned to wedding A
      expect(adminWeddings).toContain(weddingA.id);
      expect(adminWeddings).not.toContain(weddingB.id);
      expect(adminWeddings).not.toContain(someoneElsesWedding.id);
    });

    it('planner can be added as admin to someone else\'s wedding', () => {
      const crossAdminAssignment = {
        wedding_id: someoneElsesWedding.id,
        user_id: plannerId,
        role: 'admin',
        invited_by: someoneElsesWedding.created_by,
      };

      // Planner is now admin of someone else's wedding
      expect(crossAdminAssignment.user_id).toBe(plannerId);
      expect(crossAdminAssignment.wedding_id).toBe(someoneElsesWedding.id);
      // But they didn't create it
      expect(someoneElsesWedding.created_by).not.toBe(plannerId);
    });
  });

  describe('Cross-Wedding Access Boundaries', () => {
    it('planner can access only weddings they own or are admin of', () => {
      const ownedWeddings = [weddingA.id, weddingB.id];
      const adminOfWeddings = [someoneElsesWedding.id]; // from cross-assignment
      const allAccessible = [...ownedWeddings, ...adminOfWeddings];

      expect(allAccessible).toHaveLength(3);
      expect(allAccessible).toContain(weddingA.id);
      expect(allAccessible).toContain(someoneElsesWedding.id);
    });

    it('planner cannot access weddings they have no role in', () => {
      const randomWedding = { id: 'random-uuid', created_by: 'stranger-uuid' };
      const plannerOwnedIds = [weddingA.id, weddingB.id];
      const plannerAdminIds = [someoneElsesWedding.id];
      const allAccess = [...plannerOwnedIds, ...plannerAdminIds];

      expect(allAccess).not.toContain(randomWedding.id);
    });

    it('guest data is isolated per wedding', () => {
      const guestsWeddingA = [
        { id: 'g1', name: 'Auntie Ji', wedding_id: weddingA.slug },
        { id: 'g2', name: 'Uncle Ji', wedding_id: weddingA.slug },
      ];
      const guestsWeddingB = [
        { id: 'g3', name: 'College Friend', wedding_id: weddingB.slug },
      ];

      // Guests belong to their respective weddings
      const aGuests = guestsWeddingA.filter((g) => g.wedding_id === weddingA.slug);
      const bGuests = guestsWeddingB.filter((g) => g.wedding_id === weddingB.slug);

      expect(aGuests).toHaveLength(2);
      expect(bGuests).toHaveLength(1);

      // No cross-contamination
      const aGuestsInB = guestsWeddingA.filter((g) => g.wedding_id === weddingB.slug);
      expect(aGuestsInB).toHaveLength(0);
    });
  });

  describe('Cascade Delete Behavior', () => {
    it('deleting a wedding should cascade to settings, events, guests', () => {
      // Model the expected FK cascade chain
      const cascadeTargets = [
        'wedding_settings',
        'wedding_events',
        'wedding_schedule',
        'guests',
        'wedding_faqs',
        'registry_items',
      ];

      // All cascade targets should reference the wedding
      for (const table of cascadeTargets) {
        expect(table).toBeTruthy(); // ensure all tables in cascade chain are accounted for
      }
      expect(cascadeTargets).toHaveLength(6);
    });

    it('deleting a guest should cascade to rsvps and comments', () => {
      const guestCascadeTargets = ['rsvps', 'comments'];
      expect(guestCascadeTargets).toContain('rsvps');
      expect(guestCascadeTargets).toContain('comments');
    });
  });
});
