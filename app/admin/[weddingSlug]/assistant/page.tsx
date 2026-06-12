'use client';

import { Box } from '@mui/material';
import { use } from 'react';
import { PageHeading } from '@/components/shared/PageHeading';
import { AgentChatPanel } from '@/components/agent/AgentChatPanel';

export default function AssistantPage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <PageHeading
        title="Planner"
        subtitle="Your AI wedding planner — ask anything, change anything. It works with the same data as every page here."
      />
      <AgentChatPanel weddingSlug={weddingSlug} />
    </Box>
  );
}
