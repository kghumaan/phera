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
  StatCard,
} from '@/components/ui';
import { useConcierge, useWedding } from '@/lib/data/hooks';
import { COLORS } from '@/lib/theme/tokens';
import { useWeddingSlug } from '@/lib/nav';

function ago(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export default function ConciergeScreen() {
  const weddingSlug = useWeddingSlug();
  const router = useRouter();
  const wedding = useWedding(weddingSlug);
  const concierge = useConcierge(wedding.data?.id);

  const stats = concierge.data;

  return (
    <Screen onRefresh={() => concierge.refetch()} refreshing={concierge.isRefetching}>
      <PageHeading
        title="Concierge"
        subtitle="Your AI answering guests on WhatsApp"
        action={
          <Ionicons name="close" size={24} color={COLORS.text.muted} onPress={() => router.back()} />
        }
      />

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <StatCard
          icon={<Ionicons name="people-outline" size={20} color={COLORS.brand.primary} />}
          value={stats?.guestsReached ?? '—'}
          label="Guests reached"
        />
        <StatCard
          icon={<Ionicons name="chatbubble-ellipses-outline" size={20} color={COLORS.accent.success} />}
          value={stats?.messagesHandled ?? '—'}
          label="Messages handled"
        />
      </View>
      <StatCard
        icon={<Ionicons name="flash-outline" size={20} color={COLORS.accent.warning} />}
        value={stats?.avgResponseTimeSec != null ? `${stats.avgResponseTimeSec}s` : '—'}
        label="Avg response time — fully automated"
      />

      <View style={{ gap: 12 }}>
        <SectionHeading title="Recent conversations" />
        {!stats || stats.conversations.length === 0 ? (
          <EmptyState
            icon="headset-outline"
            title="No conversations yet"
            subtitle="When guests message your wedding's WhatsApp number, the concierge answers and logs it here."
          />
        ) : (
          stats.conversations.slice(0, 8).map((c) => (
            <PheraCard key={c.guestId}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <PheraText variant="body" weight={500} style={{ flex: 1 }}>
                      {c.guestName}
                    </PheraText>
                    <PheraText variant="body2" color={COLORS.text.faint}>
                      {ago(c.lastMessageAt)}
                    </PheraText>
                  </View>
                  <PheraText variant="body2" numberOfLines={2}>
                    {c.lastMessagePreview}
                  </PheraText>
                </View>
                <PheraChip label="Answered" tone="success" />
              </View>
            </PheraCard>
          ))
        )}
      </View>
    </Screen>
  );
}
