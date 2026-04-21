'use client';

import { Box, CircularProgress, Backdrop, IconButton, Typography } from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import OnboardingSidebar, { groups } from '@/components/admin/OnboardingSidebar';
import AdminTopNav from '@/components/admin/AdminTopNav';
import AdminPreviewPanel from '@/components/admin/AdminPreviewPanel';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import DemoTour from '@/components/demo/DemoTour';
import { usePlan } from '@/lib/contexts/PlanContext';
import { use, useState, useEffect, useMemo, Suspense } from 'react';
import { usePathname, useSearchParams, useRouter, notFound } from 'next/navigation';
import { weddingService, Wedding } from '@/lib/supabase/wedding-service';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import { AdminRoleProvider, AdminRole } from '@/lib/contexts/AdminRoleContext';
import { NavigationGuardProvider } from '@/lib/contexts/NavigationGuardContext';
import { AutoSaveProvider } from '@/lib/contexts/AutoSaveContext';
import ViewerBanner from '@/components/admin/ViewerBanner';
import { COLORS, RADII } from '@/lib/theme/tokens';

export default function OnboardingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ weddingSlug: string }>;
}) {
  return (
    <Suspense>
      <OnboardingLayoutContent params={params}>
        {children}
      </OnboardingLayoutContent>
    </Suspense>
  );
}

