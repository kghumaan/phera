'use client';

/**
 * Messaging was folded into the unified WhatsApp Bot page. This route stays
 * around as a thin redirect so existing bookmarks, deep links, and templates
 * referencing /messaging keep working.
 */

import { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';
import { COLORS } from '@/lib/theme/tokens';

export default function MessagingRedirect({
  params,
}: {
  params: Promise<{ weddingSlug: string }>;
}) {
  const { weddingSlug } = use(params);
  const router = useRouter();

  useEffect(() => {
    router.replace(`/admin/${weddingSlug}/whatsapp-bot`);
  }, [router, weddingSlug]);

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
      <CircularProgress size={28} sx={{ color: COLORS.brand.primary }} />
    </Box>
  );
}
