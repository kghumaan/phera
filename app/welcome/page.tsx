'use client';

import { Box, Stack, Typography, CircularProgress } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import MicRoundedIcon from '@mui/icons-material/MicRounded';
import EditNoteRoundedIcon from '@mui/icons-material/EditNoteRounded';
import { PheraCard } from '@/components/shared/Card';
import { PheraChip } from '@/components/shared/Chip';
import { PrimaryActionButton, SecondaryActionButton } from '@/components/admin/ActionButton';
import { COLORS } from '@/lib/theme/tokens';

export default function WelcomePage() {
  const router = useRouter();
  // Which path is being set up — drives the in-button "Setting up…" state.
  const [pending, setPending] = useState<null | 'ai' | 'manual'>(null);
  const [error, setError] = useState<string | null>(null);

  const startWithAI = async () => {
    setPending('ai');
    setError(null);
    try {
      const res = await fetch('/api/agent/onboard/start', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.slug) {
        setError(data.error ?? 'Something went wrong — try again.');
        setPending(null);
        return;
      }
      router.push(`/admin/${data.slug}/assistant?welcome=1`);
    } catch {
      setError('Something went wrong — try again.');
      setPending(null);
    }
  };

  const startManual = () => {
    setPending('manual');
    router.push('/onboarding');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: COLORS.bg.paper,
        p: 3,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 760 }}>
        <Stack spacing={1} alignItems="center" mb={4} textAlign="center">
          <Typography variant="h1" sx={{ fontSize: '2.5rem', color: COLORS.text.strong }}>
            Let&apos;s get started
          </Typography>
          <Typography variant="body1" sx={{ color: COLORS.text.muted, maxWidth: 520 }}>
            Want to chat with our AI planner over voice, or prefer to set things up yourself?
          </Typography>
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="stretch">
          {/* Primary: AI setup */}
          <PheraCard
            variant="feature"
            sx={{
              flex: 1,
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              border: `2px solid ${COLORS.brand.primary}`,
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
              <Stack direction="row" spacing={1} alignItems="center">
                <AutoAwesomeRoundedIcon sx={{ color: COLORS.brand.primary }} />
                <MicRoundedIcon sx={{ color: COLORS.brand.primary }} />
              </Stack>
              <PheraChip tone="brand" size="small" label="Recommended" />
            </Stack>
            <Typography variant="h6" sx={{ color: COLORS.text.strong }}>
              Set up with your AI planner
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.text.muted, flex: 1 }}>
              Tell us where you are so far — your venue, vendors, and what you still need. We&apos;ll
              fill the gaps, from RSVPs and your guest list to room assignments, transportation, and
              your wedding website, and flag things you might not have thought of. Think of it as your
              personal planner in your pocket.
            </Typography>
            <PrimaryActionButton
              onClick={startWithAI}
              disabled={pending !== null}
              startIcon={
                pending === 'ai' ? <CircularProgress size={16} sx={{ color: COLORS.text.inverse }} /> : undefined
              }
              fullWidth
            >
              {pending === 'ai' ? 'Setting up your wedding…' : 'Start with AI'}
            </PrimaryActionButton>
          </PheraCard>

          {/* Secondary: manual form */}
          <PheraCard
            variant="muted"
            sx={{ flex: 1, p: 3, display: 'flex', flexDirection: 'column', gap: 2, border: `1px solid ${COLORS.text.strong}` }}
          >
            <EditNoteRoundedIcon sx={{ color: COLORS.text.subtle }} />
            <Typography variant="h6" sx={{ color: COLORS.text.strong }}>
              Fill it out myself
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.text.muted, flex: 1 }}>
              Prefer forms? Walk through the classic step-by-step setup and enter
              everything manually. You can switch to the AI planner anytime.
            </Typography>
            <SecondaryActionButton
              onClick={startManual}
              disabled={pending !== null}
              startIcon={
                pending === 'manual' ? <CircularProgress size={16} sx={{ color: COLORS.brand.primary }} /> : undefined
              }
              fullWidth
            >
              {pending === 'manual' ? 'Setting up your wedding…' : 'Use the manual setup'}
            </SecondaryActionButton>
          </PheraCard>
        </Stack>

        <Typography
          variant="caption"
          sx={{ display: 'block', textAlign: 'center', color: COLORS.text.subtle, mt: 2.5, maxWidth: 560, mx: 'auto' }}
        >
          Chatting with your planner is completely free. If something needs a premium upgrade, we&apos;ll
          let you know up front, before you get deep into it.
        </Typography>

        {error && (
          <Typography variant="body2" sx={{ color: COLORS.accent.dangerText, mt: 2, textAlign: 'center' }}>
            {error}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
