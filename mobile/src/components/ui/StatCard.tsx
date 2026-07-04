import type { ReactNode } from 'react';
import { View } from 'react-native';

import { COLORS } from '@/lib/theme/tokens';
import { PheraCard } from './PheraCard';
import { PheraText } from './PheraText';

export interface StatCardProps {
  icon?: ReactNode;
  value: string | number;
  label: string;
  onPress?: () => void;
  selected?: boolean;
}

/** Port of web `StatCard` (components/shared/StatCard.tsx). */
export function StatCard({ icon, value, label, onPress, selected }: StatCardProps) {
  return (
    <PheraCard
      variant={selected ? 'feature' : 'default'}
      onPress={onPress}
      style={{ flex: 1, ...(selected ? { backgroundColor: COLORS.brand.primaryWash } : null) }}
    >
      <View style={{ gap: 8 }}>
        {icon}
        <PheraText variant="h1" weight={700}>
          {value}
        </PheraText>
        <PheraText variant="body2">{label}</PheraText>
      </View>
    </PheraCard>
  );
}
