'use client';

import { Box } from '@mui/material';
import { use } from 'react';
import { useSearchParams } from 'next/navigation';
import { AgentChatPanel } from '@/components/agent/AgentChatPanel';

export default function AssistantPage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);
  const searchParams = useSearchParams();
  const isWelcome = searchParams.get('welcome') === '1';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <AgentChatPanel weddingSlug={weddingSlug} onboarding={isWelcome} />
    </Box>
  );
}
