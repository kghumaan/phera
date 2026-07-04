import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';

import { Screen } from '@/components/Screen';
import {
  EmptyState,
  PageHeading,
  PheraButton,
  PheraCard,
  PheraChip,
  PheraInput,
  PheraSheet,
  PheraText,
  type PheraChipTone,
} from '@/components/ui';
import { useAddGuest, useGuests } from '@/lib/data/hooks';
import type { Attending, Guest, WeddingSide } from '@/lib/data/types';
import { COLORS, RADII } from '@/lib/theme/tokens';
import { useWeddingSlug } from '@/lib/nav';

const SIDE_TONE: Record<WeddingSide, PheraChipTone> = {
  bride: 'side-bride',
  groom: 'side-groom',
  both: 'side-both',
};

const SIDE_LABEL: Record<WeddingSide, string> = {
  bride: "bride's side",
  groom: "groom's side",
  both: 'Both sides',
};

type RsvpFilter = 'all' | Attending | 'none';

const FILTERS: { key: RsvpFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'yes', label: 'Attending' },
  { key: 'maybe', label: 'Maybe' },
  { key: 'no', label: 'Declined' },
  { key: 'none', label: 'No RSVP' },
];

function guestAttending(g: Guest): Attending | null {
  return g.rsvps[0]?.attending ?? null;
}

function attendingChip(attending: Attending | null) {
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

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
}

function Avatar({ guest, size = 40 }: { guest: Guest; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        backgroundColor: guest.avatar_color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <PheraText
        variant="body2"
        weight={600}
        color={COLORS.text.inverse}
        style={size >= 56 ? { fontSize: 20, lineHeight: 26 } : undefined}
      >
        {guest.initials || initialsOf(guest.name)}
      </PheraText>
    </View>
  );
}

function DetailRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Ionicons name={icon} size={18} color={COLORS.text.subtle} />
      <View style={{ flex: 1 }}>
        <PheraText variant="body2" color={COLORS.text.subtle}>
          {label}
        </PheraText>
        <PheraText variant="body">{value}</PheraText>
      </View>
    </View>
  );
}

