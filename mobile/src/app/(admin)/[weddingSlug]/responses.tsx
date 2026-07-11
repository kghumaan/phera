import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { Screen } from '@/components/Screen';
import {
  EmptyState,
  PageHeading,
  PheraCard,
  PheraChip,
  PheraText,
  SectionHeading,
} from '@/components/ui';
import { useRsvps } from '@/lib/data/hooks';
import { aggregateRsvps, type Rsvp } from '@/lib/data/types';
import { COLORS } from '@/lib/theme/tokens';
import { useWeddingSlug } from '@/lib/nav';

// Web guest-responses parity: status chips use the BASE accent colors at
// 10% alpha (a deliberate divergence from the guest-list Text/Bg chips).
const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  yes: { label: 'Attending', color: COLORS.accent.success, bg: 'rgba(16, 185, 129, 0.1)' },
  no: { label: 'Not Attending', color: COLORS.accent.danger, bg: 'rgba(239, 68, 68, 0.1)' },
  maybe: { label: 'Maybe', color: COLORS.accent.warning, bg: 'rgba(244, 170, 42, 0.1)' },
};

function AttendingChip({ attending }: { attending: Rsvp['attending'] }) {
  const meta = STATUS_META[attending] ?? {
    label: 'No response',
    color: COLORS.text.subtle,
    bg: 'rgba(104, 104, 104, 0.1)',
  };
  return (
    <View
      style={{
        backgroundColor: meta.bg,
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 5,
        alignSelf: 'flex-start',
      }}
    >
      <PheraText variant="body2" weight={700} color={meta.color}>
        {meta.label}
      </PheraText>
    </View>
  );
}

function StatPill({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
      <PheraText variant="h1" weight={700} color={color}>
        {value}
      </PheraText>
      <PheraText variant="body2">{label}</PheraText>
    </View>
  );
}

export default function ResponsesScreen() {
  const weddingSlug = useWeddingSlug();
  const router = useRouter();
  const rsvps = useRsvps(weddingSlug);

  const list = rsvps.data ?? [];
  const stats = aggregateRsvps(list);
  const dietary = list.filter(
    (r) => r.attending === 'yes' && (r.dietary_restrictions || (r.food_preference?.length ?? 0) > 0),
  );

  return (
    <Screen onRefresh={() => rsvps.refetch()} refreshing={rsvps.isRefetching}>
      <PageHeading
        title="Guest Responses"
        subtitle={`${list.length} responses so far`}
        action={
          <Ionicons
            name="close"
            size={24}
            color={COLORS.text.muted}
            onPress={() => router.back()}
          />
        }
      />

      {/* Web stat cards: Total · Attending (head-count incl. plus-ones) ·
          Maybe · Not Attending */}
      <PheraCard>
        <View style={{ flexDirection: 'row' }}>
          <StatPill value={stats.total} label="RSVPs" color={COLORS.brand.primary} />
          <StatPill
            value={stats.totalGuestsComing}
            label="Attending"
            color={COLORS.accent.success}
          />
          <StatPill value={stats.maybe} label="Maybe" color={COLORS.accent.warning} />
          <StatPill value={stats.notAttending} label="Not Attending" color={COLORS.accent.danger} />
        </View>
      </PheraCard>

      {dietary.length > 0 ? (
        <View style={{ gap: 12 }}>
          <SectionHeading title="Dietary needs" subtitle="From attending guests" />
          {dietary.map((r) => (
            <PheraCard key={r.id} variant="muted">
              <PheraText variant="body" weight={500}>
                {r.guest?.name ?? 'Guest'}
              </PheraText>
              <PheraText variant="body2">
                {[...(r.food_preference ?? []), r.dietary_restrictions].filter(Boolean).join(' · ')}
              </PheraText>
            </PheraCard>
          ))}
        </View>
      ) : null}

      <View style={{ gap: 12 }}>
        <SectionHeading title="All responses" />
        {list.length === 0 ? (
          <EmptyState
            icon="mail-open-outline"
            title="No responses yet"
            subtitle="RSVPs will appear here the moment guests reply."
          />
        ) : (
          list.map((r) => (
            <PheraCard key={r.id}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 999,
                    backgroundColor: r.guest?.avatar_color ?? COLORS.text.faint,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <PheraText variant="body2" weight={600} color={COLORS.text.inverse}>
                    {(r.guest?.name ?? '?')
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((wd) => wd[0]?.toUpperCase() ?? '')
                      .join('')}
                  </PheraText>
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <PheraText variant="body" weight={500}>
                    {r.guest?.name ?? 'Guest'}
                  </PheraText>
                  {r.plus_one && r.plus_one_name ? (
                    <PheraText variant="body2" color={COLORS.text.subtle}>
                      + {r.plus_one_name}
                    </PheraText>
                  ) : null}
                  <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                    <AttendingChip attending={r.attending} />
                    {r.attending === 'yes' && (r.guest_count ?? 1) > 1 ? (
                      <PheraChip label={`Party of ${r.guest_count}`} tone="info" />
                    ) : null}
                  </View>
                  {r.attending === 'maybe' && r.maybe_comment ? (
                    <PheraText variant="body2">{r.maybe_comment}</PheraText>
                  ) : null}
                  {r.song_request ? (
                    <PheraText variant="body2">🎵 {r.song_request}</PheraText>
                  ) : null}
                  {r.special_message ? (
                    <PheraText variant="body2" style={{ fontStyle: 'italic' }}>
                      “{r.special_message}”
                    </PheraText>
                  ) : null}
                </View>
              </View>
            </PheraCard>
          ))
        )}
      </View>
    </Screen>
  );
}
