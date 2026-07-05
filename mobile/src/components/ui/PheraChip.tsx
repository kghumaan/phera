import { View } from 'react-native';

import { COLORS, PALETTE, RADII } from '@/lib/theme/tokens';
import { PheraText } from './PheraText';

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

const TONES: Record<PheraChipTone, { bg: string; text: string }> = {
  neutral: { bg: COLORS.bg.subtle, text: COLORS.text.muted },
  brand: { bg: COLORS.brand.primarySubtle, text: COLORS.brand.primary },
  success: { bg: COLORS.accent.successBg, text: COLORS.accent.successText },
  warning: { bg: COLORS.accent.warningBg, text: COLORS.accent.warningText },
  danger: { bg: COLORS.accent.dangerBg, text: COLORS.accent.dangerText },
  info: { bg: COLORS.accent.infoBg, text: COLORS.accent.infoText },
  'side-bride': { bg: COLORS.brand.primarySubtle, text: COLORS.side.bride },
  'side-groom': { bg: PALETTE.skyBlue[50], text: COLORS.side.groom },
  'side-both': { bg: PALETTE.plum[50], text: COLORS.side.both },
};

export interface PheraChipProps {
  label: string;
  tone?: PheraChipTone;
}

/** Port of web `PheraChip` (components/shared/Chip.tsx). */
export function PheraChip({ label, tone = 'neutral' }: PheraChipProps) {
  const t = TONES[tone];
  return (
    <View
      style={{
        backgroundColor: t.bg,
        borderRadius: RADII.pill,
        paddingHorizontal: 10,
        paddingVertical: 4,
        alignSelf: 'flex-start',
      }}
    >
      <PheraText variant="body2" weight={500} color={t.text}>
        {label}
      </PheraText>
    </View>
  );
}
