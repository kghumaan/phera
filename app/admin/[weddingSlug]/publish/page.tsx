'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PublishPage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);
  const router = useRouter();

  useEffect(() => {
    // Redirect to settings - publish is now in the preview header
    router.replace(`/admin/${weddingSlug}/settings`);
  }, [weddingSlug, router]);

  return null;
}
