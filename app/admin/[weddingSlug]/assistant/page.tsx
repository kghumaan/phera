'use client';

import { Box } from '@mui/material';
import { use } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHeading } from '@/components/shared/PageHeading';
import { AgentChatPanel } from '@/components/agent/AgentChatPanel';

const ONBOARDING_GREETING =
  "Hi! I just signed up and I'm setting up my wedding for the first time. Help me get started.";

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
      <AgentChatPanel weddingSlug={weddingSlug} autoGreet={isWelcome ? ONBOARDING_GREETING : undefined} />
    </Box>
  );
}
