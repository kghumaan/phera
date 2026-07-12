import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { EmptyState, PheraCard, PheraText } from '@/components/ui';
import { GuestScreen } from '@/components/guest/GuestChrome';
import { useEvents, useWedding } from '@/lib/data/hooks';
import { useInvitedEventIds } from '@/lib/guest/hooks';
import { COLORS } from '@/lib/theme/tokens';
import { useWeddingSlug } from '@/lib/nav';

function prettyDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function GuestEventsScreen() {
  const weddingSlug = useWeddingSlug();
  const wedding = useWedding(weddingSlug);
  const events = useEvents(wedding.data?.id);
  const invited = useInvitedEventIds(weddingSlug);

  // Default-true opt-out (web event-filter contract): null = show all.
  const list = (events.data ?? []).filter(
    (e) => invited.data == null || invited.data.includes(e.id),
  );

  return (
    <GuestScreen title="Events" background="aquarium">
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
    </GuestScreen>
  );
}
