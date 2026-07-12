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
import { useGuestFlights, useWedding } from '@/lib/data/hooks';
import type { GuestFlight } from '@/lib/data/types';
import { COLORS } from '@/lib/theme/tokens';
import { useWeddingSlug } from '@/lib/nav';

function dayKey(dt: string | null): string {
  return dt ? dt.slice(0, 10) : 'unknown';
}

function prettyDay(iso: string): string {
  if (iso === 'unknown') return 'Date unknown';
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function prettyTime(dt: string | null): string {
  if (!dt) return '—';
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return dt;
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function FlightCard({ flight }: { flight: GuestFlight }) {
  return (
    <PheraCard>
      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <PheraText variant="body" weight={600} style={{ flex: 1 }}>
            {flight.guest?.name ?? 'Guest'}
          </PheraText>
          {flight.shuttle_preference_time ? (
            <PheraChip label={`Shuttle ${flight.shuttle_preference_time}`} tone="info" />
          ) : (
            <PheraChip label="No shuttle pref" tone="neutral" />
          )}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Ionicons name="airplane" size={16} color={COLORS.brand.primary} />
          <PheraText variant="body2" color={COLORS.text.strong}>
            {[flight.airline, flight.flight_number].filter(Boolean).join(' ') || 'Flight TBD'}
          </PheraText>
          <PheraText variant="body2">
            {flight.departure_airport ?? '—'} → {flight.arrival_airport ?? '—'}
          </PheraText>
        </View>
        <PheraText variant="body2">
          Lands {prettyTime(flight.arrival_datetime)}
        </PheraText>
      </View>
    </PheraCard>
  );
}

export default function TravelScreen() {
  const weddingSlug = useWeddingSlug();
  const router = useRouter();
  const wedding = useWedding(weddingSlug);
  const flights = useGuestFlights(wedding.data?.id);

  const list = flights.data ?? [];
  const byDay = new Map<string, GuestFlight[]>();
  for (const f of list) {
    const k = dayKey(f.arrival_datetime);
    byDay.set(k, [...(byDay.get(k) ?? []), f]);
  }
  const days = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b));
  const shuttleCount = list.filter((f) => f.shuttle_preference_time).length;

  return (
    <Screen onRefresh={() => flights.refetch()} refreshing={flights.isRefetching}>
      <PageHeading
        title="Travel"
        subtitle={`${list.length} flights shared · ${shuttleCount} shuttle requests`}
        action={
          <Ionicons name="close" size={24} color={COLORS.text.muted} onPress={() => router.back()} />
        }
      />

      {list.length === 0 ? (
        <EmptyState
          icon="airplane-outline"
          title="No flights yet"
          subtitle="Guest flight details appear here as they submit the travel form."
        />
      ) : (
        days.map(([day, dayFlights]) => (
          <View key={day} style={{ gap: 10 }}>
            <SectionHeading
              title={prettyDay(day)}
              subtitle={`${dayFlights.length} ${dayFlights.length === 1 ? 'arrival' : 'arrivals'}`}
            />
            {dayFlights.map((f) => (
              <FlightCard key={f.id} flight={f} />
            ))}
          </View>
        ))
      )}
    </Screen>
  );
}
