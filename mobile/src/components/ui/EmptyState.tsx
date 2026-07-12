import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, RADII } from '@/lib/theme/tokens';
import { PheraText } from './PheraText';

export interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

/** Port of web `EmptyState` (components/shared/EmptyState.tsx). */
export function EmptyState({ icon = 'sparkles-outline', title, subtitle, action }: EmptyStateProps) {
  return (
    <View style={{ alignItems: 'center', gap: 12, paddingVertical: 48, paddingHorizontal: 24 }}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: RADII.pill,
          backgroundColor: COLORS.brand.primarySubtle,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={28} color={COLORS.brand.primary} />
      </View>
      <PheraText variant="h3" align="center">
        {title}
      </PheraText>
      {subtitle ? (
        <PheraText variant="body2" align="center" style={{ maxWidth: 280 }}>
          {subtitle}
        </PheraText>
      ) : null}
      {action}
    </View>
  );
}
