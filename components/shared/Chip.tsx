'use client';

/**
 * Standard Phera chip / pill.
 *
 * Wraps MUI Chip with token-backed tones so every side/status/tag
 * indicator reads identical. Tones map to existing token buckets —
 * no new colors introduced.
 *
 * ```tsx
 * <PheraChip tone="success" label="Attending" />
 * <PheraChip tone="side-bride" label="Bride" />
 * <PheraChip tone="neutral" label={tag} />
 * ```
 */

import { Chip, type ChipProps } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { COLORS } from '@/lib/theme/tokens';

export type PheraChipTone =
  | 'neutral'
  | 'brand'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'side-bride'
  | 'side-groom'
  | 'side-both';

export interface PheraChipProps extends Omit<ChipProps, 'color' | 'variant'> {
  tone?: PheraChipTone;
}

const TONE_COLORS: Record<PheraChipTone, { bg: string; fg: string }> = {
  neutral:     { bg: 'rgba(0, 0, 0, 0.05)', fg: COLORS.text.strong },
  brand:       { bg: alpha(COLORS.brand.primary, 0.1), fg: COLORS.brand.primary },
  success:     { bg: alpha(COLORS.accent.success, 0.1), fg: COLORS.accent.success },
  warning:     { bg: alpha(COLORS.accent.warning, 0.1), fg: COLORS.accent.warning },
  danger:      { bg: alpha(COLORS.accent.danger, 0.1), fg: COLORS.accent.danger },
  info:        { bg: alpha(COLORS.accent.info, 0.1), fg: COLORS.accent.info },
  'side-bride': { bg: alpha(COLORS.side.bride, 0.1), fg: COLORS.side.bride },
  'side-groom': { bg: alpha(COLORS.side.groom, 0.1), fg: COLORS.side.groom },
  'side-both':  { bg: alpha(COLORS.side.both, 0.1), fg: COLORS.side.both },
};

export function PheraChip({ tone = 'neutral', sx, ...rest }: PheraChipProps) {
  const { bg, fg } = TONE_COLORS[tone];
  return (
    <Chip
      {...rest}
      sx={{
        bgcolor: bg,
        color: fg,
        fontSize: '0.875rem',
        fontWeight: 600,
        '& .MuiChip-icon': { color: fg },
        ...sx,
      }}
    />
  );
}

export default PheraChip;
