'use client';

/**
 * Standard "no X yet" empty-state block.
 *
 * Used in rooms, guest-list, travel, RSVPs, concierge — anywhere a
 * list is empty and we want to prompt the user with a CTA. Replaces
 * the ad-hoc `<Box py=6 textAlign=center>` pattern that gets repeated
 * with slightly different padding each time.
 *
 * ```tsx
 * <EmptyState
 *   icon={<People sx={{ fontSize: 40 }} />}
 *   title="No guests yet"
 *   subtitle="Import a spreadsheet to get started."
 *   action={<SecondaryActionButton>Import Guests</SecondaryActionButton>}
 * />
 * ```
 */

import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { COLORS } from '@/lib/theme/tokens';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  sx?: object;
}

export function EmptyState({ icon, title, subtitle, action, sx }: EmptyStateProps) {
  return (
    <Box sx={{ textAlign: 'center', py: 6, px: 3, ...sx }}>
      {icon && (
        <Box sx={{ color: COLORS.border.default, mb: 1.5, display: 'inline-flex' }}>
          {icon}
        </Box>
      )}
      <Typography variant="subtitle1" sx={{ color: COLORS.text.strong, mb: 0.5 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography
          variant="body2"
          sx={{ color: COLORS.text.subtle, maxWidth: 420, mx: 'auto', mb: action ? 2.5 : 0 }}
        >
          {subtitle}
        </Typography>
      )}
      {action}
    </Box>
  );
}

export default EmptyState;
