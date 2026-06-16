'use client';

import { Box } from '@mui/material';
import { use } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHeading } from '@/components/shared/PageHeading';
import { AgentChatPanel } from '@/components/agent/AgentChatPanel';

export default function AssistantPage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);
  const searchParams = useSearchParams();
  const isWelcome = searchParams.get('welcome') === '1';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <PageHeading
        title="Planner"
        subtitle="Your AI wedding planner — ask anything, change anything. It works with the same data as every page here."
      />
      <Box sx={{ mt: 2, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <AgentChatPanel weddingSlug={weddingSlug} onboarding={isWelcome} />
      </Box>
    </Box>
  );
}
