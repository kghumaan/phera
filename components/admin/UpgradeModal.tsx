'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  DialogContent,
  Box,
  Typography,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { PheraDialog } from '@/components/shared/Dialog';
import { Close, AutoAwesome } from '@mui/icons-material';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useParams } from 'next/navigation';
import { COLORS, RADII } from '@/lib/theme/tokens';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export type UpgradeTier = 'base' | 'premium' | 'planner_perwedding' | 'planner_studio';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  tier?: UpgradeTier;
  returnPath?: string;
}

const TIER_COPY: Record<UpgradeTier, { title: string; subtitle: string }> = {
  base: {
    title: 'Upgrade to Phera Base',
    subtitle: 'Unlock Proactive WhatsApp outreach, travel & shuttle coordination, 24/7 Guest Concierge, and the Control Tower dashboard.',
  },
  premium: {
    title: 'Upgrade to Phera Premium',
    subtitle: 'Everything in Base plus Vendor Coordinator Agent, reverse-destination cultural guides, and priority escalation support.',
  },
  planner_perwedding: {
    title: 'Start as a Planner',
    subtitle: 'Pay per wedding — resell to couples at your own rate. No commitment.',
  },
  planner_studio: {
    title: 'Planner Studio',
    subtitle: 'Up to 20 active weddings. White-label, team seats, wholesale pricing.',
  },
};

export default function UpgradeModal({ open, onClose, tier = 'base', returnPath }: UpgradeModalProps) {
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
          tier,
          returnPath,
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
  }, [user?.id, user?.email, weddingSlug, tier, returnPath]);

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
    <PheraDialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { overflow: 'hidden', minHeight: 300 } }}
    >
      <IconButton
        onClick={onClose}
        sx={{
          position: 'absolute',
          right: 16,
          top: 16,
          zIndex: 10,
          color: COLORS.text.subtle,
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
            <AutoAwesome sx={{ fontSize: 28, color: COLORS.brand.primary }} />
          </Box>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: COLORS.text.strong, mb: 0.5 }}
          >
            {TIER_COPY[tier].title}
          </Typography>
          <Typography variant="body2" sx={{ color: COLORS.text.subtle, fontSize: '0.95rem', lineHeight: 1.6 }}>
            {TIER_COPY[tier].subtitle}
          </Typography>
        </Box>

        {/* Checkout Area */}
        <Box sx={{ px: 2, pb: 3, minHeight: 200 }}>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 6 }}>
              <CircularProgress sx={{ color: COLORS.brand.primary }} />
            </Box>
          )}

          {error && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" sx={{ color: COLORS.accent.dangerText, mb: 1 }}>{error}</Typography>
              <Typography
                component="span"
                onClick={fetchClientSecret}
                sx={{ color: COLORS.brand.primary, cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}
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
    </PheraDialog>
  );
}
