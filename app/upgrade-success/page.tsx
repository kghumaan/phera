'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Box, Typography, CircularProgress } from '@mui/material';
import { CheckCircle, ErrorOutline } from '@mui/icons-material';
import { COLORS, RADII } from '@/lib/theme/tokens';

export default function UpgradeSuccessPage() {
  return (
    <Suspense>
      <UpgradeSuccessContent />
    </Suspense>
  );
}

function UpgradeSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session_id');
  const returnPath = searchParams.get('return_path');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [tier, setTier] = useState<string>('pro');

  useEffect(() => {
    if (!sessionId) {
      router.replace(returnPath || '/');
      return;
    }

    const verifyAndUpgrade = async () => {
      try {
        const res = await fetch('/api/stripe/activate-pro', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
        const data = await res.json();

        if (res.ok && data.success) {
          if (data.tier) setTier(data.tier);
          setStatus('success');
          setTimeout(() => {
            router.replace(returnPath || '/admin');
          }, 2500);
        } else {
          console.error('Upgrade error:', data.error);
          setStatus('error');
          setTimeout(() => {
            router.replace(returnPath || '/admin');
          }, 3000);
        }
      } catch (err) {
        console.error('Error verifying upgrade:', err);
        setStatus('error');
        setTimeout(() => {
          router.replace(returnPath || '/admin');
        }, 3000);
      }
    };

    verifyAndUpgrade();
  }, [sessionId]);

  const isPlanner = tier === 'planner';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        bgcolor: 'white',
      }}
    >
      {status === 'loading' && (
        <>
          <CircularProgress sx={{ color: COLORS.brand.primary }} size={48} />
          <Typography sx={{ color: COLORS.text.muted, fontWeight: 500, fontSize: '1.1rem' }}>
            Activating your {isPlanner ? 'Planner' : 'Pro'} plan...
          </Typography>
        </>
      )}

      {status === 'success' && (
        <>
          <CheckCircle sx={{ fontSize: 64, color: COLORS.accent.success }} />
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.text.strong, mb: 1 }}>
              {isPlanner ? 'Welcome, Planner!' : 'Welcome to Pro!'}
            </Typography>
            <Typography sx={{ color: COLORS.text.subtle }}>
              Your account has been upgraded. Redirecting...
            </Typography>
          </Box>
        </>
      )}

      {status === 'error' && (
        <>
          <ErrorOutline sx={{ fontSize: 64, color: COLORS.brand.primary }} />
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.text.strong, mb: 1 }}>
              Something went wrong
            </Typography>
            <Typography sx={{ color: COLORS.text.subtle }}>
              If your payment succeeded, your plan will be updated shortly. Redirecting...
            </Typography>
          </Box>
        </>
      )}
    </Box>
  );
}
