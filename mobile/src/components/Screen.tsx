import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PheraChip } from '@/components/ui';
import { isPreviewMode } from '@/lib/supabase/client';
import { COLORS, SPACING } from '@/lib/theme/tokens';

interface ScreenProps {
  children: ReactNode;
  /** Set false for screens that manage their own scrolling (lists, chat). */
  scroll?: boolean;
  /** Pull-to-refresh handler (scroll mode only). */
  onRefresh?: () => Promise<unknown>;
  refreshing?: boolean;
}

/**
 * Standard admin screen chrome: safe-area padding, muted background,
 * 20px horizontal padding, pull-to-refresh, and the "Preview data" badge
 * when running against mock fixtures.
 */
export function Screen({ children, scroll = true, onRefresh, refreshing = false }: ScreenProps) {
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
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={COLORS.brand.primary}
            colors={[COLORS.brand.primary]}
          />
        ) : undefined
      }
    >
      {inner}
    </ScrollView>
  );
}
