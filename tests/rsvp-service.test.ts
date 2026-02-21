import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Supabase Mock ──────────────────────────────────────────────
const { mockSupabase } = vi.hoisted(() => {
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
            then: vi.fn((resolve: any) => resolve({ data: resolvedData, error: resolvedError })),
        };
        return builder;
    }

    const mockSupabase = {
        from: vi.fn(() => makeBuilder()),
        _makeBuilder: makeBuilder,
    };
    return { mockSupabase };
});

vi.mock('@/lib/supabase/client', () => ({
    supabase: mockSupabase,
}));

// We also need to mock avatar-generator since rsvp-service imports it
vi.mock('@/lib/utils/avatar-generator', () => ({
    generateGuestAvatar: vi.fn(() => ({
        svg: '<svg>mock</svg>',
        dataUri: 'data:image/svg+xml;base64,mock',
        seed: 'test-seed',
        style: 'shapes',
    })),
    generateFallbackColor: vi.fn(() => '#E91E63'),
}));

import { getExistingRSVP, getAllRSVPs, getComments } from '@/lib/supabase/rsvp-service';

describe('rsvp-service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ─── getExistingRSVP ───────────────────────────────────────────────

    describe('getExistingRSVP', () => {
        it('should query guests table with lowercase email and weddingId', async () => {
            const guestData = {
                id: 'guest-1',
                name: 'Jane Doe',
                email: 'jane@example.com',
                phone: '+11234567890',
                wedding_side: 'bride',
                rsvps: [{
                    id: 'rsvp-1',
                    attending: 'yes',
                    guest_count: 2,
                    plus_one: true,
                    plus_one_name: 'John',
                    plus_one_email: 'john@example.com',
                    plus_one_country_code: '+1',
                    plus_one_phone: '9876543210',
                    country_code: '+1',
                    food_preference: 'vegetarian',
                    dietary_restrictions: 'none',
                    song_request: 'Song A',
                    special_message: 'Can\'t wait!',
                    maybe_comment: null,
                    arrival_option: null,
                    arrival_date: null,
                }],
            };

            const builder = mockSupabase._makeBuilder(guestData);
            mockSupabase.from.mockReturnValue(builder);

            const result = await getExistingRSVP('Jane@Example.COM', 'wedding-1');

            expect(mockSupabase.from).toHaveBeenCalledWith('guests');
            expect(builder.eq).toHaveBeenCalledWith('email', 'jane@example.com');
            expect(builder.eq).toHaveBeenCalledWith('wedding_id', 'wedding-1');
            expect(result.success).toBe(true);
        });

        it('should return error when no RSVP data exists', async () => {
            const builder = mockSupabase._makeBuilder({ id: '1', rsvps: [] });
            mockSupabase.from.mockReturnValue(builder);

            const result = await getExistingRSVP('user@test.com', 'w-1');
            expect(result.success).toBe(false);
        });

        it('should return error when no guest record found', async () => {
            const builder = mockSupabase._makeBuilder(null, { code: 'PGRST116' });
            mockSupabase.from.mockReturnValue(builder);

            const result = await getExistingRSVP('unknown@test.com', 'w-1');
            expect(result.success).toBe(false);
        });
    });

    // ─── getAllRSVPs ───────────────────────────────────────────────────

    describe('getAllRSVPs', () => {
        it('should fetch all RSVPs with guest data for a wedding', async () => {
            const rsvpData = [
                {
                    id: 'r-1',
                    attending: 'yes',
                    guest_count: 1,
                    created_at: '2024-01-01',
                    guest_id: 'g-1',
                    guests: { id: 'g-1', name: 'Alice', initials: 'A', avatar_color: '#FF0000' },
                },
                {
                    id: 'r-2',
                    attending: 'no',
                    guest_count: 1,
                    created_at: '2024-01-02',
                    guest_id: 'g-2',
                    guests: { id: 'g-2', name: 'Bob', initials: 'B', avatar_color: '#00FF00' },
                },
            ];

            const builder = mockSupabase._makeBuilder(rsvpData);
            mockSupabase.from.mockReturnValue(builder);

            const result = await getAllRSVPs('wedding-1');

            expect(mockSupabase.from).toHaveBeenCalledWith('rsvps');
            expect(builder.eq).toHaveBeenCalledWith('wedding_id', 'wedding-1');
            expect(result).toHaveLength(2);
        });

        it('should throw error on database error', async () => {
            const builder = mockSupabase._makeBuilder(null, { message: 'DB error' });
            // The `then` pattern doesn't work for throw — mock the full chain to throw
            builder.then = vi.fn((resolve: any, reject: any) => reject && reject({ message: 'DB error' }));
            // Actually, getAllRSVPs uses `await` destructuring, so the `.then` mock is used.
            // Since getAllRSVPs does `throw error` when error exists, we need the resolved value
            // to contain an error. The issue is the `then` mock resolves normally, but the
            // function checks `if (error) throw error`.
            // Fix: Make the builder's `then` resolve with data containing error.
            const failBuilder = mockSupabase._makeBuilder(null, 'DB error');
            // Override `then` to properly simulate `await` behavior with error
            failBuilder.order = vi.fn().mockReturnValue({
                then: vi.fn((resolve: any) => resolve({ data: null, error: 'DB error' })),
            });
            mockSupabase.from.mockReturnValue(failBuilder);

            await expect(getAllRSVPs('wedding-1')).rejects.toBeTruthy();
        });
    });

    // ─── getComments ───────────────────────────────────────────────────

    describe('getComments', () => {
        it('should fetch comments with guest data ordered by newest first', async () => {
            const commentsData = [
                {
                    id: 'c-1',
                    text: 'Great wedding!',
                    created_at: '2024-01-02',
                    guests: { name: 'Alice' },
                },
                {
                    id: 'c-2',
                    text: 'Congratulations!',
                    created_at: '2024-01-01',
                    guests: { name: 'Bob' },
                },
            ];

            const builder = mockSupabase._makeBuilder(commentsData);
            mockSupabase.from.mockReturnValue(builder);

            const result = await getComments('wedding-1');

            expect(mockSupabase.from).toHaveBeenCalledWith('comments');
            expect(builder.order).toHaveBeenCalledWith('created_at', { ascending: false });
            expect(result).toHaveLength(2);
        });

        it('should throw error on database error', async () => {
            const failBuilder = mockSupabase._makeBuilder(null, 'error');
            failBuilder.order = vi.fn().mockReturnValue({
                then: vi.fn((resolve: any) => resolve({ data: null, error: 'error' })),
            });
            mockSupabase.from.mockReturnValue(failBuilder);

            await expect(getComments('wedding-1')).rejects.toBeTruthy();
        });
    });
});
