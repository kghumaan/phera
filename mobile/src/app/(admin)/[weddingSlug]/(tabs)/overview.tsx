import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { PageHeading, PheraCard, PheraChip, PheraText, SectionHeading, StatCard } from '@/components/ui';
import { useGuests, useRoadmap, useRsvps, useWedding, type RoadmapStatus } from '@/lib/data/hooks';
import { aggregateRsvps } from '@/lib/data/types';
import { COLORS } from '@/lib/theme/tokens';
import { useWeddingSlug } from '@/lib/nav';

function daysToGo(dateISO: string): number {
  const diff = new Date(dateISO).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86_400_000));
}

// Web overview roadmap (QuickLinks) — same six steps, same completion rules.
const ROADMAP: {
  key: keyof RoadmapStatus;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtext: string;
  route: string | null; // null = web-only surface
  pro: boolean;
}[] = [
  { key: 'guests', icon: 'people-outline', label: 'Import Guest List', subtext: 'Add everyone we should reach out to.', route: 'guests', pro: false },
  { key: 'details', icon: 'globe-outline', label: 'Create Wedding Website', subtext: 'Fill in details for guests + Concierge.', route: 'details', pro: false },
  { key: 'whatsappBot', icon: 'logo-whatsapp', label: 'Enable WhatsApp Bot', subtext: 'Send invites + 24/7 reply bot for your guests.', route: 'messaging', pro: true },
  { key: 'rooms', icon: 'bed-outline', label: 'Set Up Room Assignments', subtext: 'Place guests into hotel rooms.', route: 'rooms', pro: true },
  { key: 'transportation', icon: 'bus-outline', label: 'Coordinate Guest Transportation', subtext: 'Shuttles, airport pickups, venue transfers.', route: 'transportation', pro: true },
  { key: 'vendors', icon: 'briefcase-outline', label: 'Track Vendor Conversations', subtext: 'Summaries + action items from vendor groups.', route: null, pro: true },
];

function RoadmapRow({
  item,
  done,
  onPress,
}: {
  item: (typeof ROADMAP)[number];
  done: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item.label}
      onPress={onPress}
      disabled={!onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: done ? 'rgba(222, 63, 94, 0.15)' : COLORS.border.light,
        backgroundColor: done ? 'rgba(222, 63, 94, 0.03)' : COLORS.bg.white,
        opacity: done ? 0.75 : 1,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 999,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: done ? COLORS.brand.primary : COLORS.brand.primaryWash,
          borderWidth: done ? 0 : 1,
          borderColor: 'rgba(222, 63, 94, 0.3)',
        }}
      >
        {done ? (
          <Ionicons name="checkmark" size={18} color={COLORS.text.inverse} />
        ) : (
          <Ionicons name={item.icon} size={18} color={COLORS.brand.primary} />
        )}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <PheraText
            variant="body"
            weight={500}
            style={done ? { textDecorationLine: 'line-through' } : undefined}
          >
            {item.label}
          </PheraText>
          {item.pro ? <PheraChip label="PRO" tone="brand" /> : null}
        </View>
        <PheraText variant="body2">{item.subtext}</PheraText>
      </View>
      {onPress ? (
        <Ionicons name="arrow-forward" size={18} color={COLORS.text.faint} />
      ) : (
        <PheraText variant="body2" color={COLORS.text.faint}>
          On web
        </PheraText>
      )}
    </Pressable>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <PheraText variant="body2" color={COLORS.text.subtle} style={{ width: 84 }}>
        {label}
      </PheraText>
      <PheraText variant="body" weight={500} style={{ flex: 1 }}>
        {value}
      </PheraText>
    </View>
  );
}

export default function OverviewScreen() {
  const weddingSlug = useWeddingSlug();
  const router = useRouter();

  const wedding = useWedding(weddingSlug);
  const guests = useGuests(weddingSlug);
  const rsvps = useRsvps(weddingSlug);
  const roadmap = useRoadmap(weddingSlug, wedding.data);

  const refresh = () =>
    Promise.all([wedding.refetch(), guests.refetch(), rsvps.refetch(), roadmap.refetch()]);

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
  // Web overview formulas (overview/page.tsx:463): Attending = summed
  // head-count of yes records; Not Attending / Pending = record counts,
  // pending = maybe + records with no attending value.
  const stats = aggregateRsvps(rsvps.data ?? []);
  const guestCount = guests.data?.length ?? 0;

  return (
    <Screen onRefresh={refresh} refreshing={rsvps.isRefetching}>
      <PageHeading
        title={w.couple_name}
        subtitle={`${w.venue_location} · ${daysToGo(w.wedding_date)} days to go`}
      />

      <PheraCard>
        <View style={{ gap: 10 }}>
          <SummaryRow label="Couple" value={w.couple_name || 'Not set'} />
          <SummaryRow label="Date" value={w.wedding_date_display || 'Not set'} />
          <SummaryRow
            label="Venue"
            value={[w.venue_name, w.venue_location].filter(Boolean).join(', ') || 'Not set'}
          />
        </View>
      </PheraCard>

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
            value={stats.pending}
            label="Pending"
            onPress={() => router.push(`/${weddingSlug}/responses`)}
          />
          <StatCard
            icon={<Ionicons name="close-circle-outline" size={20} color={COLORS.accent.danger} />}
            value={stats.notAttending}
            label="Not attending"
            onPress={() => router.push(`/${weddingSlug}/responses`)}
          />
        </View>
      </View>

      <View style={{ gap: 12 }}>
        <SectionHeading title="Set-up roadmap" subtitle="Same checklist as your web dashboard" />
        {ROADMAP.map((item) => (
          <RoadmapRow
            key={item.key}
            item={item}
            done={!!roadmap.data?.[item.key]}
            onPress={
              item.route
                ? () => router.push(`/${weddingSlug}/${item.route}` as never)
                : undefined
            }
          />
        ))}
      </View>
    </Screen>
  );
}
