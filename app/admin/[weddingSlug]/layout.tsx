'use client';

import { Box, CircularProgress, Backdrop } from '@mui/material';
import OnboardingSidebar from '@/components/admin/OnboardingSidebar';
import OnboardingPreviewFAB from '@/components/admin/OnboardingPreviewFAB';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import { use, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { weddingService, Wedding } from '@/lib/supabase/wedding-service';

export default function OnboardingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ weddingSlug: string }>;
}) {
  const { weddingSlug } = use(params);
  const [wedding, setWedding] = useState<Wedding | undefined>(undefined);
  const [isNavigating, setIsNavigating] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const fetchWedding = async () => {
      const weddingData = await weddingService.getWeddingBySlug(weddingSlug);
      if (weddingData) {
        setWedding(weddingData);
      }
    };
    fetchWedding();
  }, [weddingSlug]);

  // Reset navigating state when pathname changes
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  const handleStatusChange = async (newStatus: 'draft' | 'live') => {
    if (wedding) {
      setWedding({ ...wedding, status: newStatus });
    }
  };

  const handleSlugChange = async (newSlug: string) => {
    if (wedding) {
      setWedding({ ...wedding, slug: newSlug });
    }
  };

  return (
    <OptimizedBackground useAppDefault={true} className="min-h-screen flex flex-col">
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <OnboardingSidebar 
          weddingSlug={weddingSlug} 
          wedding={wedding} 
          onNavigating={setIsNavigating}
        />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, md: 2 },
            pt: { xs: 4, md: 8 },
            minHeight: '100vh',
            position: 'relative',
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
      </Box>

      {/* Preview FAB - accessible from all onboarding pages */}
      <OnboardingPreviewFAB
        weddingSlug={wedding?.slug || weddingSlug}
        coupleName={wedding?.couple_name}
        weddingStatus={wedding?.status as 'draft' | 'live' | undefined}
        weddingId={wedding?.id}
        onStatusChange={handleStatusChange}
        onSlugChange={handleSlugChange}
      />
    </OptimizedBackground>
  );
}

