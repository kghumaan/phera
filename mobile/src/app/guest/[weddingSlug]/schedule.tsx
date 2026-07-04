import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState, PageHeading, PheraCard, PheraChip, PheraText } from '@/components/ui';
import { useSchedule, useWedding } from '@/lib/data/hooks';
import { COLORS, SPACING } from '@/lib/theme/tokens';
import { useWeddingSlug } from '@/lib/nav';

function prettyDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export default function GuestScheduleScreen() {
  const weddingSlug = useWeddingSlug();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const wedding = useWedding(weddingSlug);
  const schedule = useSchedule(wedding.data?.id);

  const days = schedule.data ?? [];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.bg.paper }}
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 48,
        paddingHorizontal: SPACING.screenX,
        gap: 16,
      }}
    >
      <PageHeading
        title="Schedule"
        subtitle={wedding.data?.wedding_date_display ?? ''}
        action={
          <Ionicons name="close" size={24} color={COLORS.text.muted} onPress={() => router.back()} />
        }
      />
      {days.length === 0 ? (
        <EmptyState icon="calendar-outline" title="Schedule coming soon" subtitle="The couple is still finalizing timings — check back!" />
      ) : (
        days.map((day) => (
          <View key={day.id} style={{ gap: 10 }}>
            <PheraText variant="h2">{day.day_name}</PheraText>
            <PheraText variant="body2" style={{ marginTop: -6 }}>
              {prettyDate(day.date)}
            </PheraText>
            {day.events.map((item) => (
              <PheraCard key={item.id} variant={item.is_major_event ? 'feature' : 'default'}>
                <View style={{ gap: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <PheraText variant="h3" style={{ flex: 1 }}>
                      {item.name}
                    </PheraText>
                    {item.is_major_event ? <PheraChip label="Main event" tone="brand" /> : null}
                  </View>
                  <PheraText variant="body2" weight={500} color={COLORS.text.strong}>
                    {item.time}
                    {item.location ? ` · ${item.location}` : ''}
                  </PheraText>
                  {item.description ? <PheraText variant="body2">{item.description}</PheraText> : null}
                </View>
              </PheraCard>
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );
}
