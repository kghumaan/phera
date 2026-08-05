'use client';

import { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { useRouter, usePathname } from 'next/navigation';
import { AgentChatPanel } from '@/components/agent/AgentChatPanel';
import AskPheraFab from '@/components/admin/coordinator/AskPheraFab';
import { COLORS } from '@/lib/theme/tokens';
import { AGENT_TURN_EVENT } from '@/lib/hooks/use-agent-turn-refresh';
import { PAGE_QUESTIONS } from '@/lib/agent/page-questions';

const STORAGE_KEY = 'phera-planner-sidebar-open';

interface AssistantSidebarProps {
  weddingSlug: string;
  /** Layout's fixed top-nav height — the panel pads itself below it. */
  topOffset: { xs: string; md: string };
}

/**
 * Docked Planner chat beside any admin page (desktop only). Renders as the
 * last column of the admin layout's flex row when open, or a floating
 * AutoAwesome FAB when closed. Same conversation as the full /assistant page —
 * AgentChatPanel restores history by wedding slug. No header of its own —
 * AgentChatPanel's compact top bar (current section + expand/close) is the
 * only chrome above the messages.
 */
export default function AssistantSidebar({ weddingSlug, topOffset }: AssistantSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Whatever admin page this is docked beside — suggested questions in the
  // sidebar are about THAT page (e.g. guest-list → "how do I tag guests"),
  // not the wedding-wide ranked starters the full Planner page shows.
  const pageKey = pathname.split('/').filter(Boolean).pop() ?? '';
  const pageQuestions = PAGE_QUESTIONS[pageKey];

  // Hydrate persisted open state after mount (SSR-safe).
  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === '1') setOpen(true);
    } catch {
      // localStorage unavailable — start closed.
    }
  }, []);

  const toggle = (next: boolean) => {
    setOpen(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
    } catch {
      // Non-critical.
    }
  };

  return (
    <>
      {open && (
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            flex: '0 0 420px',
            maxWidth: 420,
            height: '100%',
            pt: topOffset,
            bgcolor: COLORS.bg.white,
            borderLeft: `1px solid ${COLORS.border.faint}`,
            overflow: 'hidden',
          }}
        >
          {/* Chat */}
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              p: 1.5,
            }}
          >
            <AgentChatPanel
              weddingSlug={weddingSlug}
              compact
              minHeight={0}
              onTurnComplete={() => window.dispatchEvent(new CustomEvent(AGENT_TURN_EVENT))}
              onExpand={() => router.push(`/admin/${weddingSlug}/assistant`)}
              onClose={() => toggle(false)}
              pageStarters={pageQuestions}
            />
          </Box>
        </Box>
      )}

      {/* Closed state: floating trigger (desktop only — mobile uses the
          full-page Planner from the nav). */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <AskPheraFab onClick={() => toggle(true)} visible={!open} />
      </Box>
    </>
  );
}
