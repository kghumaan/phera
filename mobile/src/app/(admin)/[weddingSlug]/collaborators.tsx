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
  type PheraChipTone,
} from '@/components/ui';
import { useCollaborators, useWedding } from '@/lib/data/hooks';
import { COLORS } from '@/lib/theme/tokens';
import { useWeddingSlug } from '@/lib/nav';

const ROLE_TONE: Record<string, PheraChipTone> = {
  owner: 'brand',
  admin: 'info',
  viewer: 'neutral',
};

export default function CollaboratorsScreen() {
  const weddingSlug = useWeddingSlug();
  const router = useRouter();
  const wedding = useWedding(weddingSlug);
  const collaborators = useCollaborators(wedding.data?.id, wedding.data?.created_by);

  const list = collaborators.data ?? [];

  return (
    <Screen onRefresh={() => collaborators.refetch()} refreshing={collaborators.isRefetching}>
      <PageHeading
        title="Collaborators"
        subtitle="Who can manage this wedding"
        action={
          <Ionicons name="close" size={24} color={COLORS.text.muted} onPress={() => router.back()} />
        }
      />

      {list.length === 0 ? (
        <EmptyState
          icon="people-outline"
          title="Just you so far"
          subtitle="Invite family or your planner from the web app — they appear here."
        />
      ) : (
        list.map((c) => (
          <PheraCard key={c.id}>
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
                <Ionicons
                  name={c.pending ? 'mail-outline' : 'person-outline'}
                  size={18}
                  color={COLORS.brand.primary}
                />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <PheraText variant="body" weight={500}>
                  {c.email}
                </PheraText>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <PheraChip label={c.role} tone={ROLE_TONE[c.role] ?? 'neutral'} />
                  {c.pending ? <PheraChip label="Invite sent" tone="warning" /> : null}
                </View>
              </View>
            </View>
          </PheraCard>
        ))
      )}

      <PheraText variant="body2" color={COLORS.text.faint} align="center">
        Inviting and removing collaborators happens on the web for now.
      </PheraText>
    </Screen>
  );
}
