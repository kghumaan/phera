import { useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';

import { Screen } from '@/components/Screen';
import {
  EmptyState,
  PageHeading,
  PheraCard,
  PheraChip,
  PheraInput,
  PheraText,
  type PheraChipTone,
} from '@/components/ui';
import { MOCK_GUESTS, type MockGuest } from '@/lib/mock/wedding';
import { COLORS } from '@/lib/theme/tokens';

const SIDE_TONE: Record<MockGuest['wedding_side'], PheraChipTone> = {
  bride: 'side-bride',
  groom: 'side-groom',
  both: 'side-both',
};

function attendingChip(attending: MockGuest['attending']) {
  switch (attending) {
    case 'yes':
      return <PheraChip label="Attending" tone="success" />;
    case 'no':
      return <PheraChip label="Not attending" tone="danger" />;
    case 'maybe':
      return <PheraChip label="Maybe" tone="warning" />;
    default:
      return <PheraChip label="No RSVP" tone="neutral" />;
  }
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
}

export default function GuestsScreen() {
  // TODO(Phase 1): swap fixtures for a Supabase query + filters/sheet detail.
  const [search, setSearch] = useState('');

  const guests = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return MOCK_GUESTS;
    return MOCK_GUESTS.filter((g) => g.name.toLowerCase().includes(q));
  }, [search]);

  return (
    <Screen scroll={false}>
      <PageHeading title="Guest List" subtitle={`${MOCK_GUESTS.length} guests`} />
      <PheraInput
        placeholder="Search guests…"
        value={search}
        onChangeText={setSearch}
        autoCorrect={false}
      />
      <FlatList
        data={guests}
        keyExtractor={(g) => g.id}
        contentContainerStyle={{ gap: 10, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="search-outline"
            title="No guests found"
            subtitle="Try a different name."
          />
        }
        renderItem={({ item }) => (
          <PheraCard onPress={() => {}}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 999,
                  backgroundColor: item.avatar_color,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <PheraText variant="body2" weight={600} color={COLORS.text.inverse}>
                  {initials(item.name)}
                </PheraText>
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <PheraText variant="body" weight={500}>
                  {item.name}
                </PheraText>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <PheraChip
                    label={item.wedding_side === 'both' ? 'Both sides' : `${item.wedding_side}'s side`}
                    tone={SIDE_TONE[item.wedding_side]}
                  />
                  {attendingChip(item.attending)}
                </View>
              </View>
            </View>
          </PheraCard>
        )}
      />
    </Screen>
  );
}
