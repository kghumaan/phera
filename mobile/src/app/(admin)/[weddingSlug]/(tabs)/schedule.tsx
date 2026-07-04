import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View } from 'react-native';

import { Screen } from '@/components/Screen';
import {
  EmptyState,
  PageHeading,
  PheraCard,
  PheraChip,
  PheraText,
} from '@/components/ui';
import { useSchedule, useWedding } from '@/lib/data/hooks';
import type { ScheduleItem } from '@/lib/data/types';
import { COLORS } from '@/lib/theme/tokens';
import { useWeddingSlug } from '@/lib/nav';

function prettyDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function TimelineRow({ item, last }: { item: ScheduleItem; last: boolean }) {
  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <View style={{ alignItems: 'center', width: 14 }}>
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 999,
            marginTop: 6,
            backgroundColor: item.is_major_event ? COLORS.brand.primary : COLORS.border.strong,
          }}
        />
        {!last ? (
          <View style={{ flex: 1, width: 2, backgroundColor: COLORS.border.light, marginTop: 2 }} />
        ) : null}
      </View>
      <View style={{ flex: 1, paddingBottom: last ? 0 : 16, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <PheraText variant="body" weight={item.is_major_event ? 600 : 500}>
            {item.name}
          </PheraText>
          {item.is_major_event ? <PheraChip label="Main event" tone="brand" /> : null}
        </View>
        <PheraText variant="body2">
          {item.time}
          {item.location ? ` · ${item.location}` : ''}
        </PheraText>
        {item.location === 'Venue TBD' ? (
          <PheraText variant="body2" color={COLORS.accent.warningText}>
            Venue still to be decided
          </PheraText>
        ) : null}
        {item.description ? (
          <PheraText variant="body2" color={COLORS.text.subtle}>
            {item.description}
          </PheraText>
        ) : null}
      </View>
    </View>
  );
}

export default function ScheduleScreen() {
  const weddingSlug = useWeddingSlug();
  const wedding = useWedding(weddingSlug);
  const schedule = useSchedule(wedding.data?.id);

  const loading = wedding.isLoading || schedule.isLoading;
  const days = schedule.data ?? [];

  return (
    <Screen onRefresh={() => schedule.refetch()} refreshing={schedule.isRefetching}>
      <PageHeading
        title="Schedule"
        subtitle={wedding.data ? wedding.data.wedding_date_display : 'Events across your wedding week'}
      />

      {loading ? (
        <View style={{ paddingTop: 80, alignItems: 'center' }}>
          <ActivityIndicator color={COLORS.brand.primary} />
        </View>
      ) : days.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title="No schedule yet"
          subtitle="Build your day-by-day schedule on the web app — editing arrives on mobile in a later phase."
        />
      ) : (
        days.map((day) => (
          <View key={day.id} style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="calendar-clear-outline" size={16} color={COLORS.brand.primary} />
              <View>
                <PheraText variant="h3">{day.day_name}</PheraText>
                <PheraText variant="body2">{prettyDate(day.date)}</PheraText>
              </View>
            </View>
            <PheraCard>
              {day.events.length === 0 ? (
                <PheraText variant="body2">No items for this day yet.</PheraText>
              ) : (
                day.events.map((item, i) => (
                  <TimelineRow key={item.id} item={item} last={i === day.events.length - 1} />
                ))
              )}
            </PheraCard>
          </View>
        ))
      )}
    </Screen>
  );
}