function GuestDetailSheet({ guest, onClose }: { guest: Guest | null; onClose: () => void }) {
  const rsvp = guest?.rsvps[0];
  const tags = guest?.logistics_data?.tags ?? [];
  return (
    <PheraSheet open={!!guest} onClose={onClose} title={guest?.name ?? ''}>
      {guest ? (
        <View style={{ gap: 16, paddingBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Avatar guest={guest} size={56} />
            <View style={{ gap: 6, flexDirection: 'row', flexWrap: 'wrap', flex: 1 }}>
              {guest.wedding_side ? (
                <PheraChip label={SIDE_LABEL[guest.wedding_side]} tone={SIDE_TONE[guest.wedding_side]} />
              ) : null}
              {attendingChip(guestAttending(guest))}
              {tags.map((t) => (
                <PheraChip key={t} label={t} tone="brand" />
              ))}
            </View>
          </View>
          <DetailRow icon="call-outline" label="Phone" value={guest.phone || 'Not provided'} />
          <DetailRow
            icon="mail-outline"
            label="Email"
            value={guest.email && !guest.email.endsWith('@phera.io') ? guest.email : 'Not provided'}
          />
          {rsvp ? (
            <DetailRow
              icon="people-outline"
              label="Party size"
              value={`${rsvp.guest_count ?? 1} ${(rsvp.guest_count ?? 1) === 1 ? 'guest' : 'guests'}`}
            />
          ) : null}
          <PheraText variant="body2" color={COLORS.text.faint}>
            Editing, WhatsApp outreach, and travel details land in upcoming phases.
          </PheraText>
        </View>
      ) : null}
    </PheraSheet>
  );
}

function AddGuestSheet({
  open,
  onClose,
  slug,
}: {
  open: boolean;
  onClose: () => void;
  slug: string;
}) {
  const addGuest = useAddGuest(slug);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [side, setSide] = useState<WeddingSide | undefined>();
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName('');
    setPhone('');
    setEmail('');
    setSide(undefined);
    setError(null);
  };

  const submit = async () => {
    setError(null);
    if (!name.trim()) return setError('Name is required');
    // Phone is the required contact in Phera's data conventions.
    if (!phone.trim()) return setError('Phone is required — it powers WhatsApp outreach');
    try {
      await addGuest.mutateAsync({ name, phone, email, wedding_side: side });
      reset();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add guest');
    }
  };

  return (
    <PheraSheet
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Add guest"
      footer={
        <PheraButton fullWidth size="lg" loading={addGuest.isPending} onPress={submit}>
          Add guest
        </PheraButton>
      }
    >
      <View style={{ gap: 14 }}>
        {error ? (
          <PheraText variant="body2" color={COLORS.accent.dangerText}>
            {error}
          </PheraText>
        ) : null}
        <PheraInput label="Full name" value={name} onChangeText={setName} placeholder="Anita Sharma" />
        <PheraInput
          label="Phone (WhatsApp)"
          value={phone}
          onChangeText={setPhone}
          placeholder="+1 415 555 0100"
          keyboardType="phone-pad"
        />
        <PheraInput
          label="Email (optional)"
          value={email}
          onChangeText={setEmail}
          placeholder="anita@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <View style={{ gap: 6 }}>
          <PheraText variant="label">Side</PheraText>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['bride', 'groom', 'both'] as const).map((s) => (
              <Pressable
                key={s}
                accessibilityRole="button"
                onPress={() => setSide(side === s ? undefined : s)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: RADII.pill,
                  borderWidth: 1.5,
                  borderColor: side === s ? COLORS.brand.primary : COLORS.border.default,
                  backgroundColor: side === s ? COLORS.brand.primarySubtle : COLORS.bg.white,
                }}
              >
                <PheraText
                  variant="body2"
                  weight={500}
                  color={side === s ? COLORS.brand.primary : COLORS.text.muted}
                >
                  {SIDE_LABEL[s]}
                </PheraText>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </PheraSheet>
  );
}

export default function GuestsScreen() {
  const weddingSlug = useWeddingSlug();
  const guests = useGuests(weddingSlug);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<RsvpFilter>('all');
  const [selected, setSelected] = useState<Guest | null>(null);
  const [adding, setAdding] = useState(false);

  const filtered = useMemo(() => {
    const all = guests.data ?? [];
    const q = search.trim().toLowerCase();
    return all.filter((g) => {
      if (q && !g.name.toLowerCase().includes(q)) return false;
      if (filter === 'all') return true;
      const a = guestAttending(g);
      return filter === 'none' ? a === null : a === filter;
    });
  }, [guests.data, search, filter]);

  return (
    <Screen scroll={false}>
      <PageHeading
        title="Guest List"
        subtitle={`${guests.data?.length ?? 0} guest parties`}
        action={
          <PheraButton size="md" onPress={() => setAdding(true)}>
            Add
          </PheraButton>
        }
      />
      <PheraInput
        placeholder="Search guests…"
        value={search}
        onChangeText={setSearch}
        autoCorrect={false}
      />
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.key}
            accessibilityRole="button"
            accessibilityLabel={`guest-filter-${f.key}`}
            onPress={() => setFilter(f.key)}
          >
            <View
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: RADII.pill,
                backgroundColor: filter === f.key ? COLORS.brand.primary : COLORS.bg.white,
                borderWidth: 1,
                borderColor: filter === f.key ? COLORS.brand.primary : COLORS.border.default,
              }}
            >
              <PheraText
                variant="body2"
                weight={500}
                color={filter === f.key ? COLORS.text.inverse : COLORS.text.muted}
              >
                {f.label}
              </PheraText>
            </View>
          </Pressable>
        ))}
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 10, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshing={guests.isRefetching}
        onRefresh={() => void guests.refetch()}
        ListEmptyComponent={
          <EmptyState
            icon="search-outline"
            title={search || filter !== 'all' ? 'No matching guests' : 'No guests yet'}
            subtitle={
              search || filter !== 'all'
                ? 'Try a different name or filter.'
                : 'Add your first guest to start outreach.'
            }
            action={
              !search && filter === 'all' ? (
                <PheraButton onPress={() => setAdding(true)}>Add guest</PheraButton>
              ) : undefined
            }
          />
        }
        renderItem={({ item }) => (
          <PheraCard accessibilityLabel={`Open guest ${item.name}`} onPress={() => setSelected(item)}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Avatar guest={item} />
              <View style={{ flex: 1, gap: 4 }}>
                <PheraText variant="body" weight={500}>
                  {item.name}
                </PheraText>
                <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                  {item.wedding_side ? (
                    <PheraChip label={SIDE_LABEL[item.wedding_side]} tone={SIDE_TONE[item.wedding_side]} />
                  ) : null}
                  {attendingChip(guestAttending(item))}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.text.faint} />
            </View>
          </PheraCard>
        )}
      />
      <GuestDetailSheet guest={selected} onClose={() => setSelected(null)} />
      <AddGuestSheet open={adding} onClose={() => setAdding(false)} slug={weddingSlug} />
    </Screen>
  );
}
