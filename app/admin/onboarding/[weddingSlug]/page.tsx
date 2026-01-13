'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';

export default function OnboardingHomePage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const router = useRouter();
  const { weddingSlug } = use(params);

  useEffect(() => {
    // Redirect to overview section by default
    router.push(`/admin/onboarding/${weddingSlug}/overview`);
  }, [weddingSlug, router]);

  return null;
}

