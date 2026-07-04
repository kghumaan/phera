import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { PageHeading, PheraCard, PheraChip, PheraText } from '@/components/ui';
import { useWedding } from '@/lib/data/hooks';
import { COLORS } from '@/lib/theme/tokens';
import { useWeddingSlug } from '@/lib/nav';

function Row({
  icon,
  label,
  value,
  warn,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 999,
          backgroundColor: COLORS.brand.primarySubtle,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={18} color={COLORS.brand.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <PheraText variant="body2" color={COLORS.text.subtle}>
          {label}
        </PheraText>
        <PheraText variant="body" weight={500} color={warn ? COLORS.accent.warningText : undefined}>
          {value}
        </PheraText>
      </View>
    </View>
  );
}

function prettyDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function DetailsScreen() {
  const weddingSlug = useWeddingSlug();
  const router = useRouter();
  const wedding = useWedding(weddingSlug);

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
  // TBD placeholder conventions from CLAUDE.md (epoch dates / 'Venue TBD').
  const venueTbd = !w.venue_name || w.venue_name === 'Venue TBD';
  const isLive = w.status === 'live';

  return (
    <Screen onRefresh={() => wedding.refetch()} refreshing={wedding.isRefetching}>
      <PageHeading
        title="Wedding Details"
        subtitle="The facts every guest page is built from"
        action={
          <Ionicons name="close" size={24} color={COLORS.text.muted} onPress={() => router.back()} />
        }
      />

      <PheraCard variant="hero" padding={20}>
        <View style={{ gap: 4, alignItems: 'center', paddingVertical: 8 }}>
          <PheraText variant="display" align="center">
            {w.couple_name}
          </PheraText>
          <PheraText variant="body2" align="center">
            {w.wedding_date_display}
          </PheraText>
          <View style={{ marginTop: 8 }}>
            <PheraChip label={isLive ? 'Live' : 'Draft'} tone={isLive ? 'success' : 'warning'} />
          </View>
        </View>
      </PheraCard>

      <PheraCard padding={20}>
        <View style={{ gap: 18 }}>
          <Row
            icon="heart-outline"
            label="Couple"
            value={
              w.partner1_name && w.partner2_name
                ? `${w.partner1_name} & ${w.partner2_name}`
                : w.couple_name
            }
          />
          <Row
            icon="location-outline"
            label="Venue"
            value={venueTbd ? 'Venue TBD' : `${w.venue_name} · ${w.venue_location}`}
            warn={venueTbd}
          />
          <Row
            icon="calendar-outline"
            label="Dates"
            value={
              w.wedding_date_end && w.wedding_date_end !== w.wedding_date
                ? `${prettyDate(w.wedding_date)} – ${prettyDate(w.wedding_date_end)}`
                : prettyDate(w.wedding_date)
            }
          />
          <Row icon="mail-unread-outline" label="RSVP deadline" value={prettyDate(w.rsvp_deadline)} />
          <Row icon="link-outline" label="Guest site" value={`phera.io/${w.slug}`} />
        </View>
      </PheraCard>

      <PheraText variant="body2" color={COLORS.text.faint} align="center">
        Editing details happens on the web for now — the Planner can also update them by chat.
      </PheraText>
    </Screen>
  );
}
