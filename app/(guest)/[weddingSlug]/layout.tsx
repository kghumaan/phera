'use client';

import { WeddingProvider, useWedding } from '@/lib/contexts/WeddingContext';
import { useParams, notFound } from 'next/navigation';

function WeddingLayoutContent({ children }: { children: React.ReactNode }) {
  const { error, isLoading } = useWedding();
  
  if (!isLoading && error === 'Wedding not found') {
    notFound();
  }
  
  return <>{children}</>;
}

export default function WeddingLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const weddingSlug = params.weddingSlug as string;

  return (
    <WeddingProvider weddingSlug={weddingSlug} mode="live">
      <WeddingLayoutContent>
        {children}
      </WeddingLayoutContent>
    </WeddingProvider>
  );
}
