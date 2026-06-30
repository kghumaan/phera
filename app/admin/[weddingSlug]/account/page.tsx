'use client';

import { useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { CheckCircleOutline } from '@mui/icons-material';
import { usePlan } from '@/lib/contexts/PlanContext';
import { PageHeading } from '@/components/shared/PageHeading';
import { PheraCard } from '@/components/shared/Card';
import { PrimaryActionButton } from '@/components/admin/ActionButton';
import ProBadge from '@/components/admin/ProBadge';
import UpgradeModal from '@/components/admin/UpgradeModal';
import { COLORS } from '@/lib/theme/tokens';

const PREMIUM_FEATURES = [
  'Room & hotel assignments',
  'Transportation & shuttles',
  'Vendor coordination',
  'WhatsApp concierge & broadcasts',
  'Task manager',
  'Knowledge bank',
];

/**
 * Account — the couple's plan and billing surface. Shows the current plan and
 * the upgrade path (the only direct money surface in the admin). Uses the same
 * full-width `<Box width:100%>` + PageHeading layout as every other admin page
 * (the layout's <main> supplies the page padding). Consent & Data and Agency
 * (planner) sections can slot in here later.
 */
export default function AccountPage() {
  const { isPro } = usePlan();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  return (
    <Box sx={{ width: '100%' }}>
      <PageHeading title="Account" subtitle="Your plan and what's included." />

      <PheraCard variant="default" sx={{ mt: 3, maxWidth: 680, p: { xs: 2.5, md: 3.5 } }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
          spacing={2}
          sx={{ mb: 2.5 }}
        >
          <Box>
            <Typography variant="body2" sx={{ color: COLORS.text.muted, mb: 0.25 }}>
              Current plan
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1.25}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: COLORS.text.strong }}>
                {isPro ? 'Premium' : 'Free'}
              </Typography>
              {isPro && <ProBadge size="small" />}
            </Stack>
          </Box>
          {!isPro && (
            <PrimaryActionButton onClick={() => setUpgradeOpen(true)}>Upgrade to Premium</PrimaryActionButton>
          )}
        </Stack>

        <Typography variant="body2" sx={{ color: COLORS.text.muted, lineHeight: 1.7, mb: 2.5 }}>
          {isPro
            ? "You're on Premium — every feature is unlocked, including the managed-service add-ons."
            : 'Your free plan includes your wedding website, guest list, RSVPs, schedule, registry and FAQs. Upgrade once to unlock everything below for your whole wedding.'}
        </Typography>

        <Stack spacing={1.25}>
          {PREMIUM_FEATURES.map((feature) => (
            <Stack key={feature} direction="row" alignItems="center" spacing={1}>
              <CheckCircleOutline
                sx={{ fontSize: 18, color: isPro ? COLORS.brand.primary : COLORS.text.subtle, flexShrink: 0 }}
              />
              <Typography variant="body2" sx={{ color: isPro ? COLORS.text.strong : COLORS.text.muted }}>
                {feature}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </PheraCard>

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} tier="base" />
    </Box>
  );
}
