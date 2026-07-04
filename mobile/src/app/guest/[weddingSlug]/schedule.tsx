import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { GuestScreen } from '@/components/guest/GuestChrome';
import { EmptyState, PheraText } from '@/components/ui';
import { useSchedule, useWedding } from '@/lib/data/hooks';
import type { ScheduleItem } from '@/lib/data/types';
import { COLORS, FONT, RADII, TEXT } from '@/lib/theme/tokens';
import { useWeddingSlug } from '@/lib/nav';

// Mirrors web guest schedule: white day cards on the sage texture,
// uppercase tracked day headings ("WEDNESDAY - NOVEMBER 18, 2026"),
// rows with a pink accent bar for major events, time right-aligned,
// location pin, hairline dividers.

function dayHeading(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso.toUpperCase();
  return d
    .toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    .replace(',', ' -')
    .toUpperCase();
}

function Row({ item, last }: { item: ScheduleItem; last: boolean }) {
  return (
    <View style={[styles.row, !last && styles.rowDivider]}>
      {item.is_major_event ? <View style={styles.accentBar} /> : null}
      <View style={{ flex: 1, gap: 6, paddingLeft: item.is_major_event ? 14 : 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <PheraText variant="h2" style={{ flex: 1 }}>
            {item.name}
          </PheraText>
          <PheraText variant="h3" weight={600}>
            {item.time}
          </PheraText>
        </View>
        {item.description ? <PheraText variant="body2" style={{ fontSize: TEXT.base }}>{item.description}</PheraText> : null}
        {item.location ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="location-sharp" size={16} color={COLORS.text.muted} />
            <PheraText variant="body2" style={{ fontSize: TEXT.base }}>
              {item.location}
            </PheraText>
          </View>
        ) : null}
        {item.is_major_event ? (
          <PheraText
            variant="body"
            weight={600}
            color={COLORS.brand.primary}
            style={{ textDecorationLine: 'underline' }}
          >
            More Details {'>'}
          </PheraText>
        ) : null}
      </View>
    </View>
  );
}

export default function GuestScheduleScreen() {
  const weddingSlug = useWeddingSlug();
  const wedding = useWedding(weddingSlug);
  const schedule = useSchedule(wedding.data?.id);
  const days = schedule.data ?? [];

  return (
    <GuestScreen title="Schedule & Events" background="jade">
      {days.length === 0 ? (
        <EmptyState icon="calendar-outline" title="Schedule coming soon" subtitle="The couple is still finalizing timings — check back!" />
      ) : (
        days.map((day) => (
          <View key={day.id} style={styles.dayCard}>
            <PheraText style={styles.dayHeading}>{dayHeading(day.date)}</PheraText>
            {day.events.map((item, i) => (
              <Row key={item.id} item={item} last={i === day.events.length - 1} />
            ))}
          </View>
        ))
      )}
    </GuestScreen>
  );
}

const styles = StyleSheet.create({
  dayCard: {
    backgroundColor: COLORS.bg.white,
    borderRadius: RADII.dialog,
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 4,
  },
  dayHeading: {
    fontFamily: FONT.medium,
    fontSize: TEXT.xl,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: COLORS.text.strong,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 18,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  accentBar: {
    width: 5,
    borderRadius: 3,
    backgroundColor: COLORS.brand.primary,
    alignSelf: 'stretch',
  },
});
