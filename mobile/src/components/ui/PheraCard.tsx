import type { ReactNode } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { COLORS, RADII, SHADOWS } from '@/lib/theme/tokens';

export type PheraCardVariant = 'default' | 'muted' | 'feature' | 'hero';

export interface PheraCardProps {
  children: ReactNode;
  variant?: PheraCardVariant;
  onPress?: () => void;
  padding?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityLabel?: string;
}

const VARIANTS: Record<PheraCardVariant, ViewStyle> = {
  default: {
    backgroundColor: COLORS.bg.white,
    borderWidth: 1,
    borderColor: COLORS.border.light,
    borderRadius: RADII.lg,
    ...SHADOWS.card,
  },
  muted: {
    backgroundColor: COLORS.bg.muted,
    borderWidth: 1,
    borderColor: COLORS.border.faint,
    borderRadius: RADII.lg,
  },
  feature: {
    backgroundColor: COLORS.bg.white,
    borderWidth: 1,
    borderColor: COLORS.brand.primaryBorder,
    borderRadius: RADII.lg,
    ...SHADOWS.card,
  },
  hero: {
    backgroundColor: COLORS.bg.white,
    borderWidth: 1,
    borderColor: COLORS.border.light,
    borderRadius: RADII.xl,
    ...SHADOWS.popover,
  },
};

/** Port of web `PheraCard` (components/shared/Card.tsx). */
export function PheraCard({
  children,
  variant = 'default',
  onPress,
  padding = 16,
  style,
  testID,
  accessibilityLabel,
}: PheraCardProps) {
  const base = [VARIANTS[variant], { padding }, style];

  if (onPress) {
    return (
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={({ pressed }) => [...base, pressed && { opacity: 0.85 }]}
      >
        {children}
      </Pressable>
    );
  }
  return (
    <View testID={testID} style={base}>
      {children}
    </View>
  );
}
