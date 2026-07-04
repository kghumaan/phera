import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PheraChip } from '@/components/ui';
import { isPreviewMode } from '@/lib/supabase/client';
import { COLORS, SPACING } from '@/lib/theme/tokens';

interface ScreenProps {
  children: ReactNode;
  /** Set false for screens that manage their own scrolling (lists, chat). */
  scroll?: boolean;
}

/**
 * Standard admin screen chrome: safe-area padding, paper background,
 * 20px horizontal padding, and the "Preview data" badge when running
 * against mock fixtures.
 */
export function Screen({ children, scroll = true }: ScreenProps) {
  const insets = useSafeAreaInsets();

  const inner = (
    <View style={{ flex: 1, paddingHorizontal: SPACING.screenX, gap: 20 }}>
      {isPreviewMode ? (
        <View style={{ alignItems: 'flex-start' }}>
          <PheraChip label="Preview data" tone="info" />
        </View>
      ) : null}
      {children}
    </View>
  );

  if (!scroll) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg.muted, paddingTop: insets.top + 12 }}>
        {inner}
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.bg.muted }}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 32 }}
    >
      {inner}
    </ScrollView>
  );
}
