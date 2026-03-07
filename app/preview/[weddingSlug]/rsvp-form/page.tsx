'use client';

import { use } from 'react';
import { WeddingProvider } from '@/lib/contexts/WeddingContext';
import CustomRSVPForm from '@/components/guest/CustomRSVPForm';

export default function PreviewRSVPFormPage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);

  return (
    <WeddingProvider weddingSlug={weddingSlug}>
      <CustomRSVPForm weddingId={weddingSlug} />
    </WeddingProvider>
  );
}
