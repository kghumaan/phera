'use client';

import { Box, CircularProgress, Backdrop } from '@mui/material';
import OnboardingSidebar, { groups } from '@/components/admin/OnboardingSidebar';
import AdminTopNav from '@/components/admin/AdminTopNav';
import AdminPreviewPanel from '@/components/admin/AdminPreviewPanel';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import { usePlan } from '@/lib/contexts/PlanContext';
import { use, useState, useEffect } from 'react';
import { usePathname, notFound } from 'next/navigation';
import { weddingService, Wedding } from '@/lib/supabase/wedding-service';

export default function OnboardingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ weddingSlug: string }>;
}) {
  const { weddingSlug } = use(params);
  const { isLoading: isLoadingPlan } = usePlan();
  const [wedding, setWedding] = useState<Wedding | undefined>(undefined);
  const [isLoadingWedding, setIsLoadingWedding] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const fetchWedding = async () => {
      setIsLoadingWedding(true);
      const weddingData = await weddingService.getWeddingBySlug(weddingSlug);
      if (weddingData) {
        setWedding(weddingData);
      }
      setIsLoadingWedding(false);
    };
    fetchWedding();
  }, [weddingSlug]);

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

  const TOP_NAV_HEIGHT = { xs: '56px', md: '64px' };

  return (
    <>
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
                    return currentGroup?.id === 'website' ? '0 0 55%' : 1;
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

              // Only show preview for 'website' group
              if (currentGroup?.id !== 'website') {
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
                  <AdminPreviewPanel weddingSlug={wedding?.slug || weddingSlug} />
                </Box>
              );
            })()}
          </Box>
        </Box>
      </OptimizedBackground>

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
    </>
  );
}
