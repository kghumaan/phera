import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Screen } from '@/components/Screen';
import {
  EmptyState,
  PageHeading,
  PheraCard,
  PheraChip,
  PheraText,
  SectionHeading,
} from '@/components/ui';
import { useReservations, useVehiclesWithCapacity, useWedding } from '@/lib/data/hooks';
import type { Vehicle } from '@/lib/data/types';
import { COLORS, RADII } from '@/lib/theme/tokens';
import { useWeddingSlug } from '@/lib/nav';

type Direction = 'arrival' | 'departure';

function prettyDateTime(dt: string): string {
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return dt;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function CapacityBar({ vehicle }: { vehicle: Vehicle }) {
  const pct = vehicle.capacity > 0 ? Math.min(1, vehicle.booked / vehicle.capacity) : 0;
  const full = vehicle.available === 0;
  return (
    <View style={{ gap: 4 }}>
      <View
        style={{
          height: 6,
          borderRadius: 3,
          backgroundColor: COLORS.bg.wash,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: `${pct * 100}%`,
            height: '100%',
            borderRadius: 3,
            backgroundColor: full ? COLORS.accent.warning : COLORS.brand.primary,
          }}
        />
      </View>
      <PheraText variant="body2" color={full ? COLORS.accent.warningText : COLORS.text.subtle}>
        {vehicle.booked}/{vehicle.capacity} seats booked{full ? ' — full' : ''}
      </PheraText>
    </View>
  );
}

export default function TransportationScreen() {
  const weddingSlug = useWeddingSlug();
  const router = useRouter();
  const wedding = useWedding(weddingSlug);
  const vehicles = useVehiclesWithCapacity(wedding.data?.id);
  const reservations = useReservations(wedding.data?.id);

  const [direction, setDirection] = useState<Direction>('arrival');

  const dirVehicles = (vehicles.data ?? []).filter((v) => v.direction === direction);
  const dirReservations = (reservations.data ?? []).filter((r) => r.direction === direction);
  const pending = dirReservations.filter((r) => r.status === 'pending');
  const confirmed = dirReservations.filter((r) => r.status === 'confirmed');

  const refresh = () => Promise.all([vehicles.refetch(), reservations.refetch()]);

  return (
    <Screen onRefresh={refresh} refreshing={vehicles.isRefetching}>
      <PageHeading
        title="Transportation"
        subtitle={`${pending.length} pending · ${confirmed.length} confirmed`}
        action={
          <Ionicons name="close" size={24} color={COLORS.text.muted} onPress={() => router.back()} />
        }
      />

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {(['arrival', 'departure'] as const).map((d) => (
          <Pressable
            key={d}
            accessibilityRole="button"
            accessibilityLabel={`direction-${d}`}
            onPress={() => setDirection(d)}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: RADII.md,
              alignItems: 'center',
              backgroundColor: direction === d ? COLORS.brand.primary : COLORS.bg.white,
              borderWidth: 1,
              borderColor: direction === d ? COLORS.brand.primary : COLORS.border.default,
            }}
          >
            <PheraText
              variant="body2"
              weight={600}
              color={direction === d ? COLORS.text.inverse : COLORS.text.muted}
            >
              {d === 'arrival' ? 'Arrivals' : 'Departures'}
            </PheraText>
          </Pressable>
        ))}
      </View>

      <View style={{ gap: 12 }}>
        <SectionHeading title="Vehicles" subtitle="Live seat capacity" />
        {dirVehicles.length === 0 ? (
          <EmptyState
            icon="bus-outline"
            title="No vehicles yet"
            subtitle="Set up shuttles on the web app — live capacity shows here."
          />
        ) : (
          dirVehicles.map((v) => (
            <PheraCard key={v.id}>
              <View style={{ gap: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="bus-outline" size={18} color={COLORS.brand.primary} />
                  <PheraText variant="body" weight={600} style={{ flex: 1 }}>
                    {v.vehicle_name ?? 'Vehicle'}
                  </PheraText>
                </View>
                <PheraText variant="body2">
                  {prettyDateTime(v.departure_datetime)}
                  {v.pickup_location ? ` · from ${v.pickup_location}` : ''}
                </PheraText>
                <CapacityBar vehicle={v} />
              </View>
            </PheraCard>
          ))
        )}
      </View>

      <View style={{ gap: 12 }}>
        <SectionHeading title="Reservations" />
        {dirReservations.length === 0 ? (
          <PheraText variant="body2">No reservations for this direction yet.</PheraText>
        ) : (
          dirReservations.map((r) => (
            <PheraCard key={r.id} variant={r.status === 'pending' ? 'feature' : 'default'}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <PheraText variant="body" weight={500}>
                    {r.guest?.name ?? r.notes ?? 'Guest'}
                  </PheraText>
                  <PheraText variant="body2">
                    Party of {r.party_size ?? 1}
                    {r.vehicle_id ? '' : ' · no vehicle assigned'}
                  </PheraText>
                </View>
                <PheraChip
                  label={r.status === 'confirmed' ? 'Confirmed' : r.status === 'pending' ? 'Pending' : 'Cancelled'}
                  tone={r.status === 'confirmed' ? 'success' : r.status === 'pending' ? 'warning' : 'neutral'}
                />
              </View>
            </PheraCard>
          ))
        )}
      </View>
    </Screen>
  );
}
