'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { Close, AutoAwesome } from '@mui/icons-material';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useParams } from 'next/navigation';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

export default function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  const { user } = useAuth();
  const params = useParams();
  const weddingSlug = params?.weddingSlug as string | undefined;

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClientSecret = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          weddingSlug: weddingSlug || '',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create checkout session');
      setClientSecret(data.clientSecret);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.email, weddingSlug]);

  useEffect(() => {
    if (open && !clientSecret) {
      fetchClientSecret();
    }
    if (!open) {
      // Reset state when modal closes so a fresh session is created next time
      setClientSecret(null);
      setError(null);
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '24px',
          bgcolor: 'white',
          overflow: 'hidden',
          minHeight: 300,
        },
      }}
    >
      <IconButton
        onClick={onClose}
        sx={{
          position: 'absolute',
          right: 16,
          top: 16,
          zIndex: 10,
          color: '#666',
          bgcolor: 'rgba(255,255,255,0.9)',
          '&:hover': { bgcolor: 'rgba(0,0,0,0.06)' },
        }}
      >
        <Close />
      </IconButton>

      <DialogContent sx={{ p: 0 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', pt: 4, pb: 2, px: 3 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              bgcolor: 'rgba(222, 63, 94, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
            }}
          >
            <AutoAwesome sx={{ fontSize: 28, color: '#DE3F5E' }} />
          </Box>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: '#1a1a1a', mb: 0.5 }}
          >
            Upgrade to Pro
          </Typography>
          <Typography sx={{ color: '#666', fontSize: '0.95rem', lineHeight: 1.6 }}>
            Unlock Travel Coordination, Phera Concierge, and all premium themes.
          </Typography>
        </Box>

        {/* Checkout Area */}
        <Box sx={{ px: 2, pb: 3, minHeight: 200 }}>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 6 }}>
              <CircularProgress sx={{ color: '#DE3F5E' }} />
            </Box>
          )}

          {error && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography sx={{ color: '#c0392b', mb: 1 }}>{error}</Typography>
              <Typography
                component="span"
                onClick={fetchClientSecret}
                sx={{ color: '#DE3F5E', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}
              >
                Try again
              </Typography>
            </Box>
          )}

          {clientSecret && !loading && (
            <EmbeddedCheckoutProvider
              stripe={stripePromise}
              options={{ clientSecret }}
            >
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
