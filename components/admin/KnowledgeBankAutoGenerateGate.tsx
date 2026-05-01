'use client';

import { Box, DialogContent, DialogActions, Button, Typography, Stack } from '@mui/material';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AutoAwesome } from '@mui/icons-material';
import { supabase } from '@/lib/supabase/client';
import { Wedding } from '@/lib/supabase/wedding-service';
import { usePlan } from '@/lib/contexts/PlanContext';
import { useAdminRole } from '@/lib/contexts/AdminRoleContext';
import { PheraDialog, PheraDialogTitle } from '@/components/shared/Dialog';
import { PrimaryActionButton } from '@/components/admin/ActionButton';
import { COLORS, RADII } from '@/lib/theme/tokens';

interface Props {
  wedding: Wedding;
  weddingSlug: string;
}

/**
 * Watches the three "core" wedding-website sections (Wedding Details,
 * Schedule & Events, Travel & Stay) and, the first time all three are marked
 * complete, fires off an AI generation of the Concierge Knowledge Bank and
 * surfaces a one-time celebratory modal pointing to the Knowledge Bank page.
 *
 * Modal-once-only is enforced by a localStorage flag so the same browser
 * never re-shows it. We also bail if the KB already has auto-generated
 * entries, since that means a previous flow (e.g. Concierge enable) already
 * populated it.
 */
export default function KnowledgeBankAutoGenerateGate({ wedding, weddingSlug }: Props) {
  const router = useRouter();
  const { isPro } = usePlan();
  const { isViewOnly } = useAdminRole();
  const [showModal, setShowModal] = useState(false);
  const inFlight = useRef(false);

  useEffect(() => {
    // Only Pro users get the Concierge / Knowledge Bank, so skip everything
    // for free plans. Viewers can't trigger generation either.
    if (!isPro || isViewOnly) return;
    if (!wedding?.id || !wedding?.slug) return;

    const flagKey = `phera:kb-auto-modal-shown:${wedding.id}`;
    if (typeof window !== 'undefined' && window.localStorage.getItem(flagKey)) return;

    if (inFlight.current) return;

    let cancelled = false;
    (async () => {
      // Mirror the sidebar's completion checks for the three core sections.
      const detailsComplete = !!(wedding.couple_name && wedding.venue_name && wedding.wedding_date);
      if (!detailsComplete) return;

      const [scheduleRes, travelRes, kbRes] = await Promise.all([
        supabase
          .from('wedding_schedule')
          .select('id', { count: 'exact', head: true })
          .eq('wedding_id', wedding.id),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- travel_sections not in generated supabase types
        (supabase as any)
          .from('travel_sections')
          .select('id', { count: 'exact', head: true })
          .eq('wedding_id', wedding.id),
        supabase
          .from('concierge_knowledge_base')
          .select('id', { count: 'exact', head: true })
          .eq('wedding_id', wedding.id)
          .eq('source', 'auto_generated'),
      ]);

      if (cancelled) return;

      const scheduleCount = scheduleRes.count ?? 0;
      const travelCount = travelRes.count ?? 0;
      const kbAutoCount = kbRes.count ?? 0;

      if (scheduleCount === 0 || travelCount === 0) return;

      // KB already auto-populated → suppress the modal, but still set the
      // flag so future runs short-circuit faster.
      if (kbAutoCount > 0) {
        window.localStorage.setItem(flagKey, '1');
        return;
      }

      inFlight.current = true;
      try {
        const res = await fetch('/api/concierge/knowledge/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ weddingId: wedding.id }),
        });
        if (cancelled) return;
        if (!res.ok) {
          // Don't burn the flag on failure — we'll retry next navigation.
          return;
        }
        window.localStorage.setItem(flagKey, '1');
        setShowModal(true);
      } catch {
        // Network error — leave flag unset so we retry later.
      } finally {
        inFlight.current = false;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    isPro,
    isViewOnly,
    wedding?.id,
    wedding?.slug,
    wedding?.couple_name,
    wedding?.venue_name,
    wedding?.wedding_date,
  ]);

  const handleViewKnowledgeBank = () => {
    setShowModal(false);
    router.push(`/admin/${weddingSlug}/knowledge-bank`);
  };

  return (
    <PheraDialog
      open={showModal}
      onClose={() => setShowModal(false)}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { p: 1 } }}
    >
      <PheraDialogTitle onClose={() => setShowModal(false)}>
        Your Knowledge Bank is ready
      </PheraDialogTitle>
      <DialogContent>
        <Stack spacing={2} alignItems="center" sx={{ py: 1 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              bgcolor: COLORS.brand.primarySubtle,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AutoAwesome sx={{ fontSize: 28, color: COLORS.brand.primary }} />
          </Box>
          <Typography variant="body2" sx={{ color: COLORS.text.muted, textAlign: 'center', lineHeight: 1.65 }}>
            We&apos;ve auto-generated data for your Knowledge Bank — so your WhatsApp bot knows more details about your event! You can view, edit, or regenerate it any time.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={() => setShowModal(false)}
          sx={{ textTransform: 'none', color: COLORS.text.subtle, borderRadius: RADII.sm }}
        >
          Later
        </Button>
        <PrimaryActionButton onClick={handleViewKnowledgeBank} sx={{ borderRadius: RADII.sm }}>
          View Knowledge Bank
        </PrimaryActionButton>
      </DialogActions>
    </PheraDialog>
  );
}
