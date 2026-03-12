'use client';

import { use } from 'react';
import { WeddingProvider, useWedding } from '@/lib/contexts/WeddingContext';
import CustomRSVPForm from '@/components/guest/CustomRSVPForm';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import { Box } from '@mui/material';

function RSVPFormContent({ weddingSlug }: { weddingSlug: string }) {
  const { wedding } = useWedding();

  return (
    <OptimizedBackground
      src={wedding?.background_image || undefined}
      useAppDefault={!wedding?.background_image}
    >
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <CustomRSVPForm weddingId={weddingSlug} />
      </Box>
    </OptimizedBackground>
  );
}

export default function PreviewRSVPFormPage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);

  return (
    <WeddingProvider weddingSlug={weddingSlug}>
      <RSVPFormContent weddingSlug={weddingSlug} />
    </WeddingProvider>
  );
}
