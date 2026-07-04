import { Redirect, useRouter } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState, PageHeading, PheraCard, PheraText } from '@/components/ui';
import { useAuth } from '@/lib/auth/AuthContext';
import { useWeddings } from '@/lib/data/hooks';
import { COLORS, SPACING } from '@/lib/theme/tokens';

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.bg.paper,
      }}
    >
      {children}
    </View>
  );
}

/**
 * Entry: resolves auth → the user's weddings. One wedding goes straight
 * to its overview; several show the switcher; none shows the web hand-off
 * (onboarding ports in Phase 6).
 */
export default function Index() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const weddings = useWeddings();
  const insets = useSafeAreaInsets();

  if (loading || (user && weddings.isLoading)) {
    return (
      <Centered>
        <ActivityIndicator color={COLORS.brand.primary} />
      </Centered>
    );
  }

  if (!user) return <Redirect href="/login" />;

  const list = weddings.data ?? [];

  if (list.length === 1) return <Redirect href={`/${list[0]!.slug}/overview`} />;

  if (list.length === 0) {
    return (
      <Centered>
        <EmptyState
          icon="heart-outline"
          title="No wedding yet"
          subtitle="Create your wedding at phera.io — it will appear here the moment it exists."
        />
      </Centered>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.bg.muted,
        paddingTop: insets.top + 12,
        paddingHorizontal: SPACING.screenX,
        gap: 16,
      }}
    >
      <PageHeading title="Your weddings" subtitle="Pick one to manage" />
      {list.map((w) => (
        <PheraCard key={w.id} onPress={() => router.push(`/${w.slug}/overview`)}>
          <PheraText variant="h3">{w.couple_name}</PheraText>
          <PheraText variant="body2">
            {w.venue_location} · {w.wedding_date_display}
          </PheraText>
        </PheraCard>
      ))}
    </View>
  );
}
