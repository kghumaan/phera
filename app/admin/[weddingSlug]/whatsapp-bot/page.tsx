'use client';

/**
 * WhatsApp Bot — unified surface that replaces the old Messaging + Guest
 * Concierge pages. Two tabs:
 *   1. Messaging      — template grid + recent campaigns (lifted from
 *                       /messaging). Send via personal WhatsApp (wa.me) or
 *                       Phera bot (Concierge). Both work for everyone; the
 *                       Concierge send-path is what surfaces collected data.
 *   2. Conversations  — every chat the bot has had with a guest.
 *
 * Knowledge Bank is its own page under Planning — not part of this stack.
 */

import {
  Box,
  Stack,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  Paper,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  WhatsApp,
  PhoneAndroid,
  ContentCopy,
  CheckCircleOutline,
  LockOutlined,
} from '@mui/icons-material';
import { use, useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePlan } from '@/lib/contexts/PlanContext';
import { supabase } from '@/lib/supabase/client';
import UpgradeModal from '@/components/admin/UpgradeModal';
import ConciergeConversations from '@/components/admin/concierge/ConciergeConversations';
import MessagingTab from '@/components/admin/whatsapp-bot/MessagingTab';
import AdminTab from '@/components/admin/whatsapp-bot/AdminTab';
import { PageHeading } from '@/components/shared/PageHeading';
import { PrimaryActionButton } from '@/components/admin/ActionButton';
import { COLORS, RADII } from '@/lib/theme/tokens';

export default function WhatsAppBotPage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  return (
    <Suspense fallback={<PageSpinner />}>
      <WhatsAppBotPageContent params={params} />
    </Suspense>
  );
}

function PageSpinner() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
      <CircularProgress size={28} sx={{ color: COLORS.brand.primary }} />
    </Box>
  );
}

function WhatsAppBotPageContent({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);
  const { isPro } = usePlan();
  const isDemo = weddingSlug.startsWith('demo');
  const searchParams = useSearchParams();

  const [tab, setTab] = useState(0);
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [conciergePhone, setConciergePhone] = useState<string>('');
  const [phoneCopied, setPhoneCopied] = useState(false);
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  // Resolve wedding UUID — needed by the Conversations tab.
  useEffect(() => {
    (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- weddings table not in generated types
      const { data } = await (supabase as any)
        .from('weddings')
        .select('id')
        .eq('slug', weddingSlug)
        .single();
      if (data?.id) setWeddingId(data.id);
    })();
  }, [weddingSlug]);

  // Phone number for the bot — same env-driven number Concierge used to show.
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/vendors/coordinator-info');
        if (!res.ok) return;
        const data = await res.json();
        if (data?.phoneNumber) setConciergePhone(data.phoneNumber);
      } catch {
        /* best-effort */
      }
    })();
  }, []);

  // ?guest=<id> deep link → Conversations tab + preselect guest.
  useEffect(() => {
    const guestParam = searchParams.get('guest');
    if (guestParam) {
      setSelectedGuestId(guestParam);
      setTab(1);
    }
  }, [searchParams]);

  const handleCopyPhone = async () => {
    if (!conciergePhone) return;
    try {
      await navigator.clipboard.writeText(conciergePhone);
      setPhoneCopied(true);
      setTimeout(() => setPhoneCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const conversationsLocked = !isPro && !isDemo;

  return (
    <Box sx={{ width: '100%' }}>
      <PageHeading
        title="Communications"
        subtitle="Your guest concierge and messaging hub — send updates and reminders, and let the bot handle every guest reply 24/7."
        actions={
          conciergePhone ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <Tooltip
                title="Guests message this number. The bot answers from this line 24/7."
                arrow
              >
                <Paper
                  elevation={0}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 2,
                    py: 0.75,
                    bgcolor: COLORS.bg.subtle,
                    borderRadius: 1,
                    border: '1px solid rgba(0,0,0,0.07)',
                    cursor: 'help',
                  }}
                >
                  <PhoneAndroid sx={{ fontSize: 18, color: COLORS.text.subtle }} />
                  <Typography variant="subtitle2" sx={{ color: COLORS.text.strong, letterSpacing: 0.5 }}>
                    {conciergePhone}
                  </Typography>
                </Paper>
              </Tooltip>
              <Tooltip title={phoneCopied ? 'Copied!' : 'Copy bot number'} arrow>
                <IconButton
                  size="small"
                  onClick={handleCopyPhone}
                  sx={{ color: phoneCopied ? COLORS.accent.success : COLORS.text.subtle }}
                >
                  {phoneCopied ? <CheckCircleOutline fontSize="small" /> : <ContentCopy fontSize="small" />}
                </IconButton>
              </Tooltip>
            </Stack>
          ) : undefined
        }
      />

      <Tabs
        value={tab}
        onChange={(_, val) => {
          setTab(val);
          if (val !== 1) setSelectedGuestId(null);
        }}
        sx={{
          mt: 2,
          '& .MuiTab-root': {
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.9rem',
            color: COLORS.text.subtle,
            minHeight: 42,
            '&.Mui-selected': { color: COLORS.brand.primary },
          },
          '& .MuiTabs-indicator': { backgroundColor: COLORS.brand.primary },
        }}
      >
        <Tab label="Messaging" />
        <Tab label="Conversations" />
        <Tab label="Admin" />
      </Tabs>

      {tab === 0 && (
        <Box sx={{ mt: 3 }}>
          <MessagingTab weddingSlug={weddingSlug} />
        </Box>
      )}

      {tab === 1 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" sx={{ color: COLORS.text.subtle, mb: 2 }}>
            All the interactions your guests have had with your bot.
          </Typography>
          {conversationsLocked ? (
            <ConversationsLockedView onUpgradeClick={() => setUpgradeOpen(true)} />
          ) : weddingId ? (
            <ConciergeConversations weddingId={weddingId} initialGuestId={selectedGuestId} />
          ) : (
            <PageSpinner />
          )}
        </Box>
      )}

      {tab === 2 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" sx={{ color: COLORS.text.subtle, mb: 2 }}>
            A WhatsApp bot for the couple — let trusted numbers update the website, knowledge bank, and task manager just by texting.
          </Typography>
          <AdminTab weddingSlug={weddingSlug} />
        </Box>
      )}

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </Box>
  );
}

function ConversationsLockedView({ onUpgradeClick }: { onUpgradeClick: () => void }) {
  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: 280,
        borderRadius: RADII.lg,
        overflow: 'hidden',
        bgcolor: COLORS.bg.subtle,
        border: `1px solid ${COLORS.border.faint}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Stack spacing={2} alignItems="center" sx={{ py: 6, px: 3, textAlign: 'center', maxWidth: 420 }}>
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
        <Typography variant="body2" sx={{ color: COLORS.text.muted, lineHeight: 1.65 }}>
          Conversations is part of the Phera bot — upgrade to Pro to see every chat your guests have with the WhatsApp number.
        </Typography>
        <PrimaryActionButton
          startIcon={<WhatsApp />}
          onClick={onUpgradeClick}
          sx={{ px: 3.5, py: 1.5, fontSize: '0.95rem', boxShadow: '0 4px 20px rgba(222,63,94,0.35)' }}
        >
          Upgrade to Pro
        </PrimaryActionButton>
      </Stack>
    </Box>
  );
}
