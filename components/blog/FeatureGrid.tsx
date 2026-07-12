import React from 'react';
import { Box, Typography } from '@mui/material';
import { COLORS, RADII, FONTS, TEXT } from '@/lib/theme/tokens';
import PheraChip from '@/components/shared/Chip';

/** Composable in MDX:
 *
 *   <FeatureGrid>
 *     <Feature title="Guest list" tools="list_guests · add_guest">
 *       Ask for the count and it just answers.
 *     </Feature>
 *   </FeatureGrid>
 */
export function FeatureGrid({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        my: 5,
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
        gap: 2,
      }}
    >
      {children}
    </Box>
  );
}

interface FeatureProps {
  title: string;
  /** Real tool names, shown as a monospace-ish footnote. Keep them accurate. */
  tools?: string;
  /** Marks a tool that lives behind the paid plan. */
  pro?: boolean;
  children: React.ReactNode;
}

export function Feature({ title, tools, pro, children }: FeatureProps) {
  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: RADII.lg,
        border: `1px solid ${COLORS.border.light}`,
        bgcolor: COLORS.bg.white,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Typography
          sx={{
            fontFamily: FONTS.body,
            fontSize: TEXT.lg,
            fontWeight: 600,
            color: COLORS.text.strong,
          }}
        >
          {title}
        </Typography>
        {pro && <PheraChip tone="warning" size="small" label="Paid plan" />}
      </Box>

      <Box
        sx={{
          fontFamily: FONTS.body,
          fontSize: TEXT.base,
          color: COLORS.text.muted,
          lineHeight: 1.6,
          flex: 1,
          '& p': { m: 0 },
        }}
      >
        {children}
      </Box>

      {tools && (
        <Typography
          sx={{
            fontFamily: FONTS.body,
            fontSize: TEXT.sm,
            color: COLORS.text.faint,
            pt: 1,
            mt: 'auto',
            borderTop: `1px solid ${COLORS.border.faint}`,
          }}
        >
          {tools}
        </Typography>
      )}
    </Box>
  );
}

export default FeatureGrid;
