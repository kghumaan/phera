'use client';

import { useEffect, useState, use, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Box, Typography, CircularProgress } from '@mui/material';
import { CheckCircle, ErrorOutline } from '@mui/icons-material';

export default function UpgradeSuccessPage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  return (
    <Suspense>
      <UpgradeSuccessContent params={params} />
    </Suspense>
  );
}

function UpgradeSuccessContent({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session_id');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [tier, setTier] = useState<string>('pro');

  useEffect(() => {
    if (!sessionId) {
      router.replace(`/admin/${weddingSlug}`);
      return;
    }

    const verifyAndUpgrade = async () => {
      try {
        // Call server-side API that uses service role key to bypass RLS
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
            router.replace(`/admin/${weddingSlug}`);
          }, 2500);
        } else {
          console.error('Upgrade error:', data.error);
          setStatus('error');
          setTimeout(() => {
            router.replace(`/admin/${weddingSlug}`);
          }, 3000);
        }
      } catch (err) {
        console.error('Error verifying upgrade:', err);
        setStatus('error');
        setTimeout(() => {
          router.replace(`/admin/${weddingSlug}`);
        }, 3000);
      }
    };

    verifyAndUpgrade();
  }, [sessionId]);

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
          <CircularProgress sx={{ color: '#DE3F5E' }} size={48} />
          <Typography sx={{ color: '#4a4a4a', fontWeight: 500, fontSize: '1.1rem' }}>
            Activating your {tier === 'planner' ? 'Planner' : 'Pro'} plan...
          </Typography>
        </>
      )}

      {status === 'success' && (
        <>
          <CheckCircle sx={{ fontSize: 64, color: '#4CAF50' }} />
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 1 }}>
              {tier === 'planner' ? 'Welcome, Planner!' : 'Welcome to Pro!'}
            </Typography>
            <Typography sx={{ color: '#6a6a6a' }}>
              Your account has been upgraded. Taking you back to the dashboard...
            </Typography>
          </Box>
        </>
      )}

      {status === 'error' && (
        <>
          <ErrorOutline sx={{ fontSize: 64, color: '#DE3F5E' }} />
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 1 }}>
              Something went wrong
            </Typography>
            <Typography sx={{ color: '#6a6a6a' }}>
              If your payment succeeded, your plan will be updated shortly. Redirecting...
            </Typography>
          </Box>
        </>
      )}
    </Box>
  );
}
