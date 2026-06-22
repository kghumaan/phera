'use client';

import { Box, Stack, Typography, CircularProgress } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import MicRoundedIcon from '@mui/icons-material/MicRounded';
import EditNoteRoundedIcon from '@mui/icons-material/EditNoteRounded';
import { PheraCard } from '@/components/shared/Card';
import { PrimaryActionButton, SecondaryActionButton } from '@/components/admin/ActionButton';
import { COLORS } from '@/lib/theme/tokens';

export default function WelcomePage() {
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startWithAI = async () => {
    setStarting(true);
    setError(null);
    try {
      const res = await fetch('/api/agent/onboard/start', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.slug) {
        setError(data.error ?? 'Something went wrong — try again.');
        setStarting(false);
        return;
      }
      router.push(`/admin/${data.slug}/assistant?welcome=1`);
    } catch {
      setError('Something went wrong — try again.');
      setStarting(false);
    }
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
            Two ways to set up your wedding. Talk to your AI planner, or fill it out yourself.
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
            <Stack direction="row" spacing={1} alignItems="center">
              <AutoAwesomeRoundedIcon sx={{ color: COLORS.brand.primary }} />
              <MicRoundedIcon sx={{ color: COLORS.brand.primary }} />
            </Stack>
            <Typography variant="h6" sx={{ color: COLORS.text.strong }}>
              Set up with your AI planner
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.text.muted, flex: 1 }}>
              Tell it your names, dates, and venue out loud or by typing. It builds your
              schedule, guest list, and more as you talk — and asks the smart questions a
              real planner would. <strong>Recommended.</strong>
            </Typography>
            <PrimaryActionButton onClick={startWithAI} loading={starting} disabled={starting} fullWidth>
              Start with AI
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
            <SecondaryActionButton onClick={() => router.push('/onboarding')} disabled={starting} fullWidth>
              Use the manual setup
            </SecondaryActionButton>
          </PheraCard>
        </Stack>

        {error && (
          <Typography variant="body2" sx={{ color: COLORS.accent.dangerText, mt: 2, textAlign: 'center' }}>
            {error}
          </Typography>
        )}

        {starting && (
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" mt={2}>
            <CircularProgress size={16} sx={{ color: COLORS.brand.primary }} />
            <Typography variant="caption" sx={{ color: COLORS.text.subtle }}>
              Setting up your wedding…
            </Typography>
          </Stack>
        )}
      </Box>
    </Box>
  );
}
