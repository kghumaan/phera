'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  TextField,
  Stack,
  Paper,
  alpha,
  CircularProgress,
} from '@mui/material';
import { weddingService } from '@/lib/supabase/wedding-service';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import { supabase } from '@/lib/supabase/client';
import { PrimaryActionButton } from '@/components/admin/ActionButton';
import { ErrorAlert } from '@/components/shared/Alert';
import { COLORS, FONTS, RADII } from '@/lib/theme/tokens';
import UpgradeModal from '@/components/admin/UpgradeModal';
import ConfirmChargeModal from '@/components/admin/ConfirmChargeModal';

const PENDING_COUPLE_NAME_KEY = 'phera_planner_pending_couple_name';

interface BillingInfo {
  isPlanner: boolean;
  hasCard: boolean;
  brand?: string | null;
  last4?: string | null;
}

export default function NewWeddingPage() {
  return (
    <Suspense
      fallback={
        <OptimizedBackground useAppDefault className="min-h-screen flex flex-col">
          <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress size={48} sx={{ color: COLORS.brand.primary }} />
          </Box>
        </OptimizedBackground>
      }
    >
      <NewWeddingPageInner />
    </Suspense>
  );
}

function NewWeddingPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionIdFromCheckout = searchParams.get('session_id');

  const [coupleName, setCoupleName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [finalizing, setFinalizing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [billing, setBilling] = useState<BillingInfo | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [confirmCharging, setConfirmCharging] = useState(false);

  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const finalizeAfterCheckout = useCallback(
    async (sessionId: string) => {
      setFinalizing(true);
      setError(null);
      try {
        const stash =
          typeof window !== 'undefined' ? sessionStorage.getItem(PENDING_COUPLE_NAME_KEY) ?? '' : '';
        const res = await fetch('/api/stripe/finalize-planner-wedding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, coupleName: stash }),
        });
        const data = await res.json();
        if (!res.ok || !data?.success) {
          throw new Error(data?.error || 'Failed to finalize wedding');
        }
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem(PENDING_COUPLE_NAME_KEY);
          // Clean the session_id query param so a refresh doesn't re-finalize.
          const url = new URL(window.location.href);
          url.searchParams.delete('session_id');
          window.history.replaceState({}, '', url.toString());
        }
        router.replace(`/admin/${data.slug}/details`);
      } catch (err) {
        console.error('Finalize error:', err);
        setError(err instanceof Error ? err.message : 'Failed to finalize wedding');
        setFinalizing(false);
      }
    },
    [router],
  );

  const loadBillingInfo = useCallback(async () => {
    try {
      const res = await fetch('/api/stripe/planner-billing-info');
      if (!res.ok) {
        setBilling({ isPlanner: false, hasCard: false });
        return;
      }
      const data = await res.json();
      setBilling({
        isPlanner: !!data.isPlanner,
        hasCard: !!data.hasCard,
        brand: data.brand,
        last4: data.last4,
      });
    } catch (err) {
      console.error('Failed to load billing info:', err);
      setBilling({ isPlanner: false, hasCard: false });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;

      if (!user) {
        router.push('/auth/login');
        return;
      }
      setUserId(user.id);

      // Post-checkout return path: finalize the wedding before doing anything else.
      if (sessionIdFromCheckout) {
        await finalizeAfterCheckout(sessionIdFromCheckout);
        return;
      }

      const { data: settings } = await supabase
        .from('user_settings')
        .select('account_type')
        .eq('user_id', user.id)
        .single();

      const isPlanner = settings?.account_type === 'planner';

      if (!isPlanner) {
        // Couples are limited to one wedding — redirect to it if they already have one.
        const { data: existingWeddings } = await supabase
          .from('weddings')
          .select('slug')
          .eq('created_by', user.id)
          .not('slug', 'like', 'demo-%')
          .order('created_at', { ascending: false })
          .limit(1);

        if (existingWeddings && existingWeddings.length > 0) {
          router.push(`/admin/${existingWeddings[0].slug}/overview`);
          return;
        }

        const { data: adminWeddings } = await supabase
          .from('wedding_admins')
          .select('wedding_id, weddings(slug)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (adminWeddings && adminWeddings.length > 0 && adminWeddings[0].weddings) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const slug = (adminWeddings[0].weddings as any).slug;
          router.push(`/admin/${slug}/overview`);
          return;
        }

        setBilling({ isPlanner: false, hasCard: false });
        setCheckingAuth(false);
        return;
      }

      await loadBillingInfo();
      setCheckingAuth(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [router, sessionIdFromCheckout, finalizeAfterCheckout, loadBillingInfo]);

  const handleCreateWedding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coupleName.trim()) {
      setError('Please enter your names');
      return;
    }
    if (!userId) {
      setError('You must be logged in to create a wedding');
      return;
    }

    if (billing?.isPlanner) {
      // Planner flow — payment required.
      if (billing.hasCard) {
        setConfirmError(null);
        setConfirmOpen(true);
      } else {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(PENDING_COUPLE_NAME_KEY, coupleName.trim());
        }
        setUpgradeOpen(true);
      }
      return;
    }

    // Non-planner flow — unchanged.
    setSubmitting(true);
    setError(null);
    try {
      const baseSlug = coupleName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      let slug = baseSlug;
      let counter = 1;
      while (!(await weddingService.checkSlugAvailability(slug))) {
        slug = `${baseSlug}-${counter++}`;
      }
      const wedding = await weddingService.createWedding({
        slug,
        couple_name: coupleName,
        wedding_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        wedding_date_display: 'TBD',
        venue_name: 'TBD',
        venue_location: 'TBD',
        rsvp_deadline: 'TBD',
        status: 'draft',
        created_by: userId,
        background_image: '/images/backgrounds/blue-clouds.webp',
        primary_color: COLORS.brand.primary,
      });
      if (wedding) {
        router.push(`/admin/${slug}/details`);
      } else {
        setError('Failed to create wedding. Please try again.');
        setSubmitting(false);
      }
    } catch (err) {
      console.error('Wedding creation error:', err);
      setError('An unexpected error occurred');
      setSubmitting(false);
    }
  };

  const handleConfirmCharge = async () => {
    setConfirmCharging(true);
    setConfirmError(null);
    try {
      const res = await fetch('/api/stripe/charge-planner-wedding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coupleName: coupleName.trim() }),
      });
      const data = await res.json();
      if (res.ok && data?.success) {
        setConfirmOpen(false);
        router.replace(`/admin/${data.slug}/details`);
        return;
      }

      if (data?.error === 'authentication_required' || data?.error === 'no_saved_card') {
        // Card needs re-entry — fall back to full Stripe Checkout.
        setConfirmOpen(false);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(PENDING_COUPLE_NAME_KEY, coupleName.trim());
        }
        setUpgradeOpen(true);
        return;
      }

      setConfirmError(data?.message || data?.error || 'Charge failed. Please try again.');
    } catch (err) {
      console.error('Charge error:', err);
      setConfirmError(err instanceof Error ? err.message : 'Charge failed');
    } finally {
      setConfirmCharging(false);
    }
  };

  const handleUpgradeClose = () => {
    setUpgradeOpen(false);
  };

  if (checkingAuth || finalizing) {
    return (
      <OptimizedBackground useAppDefault className="min-h-screen flex flex-col">
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
          }}
        >
          <CircularProgress size={48} sx={{ color: COLORS.brand.primary }} />
          {finalizing && (
            <Typography variant="body2" sx={{ color: COLORS.text.muted }}>
              Setting up your wedding…
            </Typography>
          )}
        </Box>
      </OptimizedBackground>
    );
  }

  const isPlanner = billing?.isPlanner ?? false;
  const continueLabel = isPlanner ? 'Continue ($249)' : 'Continue';

  return (
    <OptimizedBackground useAppDefault className="min-h-screen flex flex-col">
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
        <Container maxWidth="sm">
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, sm: 5 },
              borderRadius: '32px',
              bgcolor: alpha(COLORS.bg.white, 0.95),
              backdropFilter: 'blur(10px)',
            }}
          >
            <Stack spacing={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography
                  variant="h3"
                  sx={{
                    fontFamily: FONTS.display,
                    mb: 1,
                    fontSize: { xs: '2rem', sm: '2.5rem' },
                    color: COLORS.text.strong,
                  }}
                >
                  Create Your Wedding
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: COLORS.text.subtle, fontSize: { xs: '0.95rem', sm: '1.05rem' } }}
                >
                  Let's start by getting your names
                </Typography>
                {isPlanner && (
                  <Typography
                    variant="body2"
                    sx={{ color: COLORS.text.muted, mt: 1.5, fontSize: '0.9rem' }}
                  >
                    Phera is $249 per wedding for planners.
                    {billing?.hasCard
                      ? ' We\'ll charge your saved card on the next step.'
                      : ' Your card is saved on the first checkout for one-click charges next time.'}
                  </Typography>
                )}
              </Box>

              <form onSubmit={handleCreateWedding}>
                <Stack spacing={3}>
                  <TextField
                    fullWidth
                    label="Couple Name"
                    placeholder="e.g., Sarah & Mike or Sarah and Mike"
                    value={coupleName}
                    onChange={(e) => {
                      setCoupleName(e.target.value);
                      setError(null);
                    }}
                    disabled={submitting}
                    required
                    autoFocus
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: RADII.lg,
                        '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.23)' },
                        '&:hover fieldset': { borderColor: 'rgba(0, 0, 0, 0.4)' },
                        '&.Mui-focused fieldset': { borderColor: COLORS.brand.primary },
                      },
                      '& .MuiInputLabel-root.Mui-focused': { color: COLORS.brand.primary },
                    }}
                  />

                  {error && (
                    <ErrorAlert onClose={() => setError(null)}>{error}</ErrorAlert>
                  )}

                  <PrimaryActionButton
                    type="submit"
                    size="large"
                    loading={submitting}
                    disabled={!coupleName.trim()}
                    sx={{
                      borderRadius: RADII.lg,
                      py: 1.5,
                      fontSize: '1.1rem',
                      '&:disabled': { bgcolor: COLORS.border.default },
                    }}
                  >
                    {continueLabel}
                  </PrimaryActionButton>
                </Stack>
              </form>

              <Typography
                variant="caption"
                sx={{ textAlign: 'center', color: COLORS.text.faint, fontSize: '0.875rem' }}
              >
                Don't worry, you can change this later
              </Typography>
            </Stack>
          </Paper>
        </Container>
      </Box>

      <ConfirmChargeModal
        open={confirmOpen}
        amountLabel="$249"
        cardLast4={billing?.last4 ?? null}
        loading={confirmCharging}
        error={confirmError}
        onCancel={() => {
          if (!confirmCharging) setConfirmOpen(false);
        }}
        onConfirm={handleConfirmCharge}
      />

      <UpgradeModal
        open={upgradeOpen}
        onClose={handleUpgradeClose}
        tier="planner_perwedding"
        coupleName={coupleName.trim()}
      />
    </OptimizedBackground>
  );
}
