'use client';

import { Box, Stack, Typography, CircularProgress } from '@mui/material';
import { LockOutlined, MenuBook } from '@mui/icons-material';
import { use, useState, useEffect } from 'react';
import { usePlan } from '@/lib/contexts/PlanContext';
import { useAdminRole } from '@/lib/contexts/AdminRoleContext';
import { supabase } from '@/lib/supabase/client';
import UpgradeModal from '@/components/admin/UpgradeModal';
import ConciergeKnowledgeBase from '@/components/admin/concierge/ConciergeKnowledgeBase';
import { PageHeading } from '@/components/shared/PageHeading';
import { PrimaryActionButton } from '@/components/admin/ActionButton';
import { COLORS, RADII } from '@/lib/theme/tokens';

export default function KnowledgeBankPage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);
  const { isPro } = usePlan();
  const { isViewOnly } = useAdminRole();
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  const isDemo = weddingSlug.startsWith('demo');

  useEffect(() => {
    if (!isPro && !isDemo) return;
    (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- weddings table not in generated types
      const { data } = await (supabase as any)
        .from('weddings')
        .select('id')
        .eq('slug', weddingSlug)
        .single();
      if (data?.id) setWeddingId(data.id);
    })();
  }, [isPro, isDemo, weddingSlug]);

  // ─── Free user → blurred mock + upgrade CTA ───
  if (!isPro && !isDemo) {
    return (
      <Box sx={{ maxWidth: 1000 }}>
        <Stack spacing={3}>
          <PageHeading
            title="Knowledge Bank"
            subtitle="The brain behind your WhatsApp Concierge — local guides, dietary notes, dress codes, and anything else your guests might ask"
            actions={
              <PrimaryActionButton
                startIcon={<MenuBook />}
                onClick={() => setUpgradeModalOpen(true)}
                sx={{ px: 3, py: 1.25, fontSize: '0.9rem' }}
              >
                Upgrade to Pro
              </PrimaryActionButton>
            }
          />
          <Box sx={{ maxWidth: 640 }}>
            <Typography variant="body2" sx={{ color: COLORS.text.muted, lineHeight: 1.7 }}>
              Your Knowledge Bank powers the Guest Concierge — a 24/7 WhatsApp assistant that answers your guests&apos; questions. Upgrade to Pro to populate it from your wedding details and let our bot handle the rest.
            </Typography>
          </Box>
          <Box
            sx={{
              position: 'relative',
              minHeight: 320,
              borderRadius: RADII.lg,
              overflow: 'hidden',
              bgcolor: COLORS.bg.subtle,
              border: `1px solid ${COLORS.border.faint}`,
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
              }}
            >
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  bgcolor: COLORS.bg.white,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <LockOutlined sx={{ fontSize: 26, color: COLORS.brand.primary }} />
              </Box>
              <PrimaryActionButton
                startIcon={<MenuBook />}
                onClick={() => setUpgradeModalOpen(true)}
                sx={{
                  px: 3.5,
                  py: 1.5,
                  fontSize: '0.95rem',
                  boxShadow: '0 4px 20px rgba(222,63,94,0.35)',
                }}
              >
                Unlock Knowledge Bank
              </PrimaryActionButton>
            </Box>
          </Box>
        </Stack>
        <UpgradeModal open={upgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} />
      </Box>
    );
  }

  // ─── Pro / demo user ───
  return (
    <Box sx={{ maxWidth: 1000 }}>
      <Stack spacing={3}>
        <PageHeading
          title="Knowledge Bank"
          subtitle="The brain behind your WhatsApp Concierge"
        />
        <Typography variant="body2" sx={{ color: COLORS.text.muted, lineHeight: 1.7 }}>
          We watch for changes to your wedding location, dates, and plans, and auto-refresh this data so your bot always responds with the correct information for your guests. Add or regenerate any time.
        </Typography>
        {weddingId ? (
          <ConciergeKnowledgeBase weddingId={weddingId} isViewOnly={isViewOnly} />
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
            <CircularProgress size={28} sx={{ color: COLORS.brand.primary }} />
          </Box>
        )}
      </Stack>
    </Box>
  );
}
