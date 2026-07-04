import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { PageHeading, PheraCard, PheraText, SectionHeading, StatCard } from '@/components/ui';
import { useGuests, useRsvps, useWedding } from '@/lib/data/hooks';
import { aggregateRsvps } from '@/lib/data/types';
import { FIXTURE_NEXT_ACTIONS } from '@/lib/mock/fixtures';
import { COLORS } from '@/lib/theme/tokens';
import { useWeddingSlug } from '@/lib/nav';

function daysToGo(dateISO: string): number {
  const diff = new Date(dateISO).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86_400_000));
}

export default function OverviewScreen() {
  const weddingSlug = useWeddingSlug();
  const router = useRouter();

  const wedding = useWedding(weddingSlug);
  const guests = useGuests(weddingSlug);
  const rsvps = useRsvps(weddingSlug);

  const refresh = () => Promise.all([wedding.refetch(), guests.refetch(), rsvps.refetch()]);

  if (wedding.isLoading || !wedding.data) {
    return (
      <Screen>
        <View style={{ paddingTop: 120, alignItems: 'center' }}>
          <ActivityIndicator color={COLORS.brand.primary} />
        </View>
      </Screen>
    );
  }

  const w = wedding.data;
  // Same math as web overview (guest-responses aggregation).
  const stats = aggregateRsvps(rsvps.data ?? []);
  const guestCount = guests.data?.length ?? 0;
  const noRsvpYet = Math.max(0, guestCount - (rsvps.data?.length ?? 0));
  const pendingTotal = stats.pending + noRsvpYet;

  return (
    <Screen onRefresh={refresh} refreshing={rsvps.isRefetching}>
      <PageHeading
        title={w.couple_name}
        subtitle={`${w.venue_location} · ${daysToGo(w.wedding_date)} days to go`}
      />

      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <StatCard
            icon={<Ionicons name="people-outline" size={20} color={COLORS.brand.primary} />}
            value={guestCount}
            label="Guest parties"
            onPress={() => router.push(`/${weddingSlug}/guests`)}
          />
          <StatCard
            icon={<Ionicons name="checkmark-circle-outline" size={20} color={COLORS.accent.success} />}
            value={stats.totalGuestsComing}
            label="Attending (head-count)"
            onPress={() => router.push(`/${weddingSlug}/responses`)}
          />
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <StatCard
            icon={<Ionicons name="hourglass-outline" size={20} color={COLORS.accent.warning} />}
            value={pendingTotal}
            label="RSVPs pending"
            onPress={() => router.push(`/${weddingSlug}/responses`)}
          />
          <StatCard
            icon={<Ionicons name="close-circle-outline" size={20} color={COLORS.text.subtle} />}
            value={stats.notAttending}
            label="Not attending"
            onPress={() => router.push(`/${weddingSlug}/responses`)}
          />
        </View>
      </View>

      <View style={{ gap: 12 }}>
        <SectionHeading title="Next actions" subtitle="What Phera suggests doing today" />
        {FIXTURE_NEXT_ACTIONS.map((action) => (
          <PheraCard key={action.id} onPress={() => router.push(`/${weddingSlug}/planner`)}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 999,
                  backgroundColor: COLORS.brand.primarySubtle,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name={action.icon} size={20} color={COLORS.brand.primary} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <PheraText variant="body" weight={500}>
                  {action.title}
                </PheraText>
                <PheraText variant="body2">{action.detail}</PheraText>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.text.faint} />
            </View>
          </PheraCard>
        ))}
      </View>
    </Screen>
  );
}
