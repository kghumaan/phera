'use client';

/**
 * Standard Phera page + section headings.
 *
 * Every admin page opens with a heading + subtitle pair. Centralizing
 * that shape here means the `h6/body2` + spacing combo isn't hand-rolled
 * 20 times. Use `PageHeading` at the top of a screen, `SectionHeading`
 * inside sections.
 *
 * ```tsx
 * <PageHeading title="Room Assignments" subtitle="Upload your hotel floorplan…" />
 * <SectionHeading title="Response Breakdown" />
 * ```
 */

import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { COLORS } from '@/lib/theme/tokens';

export interface PageHeadingProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Right-aligned slot for CTAs (buttons, dropdowns). */
  actions?: ReactNode;
  sx?: object;
}

export function PageHeading({ title, subtitle, actions, sx }: PageHeadingProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 2,
        flexWrap: 'wrap',
        ...sx,
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: COLORS.text.strong }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" sx={{ color: COLORS.text.subtle }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {actions && <Box sx={{ flexShrink: 0 }}>{actions}</Box>}
    </Box>
  );
}

export interface SectionHeadingProps {
  title: ReactNode;
  actions?: ReactNode;
  sx?: object;
}

export function SectionHeading({ title, actions, sx }: SectionHeadingProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1,
        ...sx,
      }}
    >
      <Typography variant="subtitleCaps" sx={{ color: COLORS.text.strong }}>
        {title}
      </Typography>
      {actions && <Box sx={{ flexShrink: 0 }}>{actions}</Box>}
    </Box>
  );
}

export default PageHeading;
