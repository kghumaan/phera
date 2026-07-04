import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { Screen } from '@/components/Screen';
import { PageHeading, PheraCard, PheraText, SectionHeading, StatCard } from '@/components/ui';
import { MOCK_NEXT_ACTIONS, MOCK_STATS, MOCK_WEDDING } from '@/lib/mock/wedding';
import { COLORS } from '@/lib/theme/tokens';

function daysToGo(dateISO: string): number {
  const diff = new Date(dateISO).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86_400_000));
}

export default function OverviewScreen() {
  // TODO(Phase 1): replace mock fixtures with Supabase queries (guests,
  // rsvps aggregates) via src/lib/data hooks. Layout is the keeper.
  const stats = MOCK_STATS;

  return (
    <Screen>
      <PageHeading
        title={MOCK_WEDDING.coupleNames}
        subtitle={`${MOCK_WEDDING.city} · ${daysToGo(MOCK_WEDDING.weddingDate)} days to go`}
      />

      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <StatCard
            icon={<Ionicons name="people-outline" size={20} color={COLORS.brand.primary} />}
            value={stats.totalGuests}
            label="Total guests"
          />
          <StatCard
            icon={<Ionicons name="checkmark-circle-outline" size={20} color={COLORS.accent.success} />}
            value={stats.rsvpYes}
            label="Attending"
          />
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <StatCard
            icon={<Ionicons name="hourglass-outline" size={20} color={COLORS.accent.warning} />}
            value={stats.rsvpPending}
            label="RSVPs pending"
          />
          <StatCard
            icon={<Ionicons name="airplane-outline" size={20} color={COLORS.side.groom} />}
            value={stats.travelCollected}
            label="Travel collected"
          />
        </View>
      </View>

      <View style={{ gap: 12 }}>
        <SectionHeading title="Next actions" subtitle="What Phera suggests doing today" />
        {MOCK_NEXT_ACTIONS.map((action) => (
          <PheraCard key={action.id} onPress={() => {}}>
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
