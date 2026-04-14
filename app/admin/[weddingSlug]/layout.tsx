'use client';

import { Box, CircularProgress, Backdrop } from '@mui/material';
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
  }, [pathname]);

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
                bgcolor: 'white',
                p: { xs: 2, md: 4 },
                pt: { xs: `calc(${TOP_NAV_HEIGHT.xs} + 24px)`, md: `calc(${TOP_NAV_HEIGHT.md} + 32px)` }, // Shift internal content down to clear fixed Top Nav + extra spacing
                height: '100%',
                overflowY: 'auto', // Scrollable form area
                position: 'relative',
                borderRight: '1px solid rgba(0, 0, 0, 0.04)',
              }}
            >
              {children}

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
                <CircularProgress sx={{ color: '#DE3F5E' }} />
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
                    bgcolor: '#f8f7f5', // Ensure background extends to top behind nav
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

      {/* Demo tour overlay */}
      {showTour && <DemoTour weddingSlug={weddingSlug} />}

      {/* Plan loading guard - show full page backdrop if plan is still loading */}
      <Backdrop
        open={isLoadingPlan}
        sx={{
          color: '#DE3F5E',
          zIndex: (theme) => theme.zIndex.drawer + 2, // Highest priority
          bgcolor: 'white', // Solid white background for initial load
        }}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      <ViewerBanner />
    </NavigationGuardProvider>
    </AutoSaveProvider>
    </AdminRoleProvider>
  );
}
