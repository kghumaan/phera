'use client';

import { Box, Stack, Typography, CircularProgress } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { PrimaryActionButton } from '@/components/admin/ActionButton';
import { COLORS } from '@/lib/theme/tokens';

/**
 * Post-signup landing. We no longer show an AI-vs-manual choice — every new
 * couple goes straight to the planner chat. This page just spins up their
 * wedding (via the agent onboard endpoint) and forwards into the assistant.
 */
export default function WelcomePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  const start = async () => {
    setError(null);
    try {
      const res = await fetch('/api/agent/onboard/start', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.slug) {
        setError(data.error ?? 'Something went wrong setting up your wedding — try again.');
        return;
      }
      router.replace(`/admin/${data.slug}/assistant?welcome=1`);
    } catch {
      setError('Something went wrong setting up your wedding — try again.');
    }
  };

  useEffect(() => {
    if (startedRef.current) return; // Strict-mode double-mount guard.
    startedRef.current = true;
    void start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      <Stack spacing={2.5} alignItems="center" textAlign="center" sx={{ maxWidth: 420 }}>
        {error ? (
          <>
            <Typography variant="h6" sx={{ color: COLORS.text.strong }}>
              We hit a snag
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.accent.dangerText }}>
              {error}
            </Typography>
            <PrimaryActionButton
              onClick={() => {
                startedRef.current = true;
                void start();
              }}
            >
              Try again
            </PrimaryActionButton>
          </>
        ) : (
          <>
            <CircularProgress sx={{ color: COLORS.brand.primary }} />
            <Typography variant="h6" sx={{ color: COLORS.text.strong }}>
              Setting up your wedding…
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.text.muted }}>
              One moment — taking you to your planner.
            </Typography>
          </>
        )}
      </Stack>
    </Box>
  );
}
