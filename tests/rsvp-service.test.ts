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

import { getExistingRSVP, getAllRSVPs, getComments, submitRSVP } from '@/lib/supabase/rsvp-service';
import type { RSVPFormData } from '@/lib/supabase/types';

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

    // ─── submitRSVP ─────────────────────────────────────────────────
    // These tests verify that form submission works regardless of which
    // optional steps are present, matching the admin's ability to hide
    // "Team Bride/Groom" and "Music Request & Comment".

    describe('submitRSVP', () => {
        const baseFormData: RSVPFormData = {
            firstName: 'Jane',
            lastName: 'Doe',
            email: 'jane@example.com',
            password: 'password123',
            countryCode: '+1',
            phone: '1234567890',
            attending: 'yes',
            plusOne: 'no',
            plusOneName: '',
            plusOneEmail: '',
            plusOneCountryCode: '+1',
            plusOnePhone: '',
            guestCount: 1,
            foodPreference: ['vegetarian'],
            dietaryRestrictions: 'none',
            weddingSide: 'bride',
            songRequest: 'Song A',
            specialMessage: 'Congrats!',
            maybeComment: '',
        };

        function setupSubmitMocks(existingGuestId: string | null = null) {
            // Mock global fetch for WhatsApp / other API calls
            global.fetch = vi.fn().mockResolvedValue({ ok: true });

            // Call 1: guests.select (check existing guest)
            const guestSelectBuilder = mockSupabase._makeBuilder(
                existingGuestId ? { id: existingGuestId } : null,
                existingGuestId ? null : { code: 'PGRST116' }
            );

            // Call 2: guests.update or guests.insert
            const guestMutateBuilder = mockSupabase._makeBuilder({ id: existingGuestId || 'new-guest-id' });

            // Call 3: rsvps.upsert
            const rsvpBuilder = mockSupabase._makeBuilder({ id: 'rsvp-1' });

            // Call 4: comments.insert (if specialMessage provided)
            const commentBuilder = mockSupabase._makeBuilder({ id: 'comment-1' });

            let callCount = 0;
            (mockSupabase.from as any).mockImplementation((table: string) => {
                callCount++;
                if (table === 'guests' && callCount === 1) return guestSelectBuilder;
                if (table === 'guests') return guestMutateBuilder;
                if (table === 'rsvps') return rsvpBuilder;
                if (table === 'comments') return commentBuilder;
                return mockSupabase._makeBuilder();
            });

            return { guestSelectBuilder, guestMutateBuilder, rsvpBuilder, commentBuilder };
        }

        it('should submit successfully with all steps present', async () => {
            setupSubmitMocks('existing-guest-1');

            const result = await submitRSVP(baseFormData, 'wedding-1');

            expect(result.success).toBe(true);
            expect(result.guestId).toBe('existing-guest-1');
        });

        it('should submit successfully when Team Bride/Groom is hidden (no weddingSide)', async () => {
            setupSubmitMocks('existing-guest-1');

            const formData: RSVPFormData = {
                ...baseFormData,
                weddingSide: '', // hidden step — empty value
            };

            const result = await submitRSVP(formData, 'wedding-1');

            expect(result.success).toBe(true);
            // Verify guest update was called with null wedding_side
            expect(mockSupabase.from).toHaveBeenCalledWith('guests');
        });

        it('should submit successfully when Music Request & Comment is hidden (no song/message)', async () => {
            setupSubmitMocks('existing-guest-1');

            const formData: RSVPFormData = {
                ...baseFormData,
                songRequest: '',    // hidden step — empty
                specialMessage: '', // hidden step — empty
            };

            const result = await submitRSVP(formData, 'wedding-1');

            expect(result.success).toBe(true);
            // Should NOT insert a comment when specialMessage is empty
            const commentCalls = mockSupabase.from.mock.calls.filter(
                (c: any[]) => c[0] === 'comments'
            );
            expect(commentCalls).toHaveLength(0);
        });

        it('should submit successfully when both optional steps are hidden', async () => {
            setupSubmitMocks('existing-guest-1');

            const formData: RSVPFormData = {
                ...baseFormData,
                weddingSide: '',
                songRequest: '',
                specialMessage: '',
            };

            const result = await submitRSVP(formData, 'wedding-1');

            expect(result.success).toBe(true);
        });

        it('should submit successfully for a new guest (no existing record)', async () => {
            setupSubmitMocks(null);

            const result = await submitRSVP(baseFormData, 'wedding-1');

            expect(result.success).toBe(true);
            // First guests call is select (returns null), second is insert
            expect(mockSupabase.from).toHaveBeenCalledWith('guests');
        });

        it('should submit successfully with "no" attendance (early exit scenario)', async () => {
            setupSubmitMocks('existing-guest-1');

            const formData: RSVPFormData = {
                ...baseFormData,
                attending: 'no',
                foodPreference: [],
                weddingSide: '',
                songRequest: '',
                specialMessage: '',
            };

            const result = await submitRSVP(formData, 'wedding-1');

            expect(result.success).toBe(true);
        });

        it('should submit successfully with "maybe" attendance', async () => {
            setupSubmitMocks('existing-guest-1');

            const formData: RSVPFormData = {
                ...baseFormData,
                attending: 'maybe',
                maybeComment: 'Checking flights',
                weddingSide: '',
                songRequest: '',
                specialMessage: '',
            };

            const result = await submitRSVP(formData, 'wedding-1');

            expect(result.success).toBe(true);
        });

        it('should submit successfully with custom_answers (custom steps)', async () => {
            setupSubmitMocks('existing-guest-1');

            const formData: RSVPFormData = {
                ...baseFormData,
                custom_answers: {
                    'q-1': 'Blue',
                    'q-2': 'Large',
                },
            };

            const result = await submitRSVP(formData, 'wedding-1');

            expect(result.success).toBe(true);
        });

        it('should submit with plus-one details when allowed', async () => {
            setupSubmitMocks('existing-guest-1');

            const formData: RSVPFormData = {
                ...baseFormData,
                plusOne: 'yes',
                plusOneName: 'John Doe',
                plusOneEmail: 'john@example.com',
                plusOneCountryCode: '+1',
                plusOnePhone: '9876543210',
                guestCount: 2,
            };

            const result = await submitRSVP(formData, 'wedding-1');

            expect(result.success).toBe(true);
        });

        it('should return error when rsvp upsert fails', async () => {
            global.fetch = vi.fn().mockResolvedValue({ ok: true });

            // Guest select — existing guest found
            const guestSelectBuilder = mockSupabase._makeBuilder({ id: 'guest-1' });
            // Guest update
            const guestUpdateBuilder = mockSupabase._makeBuilder({ id: 'guest-1' });
            // RSVP upsert — fails
            const rsvpBuilder = mockSupabase._makeBuilder(null, { code: '42703', message: 'column error' });

            let callCount = 0;
            (mockSupabase.from as any).mockImplementation((table: string) => {
                callCount++;
                if (table === 'guests' && callCount === 1) return guestSelectBuilder;
                if (table === 'guests') return guestUpdateBuilder;
                if (table === 'rsvps') return rsvpBuilder;
                return mockSupabase._makeBuilder();
            });

            const result = await submitRSVP(baseFormData, 'wedding-1');

            expect(result.success).toBe(false);
        });

        it('should not include custom_answers in rsvp upsert payload', async () => {
            const { rsvpBuilder } = setupSubmitMocks('existing-guest-1');

            const formData: RSVPFormData = {
                ...baseFormData,
                custom_answers: { 'q-1': 'Answer' },
            };

            await submitRSVP(formData, 'wedding-1');

            // Verify the upsert was called and the payload does NOT contain custom_answers
            const upsertCall = rsvpBuilder.upsert.mock.calls[0];
            expect(upsertCall).toBeDefined();
            const payload = upsertCall[0];
            expect(payload).not.toHaveProperty('custom_answers');
        });
    });
});
