'use client';

import { useEffect, useState } from 'react';
import { Box, Typography, Paper, Stack, CircularProgress } from '@mui/material';
import { PrimaryActionButton } from './ActionButton';
import { InfoOutlined, CheckCircleOutline } from '@mui/icons-material';
import { useAuth } from '@/lib/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { useAdminRole } from '@/lib/contexts/AdminRoleContext';
import { isBetaUser as checkBetaAccess } from '@/lib/utils/beta-access';

type Status = 'idle' | 'checking' | 'submitting' | 'success' | 'error';

interface EarlyBetaGateProps {
  /** Display name of the gated feature, used in copy + DB message. */
  featureName: string;
  /** Short description shown under the title. */
  description: string;
  /**
   * When true, renders the gate. Otherwise renders children (the real feature).
   * Defaults to !isBetaUser.
   */
  when?: boolean;
  /** The actual feature content to render when the user has access. */
  children: React.ReactNode;
}

export default function EarlyBetaGate({ featureName, description, when, children }: EarlyBetaGateProps) {
  const { user } = useAuth();
  const { isViewOnly } = useAdminRole();
  const email = user?.email?.toLowerCase() || '';
  const isBetaUser = checkBetaAccess(email);
  const gated = when ?? !isBetaUser;

  const [status, setStatus] = useState<Status>('idle');
  const storageKey = `phera_beta_requested_${featureName.toLowerCase().replace(/\s+/g, '_')}_${email}`;
  const requestMessage = `${featureName}: Early Preview Setup Request`;

  useEffect(() => {
    if (!gated || !email) return;

    if (typeof window !== 'undefined' && localStorage.getItem(storageKey) === 'true') {
      setStatus('success');
      return;
    }

    let cancelled = false;
    setStatus('checking');
    (async () => {
      try {
        const { data, error } = await (supabase as any)
          .from('contact_submissions')
          .select('id')
          .eq('email', email)
          .eq('message', requestMessage)
          .limit(1);

        if (cancelled) return;
        if (!error && data && data.length > 0) {
          setStatus('success');
          if (typeof window !== 'undefined') localStorage.setItem(storageKey, 'true');
        } else {
          setStatus('idle');
        }
      } catch {
        if (!cancelled) setStatus('idle');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [gated, email, storageKey, requestMessage]);

  const handleRequest = async () => {
    if (isViewOnly || !email) return;
    setStatus('submitting');
    try {
      const { error } = await (supabase as any).from('contact_submissions').insert([
        {
          name: user?.name || 'Admin',
          email,
          message: requestMessage,
        },
      ]);
      if (error) throw error;
      if (typeof window !== 'undefined') localStorage.setItem(storageKey, 'true');
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  if (!gated) return <>{children}</>;

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
      <Stack spacing={3} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a1a1a' }}>
            {featureName}
          </Typography>
          <Typography sx={{ fontSize: 13, color: '#6a6a6a', mt: 0.5 }}>
            {description}
          </Typography>
        </Box>
      </Stack>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 4, md: 8 },
          borderRadius: '32px',
          bgcolor: 'white',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
        }}
      >
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '20px',
            bgcolor: 'rgba(222, 63, 94, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 3,
          }}
        >
          <InfoOutlined sx={{ fontSize: 32, color: '#DE3F5E' }} />
        </Box>

        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#1a1a1a' }}>
          Early Preview Mode
        </Typography>

        <Typography sx={{ fontSize: 14, color: '#4a4a4a', maxWidth: 520, mb: 4, lineHeight: 1.6 }}>
          {featureName} is currently in early beta. We&apos;re rolling it out in batches to ensure
          the best experience. Request access below and we&apos;ll set you up as soon as a slot opens.
        </Typography>

        {status === 'checking' ? (
          <CircularProgress size={24} sx={{ color: '#DE3F5E' }} />
        ) : status === 'success' ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1.5,
              p: 3,
              bgcolor: '#F1F8E9',
              borderRadius: '16px',
              border: '1px solid #C5E1A5',
              maxWidth: 460,
            }}
          >
            <CheckCircleOutline sx={{ color: '#2E7D32', fontSize: 28 }} />
            <Typography sx={{ fontSize: 13, color: '#1B5E20', fontWeight: 600, textAlign: 'center' }}>
              Request confirmed! We&apos;ll reach out soon to get you set up. In the meantime, feel free to explore our other services.
            </Typography>
          </Box>
        ) : (
          <Stack spacing={2} alignItems="center">
            <PrimaryActionButton
              loading={status === 'submitting'}
              disabled={isViewOnly}
              onClick={handleRequest}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                boxShadow: '0 8px 16px rgba(222, 63, 94, 0.2)',
                '&.Mui-disabled': { bgcolor: 'rgba(222, 63, 94, 0.5)', color: 'rgba(255,255,255,0.8)' },
              }}
            >
              Request Early Access
            </PrimaryActionButton>
            {status === 'error' && (
              <Typography variant="caption" sx={{ color: '#d32f2f' }}>
                Something went wrong. Please try again or contact support.
              </Typography>
            )}
          </Stack>
        )}
      </Paper>
    </Box>
  );
}
