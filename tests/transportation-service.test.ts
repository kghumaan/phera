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

import {
    reorderVehicles,
    getAllVehiclesWithCapacity,
    getTransportationSettings,
    getVehicles,
} from '@/lib/supabase/transportation-service';

describe('transportation-service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ─── reorderVehicles ───────────────────────────────────────────────

    describe('reorderVehicles', () => {
        it('should send parallel update queries for all vehicles via Promise.all', async () => {
            const vehicleIds = ['v-1', 'v-2', 'v-3'];

            mockSupabase.from.mockImplementation(() => mockSupabase._makeBuilder());

            const result = await reorderVehicles(vehicleIds);

            expect(result).toBe(true);
            // Should have called from('transportation_vehicles') once per ID
            expect(mockSupabase.from).toHaveBeenCalledTimes(3);
            for (const call of mockSupabase.from.mock.calls as any[]) {
                expect(call[0]).toBe('transportation_vehicles');
            }
        });

        it('should assign correct order_index (0-based) to each vehicle', async () => {
            const vehicleIds = ['v-a', 'v-b'];
            const eqCalls: any[] = [];

            mockSupabase.from.mockImplementation(() => {
                const b = mockSupabase._makeBuilder();
                const origEq = b.eq;
                b.eq = vi.fn((...args: any) => {
                    eqCalls.push(args);
                    return origEq(...args);
                });
                return b;
            });

            await reorderVehicles(vehicleIds);

            // Each vehicle produces an .eq('id', vehicleId) call
            const idCalls = eqCalls.filter(c => c[0] === 'id');
            expect(idCalls).toHaveLength(2);
            expect(idCalls[0][1]).toBe('v-a');
            expect(idCalls[1][1]).toBe('v-b');
        });

        it('should return false when any update in the batch fails', async () => {
            const vehicleIds = ['v-1', 'v-2'];

            let callCount = 0;
            mockSupabase.from.mockImplementation(() => {
                callCount++;
                if (callCount === 2) {
                    return mockSupabase._makeBuilder(null, { message: 'DB error' });
                }
                return mockSupabase._makeBuilder();
            });

            const result = await reorderVehicles(vehicleIds);
            expect(result).toBe(false);
        });

        it('should handle empty vehicleIds array', async () => {
            const result = await reorderVehicles([]);
            expect(result).toBe(true);
            expect(mockSupabase.from).not.toHaveBeenCalled();
        });

        it('should handle single vehicle reorder', async () => {
            mockSupabase.from.mockImplementation(() => mockSupabase._makeBuilder());

            const result = await reorderVehicles(['only-vehicle']);

            expect(result).toBe(true);
            expect(mockSupabase.from).toHaveBeenCalledTimes(1);
        });
    });

    // ─── getAllVehiclesWithCapacity ─────────────────────────────────────

    describe('getAllVehiclesWithCapacity', () => {
        it('should fetch vehicles with reservations in a single join query', async () => {
            const vehicleData = [
                {
                    id: 'v-1',
                    capacity: 10,
                    vehicle_name: 'Bus A',
                    direction: 'arrival',
                    transportation_reservations: [
                        { party_size: 3, status: 'confirmed' },
                        { party_size: 2, status: 'confirmed' },
                    ],
                },
                {
                    id: 'v-2',
                    capacity: 5,
                    vehicle_name: 'Van B',
                    direction: 'arrival',
                    transportation_reservations: [
                        { party_size: 1, status: 'cancelled' },
                        { party_size: 2, status: 'confirmed' },
                    ],
                },
            ];

            const builder = mockSupabase._makeBuilder(vehicleData);
            mockSupabase.from.mockReturnValue(builder);

            const result = await getAllVehiclesWithCapacity('wedding-1', 'arrival');

            // Should only call from() ONCE (not N+1)
            expect(mockSupabase.from).toHaveBeenCalledTimes(1);
            expect(mockSupabase.from).toHaveBeenCalledWith('transportation_vehicles');

            // Verify capacity computations
            expect(result).toHaveLength(2);

            // Bus A: 3+2 = 5 booked, 10-5 = 5 available
            expect(result[0].booked).toBe(5);
            expect(result[0].available).toBe(5);

            // Van B: cancelled skipped, 2 booked, 5-2 = 3 available
            expect(result[1].booked).toBe(2);
            expect(result[1].available).toBe(3);
        });

        it('should exclude cancelled reservations from booked count', async () => {
            const vehicleData = [
                {
                    id: 'v-1',
                    capacity: 20,
                    transportation_reservations: [
                        { party_size: 5, status: 'cancelled' },
                        { party_size: 5, status: 'cancelled' },
                        { party_size: 3, status: 'confirmed' },
                    ],
                },
            ];

            const builder = mockSupabase._makeBuilder(vehicleData);
            mockSupabase.from.mockReturnValue(builder);

            const result = await getAllVehiclesWithCapacity('w-1', 'arrival');

            expect(result[0].booked).toBe(3);
            expect(result[0].available).toBe(17);
        });

        it('should default party_size to 1 when not provided', async () => {
            const vehicleData = [
                {
                    id: 'v-1',
                    capacity: 10,
                    transportation_reservations: [
                        { party_size: null, status: 'confirmed' },
                        { party_size: undefined, status: 'confirmed' },
                    ],
                },
            ];

            const builder = mockSupabase._makeBuilder(vehicleData);
            mockSupabase.from.mockReturnValue(builder);

            const result = await getAllVehiclesWithCapacity('w-1', 'arrival');

            // 1 + 1 = 2 (defaults to 1 for each)
            expect(result[0].booked).toBe(2);
            expect(result[0].available).toBe(8);
        });

        it('should clamp available to 0 when overbooked', async () => {
            const vehicleData = [
                {
                    id: 'v-1',
                    capacity: 2,
                    transportation_reservations: [
                        { party_size: 5, status: 'confirmed' },
                    ],
                },
            ];

            const builder = mockSupabase._makeBuilder(vehicleData);
            mockSupabase.from.mockReturnValue(builder);

            const result = await getAllVehiclesWithCapacity('w-1', 'arrival');

            expect(result[0].booked).toBe(5);
            expect(result[0].available).toBe(0); // clamped via Math.max(0, ...)
        });

        it('should strip nested transportation_reservations from returned data', async () => {
            const vehicleData = [
                {
                    id: 'v-1',
                    capacity: 10,
                    vehicle_name: 'Bus',
                    transportation_reservations: [
                        { party_size: 1, status: 'confirmed' },
                    ],
                },
            ];

            const builder = mockSupabase._makeBuilder(vehicleData);
            mockSupabase.from.mockReturnValue(builder);

            const result = await getAllVehiclesWithCapacity('w-1', 'arrival');

            expect(result[0]).not.toHaveProperty('transportation_reservations');
            expect(result[0]).toHaveProperty('booked');
            expect(result[0]).toHaveProperty('available');
            expect(result[0]).toHaveProperty('vehicle_name', 'Bus');
        });

        it('should handle vehicles with no reservations', async () => {
            const vehicleData = [
                {
                    id: 'v-1',
                    capacity: 10,
                    transportation_reservations: [],
                },
            ];

            const builder = mockSupabase._makeBuilder(vehicleData);
            mockSupabase.from.mockReturnValue(builder);

            const result = await getAllVehiclesWithCapacity('w-1', 'arrival');

            expect(result[0].booked).toBe(0);
            expect(result[0].available).toBe(10);
        });

        it('should return empty array on database error', async () => {
            const builder = mockSupabase._makeBuilder(null, { message: 'DB error' });
            mockSupabase.from.mockReturnValue(builder);

            const result = await getAllVehiclesWithCapacity('w-1', 'arrival');
            expect(result).toEqual([]);
        });

        it('should filter by wedding_id and direction', async () => {
            const builder = mockSupabase._makeBuilder([]);
            mockSupabase.from.mockReturnValue(builder);

            await getAllVehiclesWithCapacity('wedding-xyz', 'departure');

            expect(builder.eq).toHaveBeenCalledWith('wedding_id', 'wedding-xyz');
            expect(builder.eq).toHaveBeenCalledWith('direction', 'departure');
        });
    });

    // ─── getTransportationSettings ─────────────────────────────────────

    describe('getTransportationSettings', () => {
        it('should fetch settings for a wedding', async () => {
            const settings = { id: '1', wedding_id: 'w-1', mode: 'curated', setup_complete: true };

            const builder = mockSupabase._makeBuilder(settings);
            mockSupabase.from.mockReturnValue(builder);

            const result = await getTransportationSettings('w-1');

            expect(mockSupabase.from).toHaveBeenCalledWith('transportation_settings');
            expect(result).toEqual(settings);
        });

        it('should return null when no settings exist (PGRST116)', async () => {
            const builder = mockSupabase._makeBuilder(null, { code: 'PGRST116' });
            mockSupabase.from.mockReturnValue(builder);

            const result = await getTransportationSettings('w-1');

            // PGRST116 is "no rows found" — should NOT be treated as error
            expect(result).toBeNull();
        });

        it('should return null on actual error', async () => {
            const builder = mockSupabase._makeBuilder(null, { code: 'INTERNAL', message: 'fail' });
            mockSupabase.from.mockReturnValue(builder);

            const result = await getTransportationSettings('w-1');
            expect(result).toBeNull();
        });
    });

    // ─── getVehicles ───────────────────────────────────────────────────

    describe('getVehicles', () => {
        it('should fetch vehicles ordered by order_index', async () => {
            const vehicles = [
                { id: 'v-1', order_index: 0 },
                { id: 'v-2', order_index: 1 },
            ];

            const builder = mockSupabase._makeBuilder(vehicles);
            mockSupabase.from.mockReturnValue(builder);

            const result = await getVehicles('w-1', 'arrival');

            expect(mockSupabase.from).toHaveBeenCalledWith('transportation_vehicles');
            expect(builder.order).toHaveBeenCalledWith('order_index', { ascending: true });
            expect(result).toHaveLength(2);
        });

        it('should return empty array on error', async () => {
            const builder = mockSupabase._makeBuilder(null, { message: 'error' });
            mockSupabase.from.mockReturnValue(builder);

            const result = await getVehicles('w-1', 'departure');
            expect(result).toEqual([]);
        });
    });
});
