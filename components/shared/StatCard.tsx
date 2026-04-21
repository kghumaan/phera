'use client';

/**
 * Standard "label + big number + icon" card.
 *
 * Overview page, RSVPs page, and several admin dashboards hand-roll
 * this exact pattern. One primitive, one look. Pass `selected` to
 * highlight (pink border) — used as clickable tabs on the RSVPs page.
 *
 * ```tsx
 * <StatCard
 *   icon={<CheckCircle />}
 *   iconColor={COLORS.accent.success}
 *   value={stats.attending}
 *   label="Attending"
 *   onClick={() => setTab(1)}
 *   selected={tab === 1}
 * />
 * ```
 */

import { Box, Card, CardContent, Avatar, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { ReactNode } from 'react';
import { COLORS, RADII, SHADOWS } from '@/lib/theme/tokens';

export interface StatCardProps {
  icon?: ReactNode;
  /** Icon tint + avatar background base. Defaults to brand primary. */
  iconColor?: string;
  value: ReactNode;
  label: ReactNode;
  hint?: ReactNode;
  selected?: boolean;
  onClick?: () => void;
  sx?: object;
}

export function StatCard({
  icon,
  iconColor = COLORS.brand.primary,
  value,
  label,
  hint,
  selected,
  onClick,
  sx,
}: StatCardProps) {
  return (
    <Card
      onClick={onClick}
      sx={{
        flex: '1 1 200px',
        minWidth: 180,
        borderRadius: RADII.lg,
        bgcolor: COLORS.bg.white,
        boxShadow: SHADOWS.card,
        border: selected
          ? `2px solid ${COLORS.brand.primary}`
          : '2px solid transparent',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border 0.2s ease',
        ...sx,
      }}
    >
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {icon && (
          <Avatar sx={{ bgcolor: alpha(iconColor, 0.1), color: iconColor }}>
            {icon}
          </Avatar>
        )}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: COLORS.text.strong }}>
            {value}
          </Typography>
          <Typography variant="body2" sx={{ color: COLORS.text.subtle }}>
            {label}
          </Typography>
          {hint && (
            <Typography variant="caption" sx={{ color: COLORS.text.faint, display: 'block', mt: 0.25 }}>
              {hint}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

export default StatCard;