function OnboardingLayoutContent({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ weddingSlug: string }>;
}) {
  const { weddingSlug } = use(params);
  const { isLoading: isLoadingPlan } = usePlan();
  const router = useRouter();
  const [wedding, setWedding] = useState<Wedding | undefined>(undefined);
  const [isLoadingWedding, setIsLoadingWedding] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const [isPlanner, setIsPlanner] = useState(false);
  const [adminRole, setAdminRole] = useState<AdminRole>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const showTour = searchParams.get('tour') === 'true'
    || (typeof window !== 'undefined' && sessionStorage.getItem('demo-tour-step') !== null);

  const { user: authUser, isLoading: isLoadingAuth } = useAuth();

  // Extract the current sidebar item path (e.g., '/schedule', '/faq') from pathname
  const currentAdminPath = useMemo(() => {
    for (const group of groups) {
      const match = group.items.find(item => pathname.endsWith(item.path) || pathname.endsWith(item.path + '/'));
      if (match) return match.path;
    }
    return null;
  }, [pathname]);

  useEffect(() => {
    // Wait for auth to finish loading before doing anything
    if (isLoadingAuth) return;

    const fetchWeddingAndSettings = async () => {
      setIsLoadingWedding(true);

      // For demo routes, ensure the user is signed in as the demo user.
      // If not, redirect to /demo to trigger auto-login.
      // Check Supabase session directly to avoid race condition where
      // AuthContext hasn't received the onAuthStateChange event yet.
      if (weddingSlug.startsWith('demo') && !authUser) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.replace('/demo');
          return;
        }
        // Session exists but AuthContext hasn't caught up yet — skip redirect,
        // the effect will re-run once authUser updates.
        return;
      }

      // Fetch wedding and account type in parallel
      const weddingPromise = weddingService.getWeddingBySlug(weddingSlug);
      const settingsPromise = authUser
        ? supabase
            .from('user_settings')
            .select('account_type')
            .eq('user_id', authUser.id)
            .single()
            .then(({ data }) => data)
        : Promise.resolve(null);

      const [weddingData, settings] = await Promise.all([weddingPromise, settingsPromise]);

      if (weddingData) {
        setWedding(weddingData);

        // Determine admin role for this wedding
        if (authUser) {
          if (weddingData.created_by === authUser.id) {
            setAdminRole('owner');
          } else {
            const { data: adminEntry } = await supabase
              .from('wedding_admins')
              .select('role')
              .eq('wedding_id', weddingData.id)
              .eq('user_id', authUser.id)
              .single();
            setAdminRole((adminEntry?.role as 'admin' | 'viewer') || null);
          }
        }
      }
      if (settings?.account_type === 'planner') {
        setIsPlanner(true);
      }

      setIsLoadingWedding(false);
    };
    fetchWeddingAndSettings();
  }, [weddingSlug, router, authUser, isLoadingAuth]);

  if (!isLoadingWedding && !wedding) {
    notFound();
  }

  // Reset navigating state when pathname changes
  useEffect(() => {
    setIsNavigating(false);
    setMobileOpen(false); // Close sidebar on mobile when navigating
    setMobilePreviewOpen(false); // Collapse preview when switching pages
  }, [pathname]);

  // DemoTour asks us to open/close the mobile drawer so its spotlight can
  // actually land on sidebar items (they're keepMounted but translated
  // off-screen when the drawer is closed).
  useEffect(() => {
    const openHandler = () => setMobileOpen(true);
    const closeHandler = () => setMobileOpen(false);
    window.addEventListener('phera:open-mobile-sidebar', openHandler);
    window.addEventListener('phera:close-mobile-sidebar', closeHandler);
    return () => {
      window.removeEventListener('phera:open-mobile-sidebar', openHandler);
      window.removeEventListener('phera:close-mobile-sidebar', closeHandler);
    };
  }, []);

  const handleStatusChange = async (newStatus: 'draft' | 'live') => {
    if (wedding) {
      try {
        const updatedWedding = await weddingService.updateWedding(wedding.id, { status: newStatus });
        if (updatedWedding) {
          setWedding(updatedWedding);
        }
      } catch (error) {
        console.error('Failed to update status:', error);
      }
    }
  };

  const handleSlugChange = async (newSlug: string) => {
    if (wedding) {
      try {
        const updatedWedding = await weddingService.updateWedding(wedding.id, { slug: newSlug });
        if (updatedWedding) {
          setWedding(updatedWedding);
        }
      } catch (error) {
        console.error('Failed to update slug:', error);
      }
    }
  };

  const TOP_NAV_HEIGHT = { xs: '48px', md: '56px' };

  return (
    <AdminRoleProvider role={adminRole}>
    <AutoSaveProvider>
    <NavigationGuardProvider>
      <OptimizedBackground useAppDefault={true} className="h-screen overflow-hidden">
        <AdminTopNav
          weddingSlug={weddingSlug}
          wedding={wedding}
          onMenuToggle={() => setMobileOpen(!mobileOpen)}
        />

        <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
          {/* Left Sidebar Navigation */}
          <OnboardingSidebar
            weddingSlug={weddingSlug}
            wedding={wedding}
            onNavigating={setIsNavigating}
            weddingStatus={wedding?.status as 'draft' | 'live' | undefined}
            weddingId={wedding?.id}
            onStatusChange={handleStatusChange}
            onSlugChange={handleSlugChange}
            mobileOpen={mobileOpen}
            onClose={() => setMobileOpen(false)}
            isPlanner={isPlanner}
          />

          {/* Main Content Area - Two Column Layout on Desktop */}
          <Box
            sx={{
              flexGrow: 1,
              display: 'flex',
              height: '100%',
              overflow: 'hidden', // Contain scrolling to children
            }}
          >
            {/* Left Column - Form Content (White Background) */}
            <Box
              component="main"
              sx={{
                flex: {
                  xs: 1,
                  lg: (() => {
                    const currentGroup = groups.find(group =>
                      group.items.some(item => pathname.endsWith(item.path) || pathname.endsWith(item.path + '/'))
                    );
                    return currentGroup?.id === 'wedding-website' ? '0 0 55%' : 1;
                  })()
                },
                bgcolor: COLORS.bg.white,
                p: { xs: 2, md: 4 },
                pt: { xs: `calc(${TOP_NAV_HEIGHT.xs} + 8px)`, md: `calc(${TOP_NAV_HEIGHT.md} + 32px)` },
                height: '100%',
                overflowY: 'auto',
                position: 'relative',
                borderRight: '1px solid rgba(0, 0, 0, 0.04)',
                // Mobile-only: tighten typography one notch so the admin dashboard
                // reads like a compact tool, not a marketing page. Desktop unchanged.
                '@media (max-width: 899px)': {
                  '& .MuiTypography-h4': { fontSize: '1.75rem' },
                  '& .MuiTypography-h5': { fontSize: '1.35rem' },
                  '& .MuiTypography-h6': { fontSize: '1.15rem' },
                  '& .MuiTypography-subtitle1': { fontSize: '0.95rem' },
                  '& .MuiTypography-subtitle2': { fontSize: '0.875rem' },
                  '& .MuiTypography-body1': { fontSize: '0.875rem' },
                  '& .MuiTypography-body2': { fontSize: '0.875rem' },
                  '& .MuiButton-root': { fontSize: '0.875rem' },
                  '& .MuiInputBase-input': { fontSize: '0.9375rem' },
                  '& .MuiInputLabel-root': { fontSize: '0.9375rem' },
                },
              }}
            >
              {isLoadingPlan || isLoadingWedding ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress sx={{ color: COLORS.brand.primary }} />
                </Box>
              ) : (
                <>
                  {/* Mobile preview trigger — opens a full-screen overlay (no inline iframe) */}
                  {(() => {
                    const currentGroup = groups.find(group =>
                      group.items.some(item => pathname.endsWith(item.path) || pathname.endsWith(item.path + '/'))
                    );
                    if (currentGroup?.id !== 'wedding-website') return null;
                    return (
                      <Box sx={{ display: { xs: 'block', lg: 'none' }, mb: 2 }}>
                        <Box
                          data-tour="tour-preview"
                          onClick={() => setMobilePreviewOpen(true)}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            bgcolor: COLORS.bg.muted,
                            border: `1px solid ${COLORS.border.faint}`,
                            borderRadius: RADII.md,
                            px: 2,
                            py: 1.25,
                            cursor: 'pointer',
                            transition: 'background-color 0.15s ease',
                            '&:hover': { bgcolor: COLORS.bg.subtle },
                          }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.text.strong }}>
                            Show preview
                          </Typography>
                          <IconButton size="small" sx={{ color: COLORS.text.subtle }}>
                            <ExpandMore sx={{ transform: 'rotate(-90deg)' }} />
                          </IconButton>
                        </Box>
                      </Box>
                    );
                  })()}

                  {children}
                </>
              )}

              {/* Loading overlay */}
              <Backdrop
                open={isNavigating}
                sx={{
                  position: 'absolute',
                  zIndex: 1,
                  bgcolor: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(4px)',
                }}
              >
                <CircularProgress sx={{ color: COLORS.brand.primary }} />
              </Backdrop>
            </Box>

            {/* Right Column - Preview Panel (Off-white Background, Desktop Only) */}
            {(() => {
              const currentGroup = groups.find(group =>
                group.items.some(item => pathname.endsWith(item.path) || pathname.endsWith(item.path + '/'))
              );

              // Only show preview for 'wedding-website' group
              if (currentGroup?.id !== 'wedding-website') {
                return null;
              }

              return (
                <Box
                  sx={{
                    display: { xs: 'none', lg: 'block' },
                    flex: '0 0 45%',
                    height: '100%',
                    overflow: 'hidden',
                    pt: TOP_NAV_HEIGHT, // Shift internal content down to clear fixed Top Nav
                    bgcolor: COLORS.bg.subtle, // Ensure background extends to top behind nav
                  }}
                >
                  <AdminPreviewPanel
                    weddingSlug={wedding?.slug || weddingSlug}
                    weddingId={wedding?.id}
                    hasUnpublishedChanges={wedding?.has_unpublished_changes ?? true}
                    lastPublishedAt={wedding?.last_published_at ?? null}
                    currentAdminPath={currentAdminPath}
                    websiteLayout={wedding?.website_layout}
                    isLive={wedding?.status === 'live'}
                    onPublished={() => {
                      if (wedding) {
                        setWedding({ ...wedding, has_unpublished_changes: false, last_published_at: new Date().toISOString(), status: 'live' });
                      }
                    }}
                  />
                </Box>
              );
            })()}
          </Box>
        </Box>
      </OptimizedBackground>

      {/* Mobile preview overlay — full-screen, only mounts while open so the
          iframe doesn't live-refresh in the background */}
      {mobilePreviewOpen && (() => {
        const currentGroup = groups.find(group =>
          group.items.some(item => pathname.endsWith(item.path) || pathname.endsWith(item.path + '/'))
        );
        if (currentGroup?.id !== 'wedding-website') return null;
        return (
          <Box
            sx={{
              display: { xs: 'block', lg: 'none' },
              position: 'fixed',
              inset: 0,
              zIndex: (theme) => theme.zIndex.modal + 10,
              bgcolor: COLORS.bg.white,
            }}
          >
            <AdminPreviewPanel
              compact
              onClose={() => setMobilePreviewOpen(false)}
              weddingSlug={wedding?.slug || weddingSlug}
              weddingId={wedding?.id}
              hasUnpublishedChanges={wedding?.has_unpublished_changes ?? true}
              lastPublishedAt={wedding?.last_published_at ?? null}
              currentAdminPath={currentAdminPath}
              websiteLayout={wedding?.website_layout}
              isLive={wedding?.status === 'live'}
              onPublished={() => {
                if (wedding) {
                  setWedding({ ...wedding, has_unpublished_changes: false, last_published_at: new Date().toISOString(), status: 'live' });
                }
              }}
            />
          </Box>
        );
      })()}

      {/* Demo tour overlay */}
      {showTour && <DemoTour weddingSlug={weddingSlug} />}

      <ViewerBanner />
    </NavigationGuardProvider>
    </AutoSaveProvider>
    </AdminRoleProvider>
  );
}
