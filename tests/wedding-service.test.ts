import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Supabase Mock ──────────────────────────────────────────────
const { mockSupabase } = vi.hoisted(() => {
    // Create a chainable query builder factory
    function makeBuilder(resolvedData: any = null, resolvedError: any = null) {
        const builder: any = {
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            upsert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            neq: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: resolvedData, error: resolvedError }),
            maybeSingle: vi.fn().mockResolvedValue({ data: resolvedData, error: resolvedError }),
            // Make the builder itself thenable so `await supabase.from().update().eq()` works
            then: vi.fn((resolve: any) => resolve({ data: resolvedData, error: resolvedError })),
        };
        return builder;
    }

    const mockSupabase = {
        from: vi.fn(() => makeBuilder()),
        auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
            getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        },
        _makeBuilder: makeBuilder,
    };
    return { mockSupabase };
});

vi.mock('@/lib/supabase/client', () => ({
    supabase: mockSupabase,
}));

import { weddingService } from '@/lib/supabase/wedding-service';

describe('wedding-service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ─── reorderScheduleItems ──────────────────────────────────────────

    describe('reorderScheduleItems', () => {
        it('should send parallel update queries for all items via Promise.all', async () => {
            const items = [
                { id: 'item-1', order_index: 0 },
                { id: 'item-2', order_index: 1 },
                { id: 'item-3', order_index: 2 },
            ];

            // Each from() call returns a fresh builder that resolves without error
            mockSupabase.from.mockImplementation(() => mockSupabase._makeBuilder());

            const result = await weddingService.reorderScheduleItems(items);

            expect(result).toBe(true);
            // Should have called from('schedule_items') once per item
            expect(mockSupabase.from).toHaveBeenCalledTimes(3);
            for (const call of mockSupabase.from.mock.calls) {
                expect(call[0]).toBe('schedule_items');
            }
        });

        it('should return false when any update in the batch fails', async () => {
            const items = [
                { id: 'item-1', order_index: 0 },
                { id: 'item-2', order_index: 1 },
            ];

            let callCount = 0;
            mockSupabase.from.mockImplementation(() => {
                callCount++;
                if (callCount === 2) {
                    // Second call fails
                    return mockSupabase._makeBuilder(null, { message: 'DB error' });
                }
                return mockSupabase._makeBuilder();
            });

            const result = await weddingService.reorderScheduleItems(items);
            expect(result).toBe(false);
        });

        it('should return true for empty items array', async () => {
            const result = await weddingService.reorderScheduleItems([]);
            expect(result).toBe(true);
            expect(mockSupabase.from).not.toHaveBeenCalled();
        });

        it('should handle single item reorder', async () => {
            mockSupabase.from.mockImplementation(() => mockSupabase._makeBuilder());

            const result = await weddingService.reorderScheduleItems([
                { id: 'only-item', order_index: 0 },
            ]);

            expect(result).toBe(true);
            expect(mockSupabase.from).toHaveBeenCalledTimes(1);
        });
    });

    // ─── updateScheduleItemsOrder ──────────────────────────────────────

    describe('updateScheduleItemsOrder', () => {
        it('should execute all updates in parallel via Promise.all', async () => {
            const items = [
                { id: 'a', order_index: 2 },
                { id: 'b', order_index: 0 },
                { id: 'c', order_index: 1 },
            ];

            mockSupabase.from.mockImplementation(() => mockSupabase._makeBuilder());

            const result = await weddingService.updateScheduleItemsOrder(items);

            expect(result).toBe(true);
            expect(mockSupabase.from).toHaveBeenCalledTimes(3);
        });

        it('should return false when any update fails', async () => {
            const items = [
                { id: 'a', order_index: 0 },
                { id: 'b', order_index: 1 },
            ];

            let callCount = 0;
            mockSupabase.from.mockImplementation(() => {
                callCount++;
                if (callCount === 1) {
                    return mockSupabase._makeBuilder(null, { message: 'permission denied' });
                }
                return mockSupabase._makeBuilder();
            });

            const result = await weddingService.updateScheduleItemsOrder(items);
            expect(result).toBe(false);
        });
    });

    // ─── getRSVPStats ──────────────────────────────────────────────────

    describe('getRSVPStats', () => {
        it('should calculate correct stats from RSVP data', async () => {
            const rsvpData = [
                { attending: 'yes', plus_one: true },
                { attending: 'yes', plus_one: false },
                { attending: 'no', plus_one: false },
                { attending: 'maybe', plus_one: true },
                { attending: 'yes', plus_one: true },
            ];

            const builder = mockSupabase._makeBuilder(rsvpData);
            mockSupabase.from.mockReturnValue(builder);

            const stats = await weddingService.getRSVPStats('wedding-id');

            expect(stats.total).toBe(5);
            expect(stats.yes).toBe(3);
            expect(stats.no).toBe(1);
            expect(stats.maybe).toBe(1);
            expect(stats.plusOnes).toBe(3);
        });

        it('should only select attending and plus_one columns', async () => {
            const builder = mockSupabase._makeBuilder([]);
            mockSupabase.from.mockReturnValue(builder);

            await weddingService.getRSVPStats('wedding-id');

            expect(mockSupabase.from).toHaveBeenCalledWith('rsvps');
            expect(builder.select).toHaveBeenCalledWith('attending, plus_one');
        });

        it('should return zeros when no data', async () => {
            const builder = mockSupabase._makeBuilder(null, { message: 'error' });
            mockSupabase.from.mockReturnValue(builder);

            const stats = await weddingService.getRSVPStats('wedding-id');

            expect(stats).toEqual({ total: 0, yes: 0, no: 0, maybe: 0, plusOnes: 0 });
        });

        it('should return zeros when data is empty array', async () => {
            const builder = mockSupabase._makeBuilder([]);
            mockSupabase.from.mockReturnValue(builder);

            const stats = await weddingService.getRSVPStats('wedding-id');

            expect(stats.total).toBe(0);
            expect(stats.yes).toBe(0);
        });
    });

    // ─── getTravelCards ────────────────────────────────────────────────

    describe('getTravelCards', () => {
        it('should fetch travel cards ordered by order_index', async () => {
            const travelCards = [
                { id: '1', title: 'Hotel A', order_index: 0 },
                { id: '2', title: 'Hotel B', order_index: 1 },
            ];

            const builder = mockSupabase._makeBuilder(travelCards);
            mockSupabase.from.mockReturnValue(builder);

            const result = await weddingService.getTravelCards('wedding-id');

            expect(mockSupabase.from).toHaveBeenCalledWith('wedding_travel_cards');
            expect(builder.eq).toHaveBeenCalledWith('wedding_id', 'wedding-id');
            expect(builder.order).toHaveBeenCalledWith('order_index', { ascending: true });
            expect(result).toHaveLength(2);
        });

        it('should return empty array on error', async () => {
            const builder = mockSupabase._makeBuilder(null, { message: 'error' });
            mockSupabase.from.mockReturnValue(builder);

            const result = await weddingService.getTravelCards('wedding-id');
            expect(result).toEqual([]);
        });
    });

    // ─── getFAQs ───────────────────────────────────────────────────────

    describe('getFAQs', () => {
        it('should fetch FAQs ordered by order_index', async () => {
            const faqs = [
                { id: '1', question: 'Q1', answer: 'A1', order_index: 0 },
                { id: '2', question: 'Q2', answer: 'A2', order_index: 1 },
            ];

            const builder = mockSupabase._makeBuilder(faqs);
            mockSupabase.from.mockReturnValue(builder);

            const result = await weddingService.getFAQs('wedding-id');

            expect(mockSupabase.from).toHaveBeenCalledWith('wedding_faqs');
            expect(result).toHaveLength(2);
        });
    });

    // ─── clearWeddingContent ───────────────────────────────────────────

    describe('clearWeddingContent', () => {
        it('should delete from multiple tables in order', async () => {
            // Mock the schedule query to return some schedules
            const scheduleBuilder = mockSupabase._makeBuilder([{ id: 'sched-1' }]);
            const deleteBuilder = mockSupabase._makeBuilder();

            mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'wedding_schedule') {
                    // Return schedule builder first (for select), then delete builder
                    return scheduleBuilder;
                }
                return deleteBuilder;
            });

            const result = await weddingService.clearWeddingContent('wedding-id');
            expect(result).toBe(true);

            // Verify it deletes from the expected tables
            const calledTables = mockSupabase.from.mock.calls.map((c: any) => c[0]);
            expect(calledTables).toContain('wedding_faqs');
            expect(calledTables).toContain('wedding_registry');
            expect(calledTables).toContain('wedding_travel_cards');
            expect(calledTables).toContain('wedding_events');
        });
    });

    // ─── submitFeatureRequest ──────────────────────────────────────────

    describe('submitFeatureRequest', () => {
        it('should insert feature request with correct data', async () => {
            const builder = mockSupabase._makeBuilder();
            mockSupabase.from.mockReturnValue(builder);

            const result = await weddingService.submitFeatureRequest(
                'user-1', 'wedding-1', 'Add dark mode'
            );

            expect(result).toBe(true);
            expect(mockSupabase.from).toHaveBeenCalledWith('feature_requests');
        });

        it('should handle null weddingId', async () => {
            const builder = mockSupabase._makeBuilder();
            mockSupabase.from.mockReturnValue(builder);

            const result = await weddingService.submitFeatureRequest(
                'user-1', undefined, 'Some request'
            );

            expect(result).toBe(true);
        });

        it('should return false on error', async () => {
            const builder = mockSupabase._makeBuilder(null, { message: 'DB error' });
            mockSupabase.from.mockReturnValue(builder);

            const result = await weddingService.submitFeatureRequest(
                'user-1', 'wedding-1', 'Request'
            );

            expect(result).toBe(false);
        });
    });
});
