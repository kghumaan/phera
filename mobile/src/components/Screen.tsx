import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';

import { PheraChip } from '@/components/ui';
import { useAuth } from '@/lib/auth/AuthContext';
import { disableDemoMode, isDemoMode, isPreviewMode } from '@/lib/supabase/client';
import { COLORS, SPACING } from '@/lib/theme/tokens';

interface ScreenProps {
  children: ReactNode;
  /** Set false for screens that manage their own scrolling (lists, chat). */
  scroll?: boolean;
  /** Pull-to-refresh handler (scroll mode only). */
  onRefresh?: () => Promise<unknown>;
  refreshing?: boolean;
}

/** Mode badge: preview builds get a passive chip; the runtime demo tour
 *  gets a tappable one that exits back to the welcome fork. */
function ModeBadge() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { signOut } = useAuth();

  if (isDemoMode()) {
    return (
      <Pressable
        accessibilityRole="button"
        testID="exit-demo"
        onPress={() => {
          void (async () => {
            disableDemoMode();
            await signOut();
            queryClient.clear();
            router.replace('/login');
          })();
        }}
        style={{ alignSelf: 'flex-start' }}
      >
        <PheraChip label="Demo wedding — tap to exit" tone="brand" />
      </Pressable>
    );
  }
  if (isPreviewMode) {
    return (
      <View style={{ alignItems: 'flex-start' }}>
        <PheraChip label="Preview data" tone="info" />
      </View>
    );
  }
  return null;
}

/**
 * Standard admin screen chrome: safe-area padding, muted background,
 * 20px horizontal padding, pull-to-refresh, and the mode badge when
 * running against mock fixtures (preview build or demo tour).
 */
export function Screen({ children, scroll = true, onRefresh, refreshing = false }: ScreenProps) {
  const insets = useSafeAreaInsets();

  const inner = (
    <View style={{ flex: 1, paddingHorizontal: SPACING.screenX, gap: 20 }}>
      <ModeBadge />
      {children}
    </View>
  );

  if (!scroll) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg.muted, paddingTop: insets.top }}>
        {inner}
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.bg.muted }}
      // Safe-area top only; generous bottom so content never crowds the
      // home indicator or tab bar.
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 48 }}
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
