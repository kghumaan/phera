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
import { useGuests, useRooms } from '@/lib/data/hooks';
import { COLORS } from '@/lib/theme/tokens';
import { useWeddingSlug } from '@/lib/nav';

export default function RoomsScreen() {
  const weddingSlug = useWeddingSlug();
  const router = useRouter();
  const rooms = useRooms(weddingSlug);
  const guests = useGuests(weddingSlug);

  const list = rooms.data ?? [];
  const guestName = new Map((guests.data ?? []).map((g) => [g.id, g.name]));
  // Same math as web room-assignments header: union of assigned ids.
  const placed = new Set(list.flatMap((r) => r.assigned_guest_ids)).size;
  const totalGuests = guests.data?.length ?? 0;

  const byHotel = new Map<string, typeof list>();
  for (const r of list) {
    const k = r.hotel_name ?? 'Unassigned hotel';
    byHotel.set(k, [...(byHotel.get(k) ?? []), r]);
  }

  return (
    <Screen onRefresh={() => rooms.refetch()} refreshing={rooms.isRefetching}>
      <PageHeading
        title="Room Assignments"
        subtitle={`${placed}/${totalGuests} guest parties placed`}
        action={
          <Ionicons name="close" size={24} color={COLORS.text.muted} onPress={() => router.back()} />
        }
      />

      {list.length === 0 ? (
        <EmptyState
          icon="bed-outline"
          title="No rooms yet"
          subtitle="Import your hotel room block on the web app — assignments show here."
        />
      ) : (
        [...byHotel.entries()].map(([hotel, hotelRooms]) => (
          <View key={hotel} style={{ gap: 10 }}>
            <SectionHeading title={hotel} subtitle={`${hotelRooms.length} rooms`} />
            {hotelRooms.map((room) => {
              const cap = room.capacity ?? room.assigned_guest_ids.length;
              const full = cap > 0 && room.assigned_guest_ids.length >= cap;
              return (
                <PheraCard key={room.id}>
                  <View style={{ gap: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <PheraText variant="body" weight={600} style={{ flex: 1 }}>
                        Room {room.room_number}
                        {room.floor ? ` · Floor ${room.floor}` : ''}
                      </PheraText>
                      <PheraChip
                        label={`${room.assigned_guest_ids.length}/${cap || '—'} placed`}
                        tone={full ? 'success' : 'neutral'}
                      />
                    </View>
                    {room.bed_type ? <PheraText variant="body2">{room.bed_type}</PheraText> : null}
                    {room.assigned_guest_ids.length > 0 ? (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                        {room.assigned_guest_ids.map((id) => (
                          <PheraChip key={id} label={guestName.get(id) ?? 'Guest'} tone="brand" />
                        ))}
                      </View>
                    ) : (
                      <PheraText variant="body2" color={COLORS.text.faint}>
                        Empty — assign on web or ask the Planner
                      </PheraText>
                    )}
                    {room.notes ? (
                      <PheraText variant="body2" color={COLORS.text.subtle}>
                        {room.notes}
                      </PheraText>
                    ) : null}
                  </View>
                </PheraCard>
              );
            })}
          </View>
        ))
      )}
    </Screen>
  );
}
