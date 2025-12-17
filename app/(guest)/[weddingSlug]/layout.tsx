'use client';

import { WeddingProvider } from '@/lib/contexts/WeddingContext';
import { useParams } from 'next/navigation';

export default function WeddingLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const weddingSlug = params.weddingSlug as string;

  return (
    <WeddingProvider weddingSlug={weddingSlug}>
      {children}
    </WeddingProvider>
  );
}
