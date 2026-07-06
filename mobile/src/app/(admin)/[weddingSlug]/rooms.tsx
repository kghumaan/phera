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
import { guestTags, type WeddingSide } from '@/lib/data/types';
import { getTagColor } from '@/lib/theme/tag-color';
import { COLORS, RADII } from '@/lib/theme/tokens';
import { useWeddingSlug } from '@/lib/nav';

// Web room-assignments slot tints: bride = rani pink, groom = sky blue,
// both = plum (each at ~10% bg / 35% border).
const SIDE_TINT: Record<WeddingSide | 'none', { bg: string; border: string }> = {
  bride: { bg: 'rgba(222, 63, 94, 0.10)', border: 'rgba(222, 63, 94, 0.35)' },
  groom: { bg: 'rgba(73, 185, 212, 0.12)', border: 'rgba(73, 185, 212, 0.45)' },
  both: { bg: 'rgba(128, 85, 145, 0.10)', border: 'rgba(128, 85, 145, 0.35)' },
  none: { bg: 'rgba(0, 0, 0, 0.04)', border: 'rgba(0, 0, 0, 0.12)' },
};

export default function RoomsScreen() {
  const weddingSlug = useWeddingSlug();
  const router = useRouter();
  const rooms = useRooms(weddingSlug);
  const guests = useGuests(weddingSlug);

  const list = rooms.data ?? [];
  const guestById = new Map((guests.data ?? []).map((g) => [g.id, g]));
  // Same math as web room-assignments header: union of assigned ids.
  const placed = new Set(list.flatMap((r) => r.assigned_guest_ids)).size;
  const totalGuests = guests.data?.length ?? 0;
  const remaining = Math.max(0, totalGuests - placed);

  const byHotel = new Map<string, typeof list>();
  for (const r of list) {
    const k = r.hotel_name ?? 'Unassigned hotel';
    byHotel.set(k, [...(byHotel.get(k) ?? []), r]);
  }

  return (
    <Screen onRefresh={() => rooms.refetch()} refreshing={rooms.isRefetching}>
      <PageHeading
        title="Room Assignments"
        subtitle={`${placed}/${totalGuests} guests placed${remaining > 0 ? ` — ${remaining} to go` : ''}`}
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
                      <View style={{ gap: 6 }}>
                        {room.assigned_guest_ids.map((id) => {
                          const g = guestById.get(id);
                          const tint = SIDE_TINT[g?.wedding_side ?? 'none'];
                          const tag = g ? guestTags(g)[0] : undefined;
                          const tagColor = tag ? getTagColor(tag) : null;
                          return (
                            <View
                              key={id}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 8,
                                backgroundColor: tint.bg,
                                borderWidth: 1,
                                borderColor: tint.border,
                                borderRadius: RADII.sm,
                                paddingHorizontal: 10,
                                paddingVertical: 8,
                              }}
                            >
                              <PheraText variant="body2" weight={500} style={{ flex: 1 }}>
                                {g?.name ?? 'Unnamed guest'}
                              </PheraText>
                              {tag && tagColor ? (
                                <View
                                  style={{
                                    backgroundColor: tagColor.bg,
                                    borderWidth: 1,
                                    borderColor: tagColor.border,
                                    borderRadius: RADII.pill,
                                    paddingHorizontal: 8,
                                    paddingVertical: 2,
                                  }}
                                >
                                  <PheraText variant="body2" weight={600} color={tagColor.fg}>
                                    {tag}
                                  </PheraText>
                                </View>
                              ) : null}
                            </View>
                          );
                        })}
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
