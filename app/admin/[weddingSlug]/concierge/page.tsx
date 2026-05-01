'use client';

/**
 * Guest Concierge was folded into the unified WhatsApp Bot page. This route
 * stays around as a thin redirect so existing bookmarks (e.g. ?guest=<id>
 * deep links from Guest Responses) keep working — query params are
 * preserved through the replace.
 */

import { useEffect, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';
import { COLORS } from '@/lib/theme/tokens';

export default function ConciergeRedirect({
  params,
}: {
  params: Promise<{ weddingSlug: string }>;
}) {
  const { weddingSlug } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const qs = searchParams?.toString();
    const target = `/admin/${weddingSlug}/whatsapp-bot${qs ? `?${qs}` : ''}`;
    router.replace(target);
  }, [router, weddingSlug, searchParams]);

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
      <CircularProgress size={28} sx={{ color: COLORS.brand.primary }} />
    </Box>
  );
}
