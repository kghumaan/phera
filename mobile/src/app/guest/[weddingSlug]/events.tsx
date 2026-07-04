import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState, PageHeading, PheraCard, PheraText } from '@/components/ui';
import { useEvents, useWedding } from '@/lib/data/hooks';
import { COLORS, SPACING } from '@/lib/theme/tokens';
import { useWeddingSlug } from '@/lib/nav';

function prettyDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function GuestEventsScreen() {
  const weddingSlug = useWeddingSlug();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const wedding = useWedding(weddingSlug);
  // TODO(Phase 5 follow-up): filter by guest_event_access via
  // /api/access/events/[slug]?guestId=… — preview shows all events.
  const events = useEvents(wedding.data?.id);

  const list = events.data ?? [];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.bg.paper }}
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 48,
        paddingHorizontal: SPACING.screenX,
        gap: 14,
      }}
    >
      <PageHeading
        title="Events"
        subtitle="Every celebration, and what to wear"
        action={
          <Ionicons name="close" size={24} color={COLORS.text.muted} onPress={() => router.back()} />
        }
      />
      {list.length === 0 ? (
        <EmptyState icon="sparkles-outline" title="Events coming soon" subtitle="The couple is still adding event details." />
      ) : (
        list.map((e) => (
          <PheraCard key={e.id} variant="hero" padding={20}>
            <View style={{ gap: 8 }}>
              <PheraText variant="display" style={{ fontSize: 32, lineHeight: 38 }}>
                {e.name}
              </PheraText>
              <PheraText variant="body2" weight={500} color={COLORS.text.strong}>
                {prettyDate(e.date)} · {e.time}
              </PheraText>
              {e.ritual_name ? (
                <PheraText variant="body2" color={COLORS.cultural.maroon}>
                  {e.ritual_name}
                </PheraText>
              ) : null}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <Ionicons name="shirt-outline" size={16} color={COLORS.brand.primary} />
                <PheraText variant="body2" style={{ flex: 1 }}>
                  {e.dress_code}
                </PheraText>
              </View>
            </View>
          </PheraCard>
        ))
      )}
    </ScrollView>
  );
}
