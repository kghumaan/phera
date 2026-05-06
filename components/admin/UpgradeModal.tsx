'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useParams } from 'next/navigation';
import { buildPaymentLinkUrl, isPaymentLinkConfigured, type PaymentLinkTier } from '@/lib/stripe/payment-links';

export type UpgradeTier = PaymentLinkTier;

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  tier?: UpgradeTier;
  /**
   * @deprecated Payment Links redirect to a fixed URL configured in Stripe.
   * Kept in props for backwards compat; ignored at runtime.
   */
  returnPath?: string;
  coupleName?: string;
}

/**
 * "Upgrade modal" — name kept for backwards compatibility, but there is no
 * modal anymore. When `open` flips to true we redirect immediately to the
 * tier-specific Stripe Payment Link. The component renders nothing.
 *
 * Per-user identity is encoded into the link's `client_reference_id`; the
 * planner per-wedding flow also stashes the couple name in sessionStorage
 * so /admin/new can finalize the wedding after Stripe redirects back.
 */
export default function UpgradeModal({ open, onClose, tier = 'base', coupleName }: UpgradeModalProps) {
  const { user } = useAuth();
  const params = useParams();
  const weddingSlug = (params?.weddingSlug as string | undefined) || undefined;
  const triggeredRef = useRef(false);

  useEffect(() => {
    if (!open) {
      triggeredRef.current = false;
      return;
    }
    if (triggeredRef.current) return;
    triggeredRef.current = true;

    if (!user?.id) {
      console.warn('[UpgradeModal] open=true but no authenticated user; aborting redirect.');
      onClose();
      return;
    }
    if (!isPaymentLinkConfigured(tier)) {
      console.error(`[UpgradeModal] Missing payment link env var for tier "${tier}".`);
      onClose();
      return;
    }
    if (tier === 'planner_perwedding' && coupleName && typeof window !== 'undefined') {
      window.sessionStorage.setItem('phera_planner_pending_couple_name', coupleName);
    }

    try {
      const url = buildPaymentLinkUrl(tier, {
        userId: user.id,
        weddingSlug,
        email: user.email,
      });
      window.location.href = url;
    } catch (err) {
      console.error('[UpgradeModal] redirect failed:', err);
      onClose();
    }
  }, [open, tier, user?.id, user?.email, weddingSlug, coupleName, onClose]);

  return null;
}
