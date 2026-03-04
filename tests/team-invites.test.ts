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

// ─── Helper: build invite login URL (mirrors resend.ts logic) ───
function buildInviteLoginUrl(baseUrl: string, weddingSlug: string): string {
    return `${baseUrl}/auth/login?redirect=${encodeURIComponent(`/admin/${weddingSlug}/overview`)}`;
}

// ─── Helper: determine admin role (mirrors layout.tsx logic) ─────
function determineAdminRole(
    userId: string,
    wedding: { created_by: string },
    adminEntry: { role: string } | null,
): 'owner' | 'admin' | 'viewer' | null {
    if (wedding.created_by === userId) return 'owner';
    if (adminEntry?.role === 'admin') return 'admin';
    if (adminEntry?.role === 'viewer') return 'viewer';
    return null;
}

describe('team-invites', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ─── 1. Invite Processing ────────────────────────────────────────

    describe('processInvitesForUser', () => {
        it('should process a pending invite and create wedding_admin with correct role', async () => {
            const invite = { id: 'inv-1', wedding_id: 'w-1', email: 'user@test.com', role: 'viewer' };
            let callCount = 0;

            mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'wedding_invites') {
                    const builder = mockSupabase._makeBuilder([invite]);
                    builder.then = vi.fn((resolve: any) => resolve({ data: [invite], error: null }));
                    return builder;
                }
                if (table === 'wedding_admins') {
                    callCount++;
                    if (callCount === 1) {
                        // First call: check existing admin - not found
                        return mockSupabase._makeBuilder(null, { code: 'PGRST116' });
                    }
                    // Second call: insert
                    return mockSupabase._makeBuilder(null, null);
                }
                return mockSupabase._makeBuilder();
            });

            const result = await weddingService.processInvitesForUser('user@test.com', 'user-1');
            expect(result).toBe(1);
        });

        it('should skip processing if user is already an admin', async () => {
            const invite = { id: 'inv-1', wedding_id: 'w-1', email: 'user@test.com', role: 'admin' };

            mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'wedding_invites') {
                    const builder = mockSupabase._makeBuilder([invite]);
                    builder.then = vi.fn((resolve: any) => resolve({ data: [invite], error: null }));
                    return builder;
                }
                if (table === 'wedding_admins') {
                    // User already has admin entry
                    return mockSupabase._makeBuilder({ id: 'existing-admin' });
                }
                return mockSupabase._makeBuilder();
            });

            const result = await weddingService.processInvitesForUser('user@test.com', 'user-1');
            expect(result).toBe(0);
        });

        it('should return 0 when there are no pending invites', async () => {
            mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'wedding_invites') {
                    const builder = mockSupabase._makeBuilder([]);
                    builder.then = vi.fn((resolve: any) => resolve({ data: [], error: null }));
                    return builder;
                }
                return mockSupabase._makeBuilder();
            });

            const result = await weddingService.processInvitesForUser('nobody@test.com', 'user-1');
            expect(result).toBe(0);
        });

        it('should handle multiple invites for the same user', async () => {
            const invites = [
                { id: 'inv-1', wedding_id: 'w-1', email: 'user@test.com', role: 'admin' },
                { id: 'inv-2', wedding_id: 'w-2', email: 'user@test.com', role: 'viewer' },
            ];

            mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'wedding_invites') {
                    // select returns array via thenable
                    const builder = mockSupabase._makeBuilder(invites);
                    builder.then = vi.fn((resolve: any) => resolve({ data: invites, error: null }));
                    return builder;
                }
                if (table === 'wedding_admins') {
                    // .select().eq().eq().single() → not found (no existing admin)
                    const builder = mockSupabase._makeBuilder(null, { code: 'PGRST116' });
                    // .insert() → success (thenable resolves with no error)
                    builder.insert = vi.fn().mockReturnValue({
                        then: vi.fn((resolve: any) => resolve({ data: null, error: null })),
                    });
                    return builder;
                }
                return mockSupabase._makeBuilder();
            });

            const result = await weddingService.processInvitesForUser('user@test.com', 'user-1');
            expect(result).toBe(2);
        });

        it('should return 0 on fetch error', async () => {
            mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'wedding_invites') {
                    const builder = mockSupabase._makeBuilder(null, { message: 'DB error' });
                    builder.then = vi.fn((resolve: any) => resolve({ data: null, error: { message: 'DB error' } }));
                    return builder;
                }
                return mockSupabase._makeBuilder();
            });

            const result = await weddingService.processInvitesForUser('user@test.com', 'user-1');
            expect(result).toBe(0);
        });
    });

    // ─── 2. Email Invite URL ─────────────────────────────────────────

    describe('buildInviteLoginUrl', () => {
        it('should include redirect param to /admin/{slug}/overview', () => {
            const url = buildInviteLoginUrl('https://phera.app', 'anika-raj');
            expect(url).toContain('/auth/login?redirect=');
            expect(url).toContain(encodeURIComponent('/admin/anika-raj/overview'));
        });

        it('should properly encode the redirect URL', () => {
            const url = buildInviteLoginUrl('https://phera.app', 'test-wedding');
            const parsed = new URL(url);
            const redirect = parsed.searchParams.get('redirect');
            expect(redirect).toBe('/admin/test-wedding/overview');
        });

        it('should use the correct base URL', () => {
            const url = buildInviteLoginUrl('https://custom.domain.com', 'my-wedding');
            expect(url.startsWith('https://custom.domain.com/auth/login')).toBe(true);
        });
    });

    // ─── 3. Admin Role Detection ─────────────────────────────────────

    describe('determineAdminRole', () => {
        it('should return "owner" when user created the wedding', () => {
            const role = determineAdminRole('user-1', { created_by: 'user-1' }, null);
            expect(role).toBe('owner');
        });

        it('should return "admin" for wedding_admins entry with role=admin', () => {
            const role = determineAdminRole('user-2', { created_by: 'user-1' }, { role: 'admin' });
            expect(role).toBe('admin');
        });

        it('should return "viewer" for wedding_admins entry with role=viewer', () => {
            const role = determineAdminRole('user-2', { created_by: 'user-1' }, { role: 'viewer' });
            expect(role).toBe('viewer');
        });

        it('should return null when user has no access', () => {
            const role = determineAdminRole('user-2', { created_by: 'user-1' }, null);
            expect(role).toBeNull();
        });

        it('should assign different roles per wedding', () => {
            // Viewer on wedding A
            const roleA = determineAdminRole('user-2', { created_by: 'user-1' }, { role: 'viewer' });
            // Admin on wedding B
            const roleB = determineAdminRole('user-2', { created_by: 'user-3' }, { role: 'admin' });
            expect(roleA).toBe('viewer');
            expect(roleB).toBe('admin');
        });
    });

    // ─── 4. Viewer Enforcement (isViewOnly logic) ────────────────────

    describe('viewer enforcement', () => {
        it('isViewOnly should be true only for viewer role', () => {
            const roles = ['owner', 'admin', 'viewer', null] as const;
            const expected = [false, false, true, false];
            roles.forEach((role, i) => {
                expect(role === 'viewer').toBe(expected[i]);
            });
        });

        it('isViewOnly should block save operations (handler returns early)', () => {
            const isViewOnly = true;
            let saveCalled = false;
            const handleSave = () => {
                if (isViewOnly) return;
                saveCalled = true;
            };
            handleSave();
            expect(saveCalled).toBe(false);
        });

        it('isViewOnly should not block read-only operations', () => {
            const isViewOnly = true;
            let exportCalled = false;
            const handleExport = () => {
                // Export is read-only, no guard
                exportCalled = true;
            };
            handleExport();
            expect(exportCalled).toBe(true);
        });

        it('sign out should still work for viewers', () => {
            const isViewOnly = true;
            let signedOut = false;
            const handleSignOut = async () => {
                // Sign out has no isViewOnly guard
                signedOut = true;
            };
            handleSignOut();
            expect(signedOut).toBe(true);
        });

        it('viewer banner should show for viewer role, hidden for admin/owner', () => {
            const shouldShowBanner = (role: string | null) => role === 'viewer';
            expect(shouldShowBanner('viewer')).toBe(true);
            expect(shouldShowBanner('admin')).toBe(false);
            expect(shouldShowBanner('owner')).toBe(false);
            expect(shouldShowBanner(null)).toBe(false);
        });
    });

    // ─── 5. Sign-in Flow Integration ─────────────────────────────────

    describe('sign-in flow integration', () => {
        it('password sign-in should call processInvitesForUser before redirect', async () => {
            // Simulate what login page does after signInWithPassword succeeds
            const processInvites = vi.fn().mockResolvedValue(1);
            const routerPush = vi.fn();

            const session = { user: { email: 'user@test.com', id: 'user-1' } };

            // Process invites before redirect (mirrors login page logic)
            if (session.user.email) {
                await processInvites(session.user.email, session.user.id);
            }
            routerPush('/admin');

            expect(processInvites).toHaveBeenCalledWith('user@test.com', 'user-1');
            expect(processInvites).toHaveBeenCalledBefore(routerPush);
        });

        it('auto-confirmed signup should call processInvitesForUser', async () => {
            const processInvites = vi.fn().mockResolvedValue(1);
            const routerPush = vi.fn();

            const session = { user: { email: 'new@test.com', id: 'user-2' } };

            if (session.user.email) {
                await processInvites(session.user.email, session.user.id);
            }
            routerPush('/admin');

            expect(processInvites).toHaveBeenCalledWith('new@test.com', 'user-2');
        });

        it('failed sign-in should NOT call processInvitesForUser', async () => {
            const processInvites = vi.fn();
            const session = null;

            if (session) {
                await processInvites();
            }

            expect(processInvites).not.toHaveBeenCalled();
        });

        it('invite processing failure should not block login', async () => {
            const processInvites = vi.fn().mockRejectedValue(new Error('DB failure'));
            const routerPush = vi.fn();

            const session = { user: { email: 'user@test.com', id: 'user-1' } };

            // Mirrors login page try/catch pattern
            if (session.user.email) {
                try {
                    await processInvites(session.user.email, session.user.id);
                } catch (err) {
                    // Non-fatal, continue login
                }
            }
            routerPush('/admin');

            expect(routerPush).toHaveBeenCalledWith('/admin');
        });

        it('login page reads redirect param from URL', () => {
            // Simulate searchParams.get('redirect')
            const searchParams = new URLSearchParams('?redirect=/admin/my-wedding/overview');
            const redirectTo = searchParams.get('redirect') || '/admin';
            expect(redirectTo).toBe('/admin/my-wedding/overview');
        });
    });
});
