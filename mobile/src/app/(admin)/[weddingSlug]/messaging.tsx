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
} from '@/components/ui';
import { useBroadcasts } from '@/lib/data/hooks';
import type { Broadcast } from '@/lib/data/types';
import { COLORS } from '@/lib/theme/tokens';
import { useWeddingSlug } from '@/lib/nav';

function statusChip(status: Broadcast['status']) {
  switch (status) {
    case 'sent':
      return <PheraChip label="Sent" tone="success" />;
    case 'sending':
      return <PheraChip label="Sending…" tone="info" />;
    case 'failed':
      return <PheraChip label="Failed" tone="danger" />;
    default:
      return <PheraChip label="Draft" tone="neutral" />;
  }
}

function targetLabel(b: Broadcast): string {
  switch (b.target_type) {
    case 'all':
      return 'All guests';
    case 'tags':
      return 'By tag';
    default:
      return 'Selected guests';
  }
}

function prettyDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function ProgressRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? value / total : 0;
  return (
    <View style={{ gap: 4 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <PheraText variant="body2">{label}</PheraText>
        <PheraText variant="body2" weight={600} color={COLORS.text.strong}>
          {value}/{total}
        </PheraText>
      </View>
      <View style={{ height: 6, borderRadius: 3, backgroundColor: COLORS.bg.wash, overflow: 'hidden' }}>
        <View style={{ width: `${pct * 100}%`, height: '100%', borderRadius: 3, backgroundColor: color }} />
      </View>
    </View>
  );
}

export default function MessagingScreen() {
  const weddingSlug = useWeddingSlug();
  const router = useRouter();
  const broadcasts = useBroadcasts(weddingSlug);

  const list = broadcasts.data ?? [];

  return (
    <Screen onRefresh={() => broadcasts.refetch()} refreshing={broadcasts.isRefetching}>
      <PageHeading
        title="Messaging"
        subtitle={`${list.length} WhatsApp broadcasts`}
        action={
          <Ionicons name="close" size={24} color={COLORS.text.muted} onPress={() => router.back()} />
        }
      />

      {list.length === 0 ? (
        <EmptyState
          icon="chatbubbles-outline"
          title="No broadcasts yet"
          subtitle="Compose broadcasts on the web or ask the Planner to draft one — delivery tracking shows here."
        />
      ) : (
        list.map((b) => (
          <PheraCard key={b.id}>
            <View style={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <PheraText variant="body2" weight={600} color={COLORS.text.strong} style={{ flex: 1 }}>
                  {targetLabel(b)}
                  {b.sent_at ? ` · ${prettyDate(b.sent_at)}` : ''}
                </PheraText>
                {statusChip(b.status)}
              </View>
              <PheraText variant="body2" numberOfLines={3}>
                {b.message}
              </PheraText>
              <ProgressRow
                label="Delivered"
                value={b.delivered_count}
                total={b.recipient_count}
                color={COLORS.accent.info}
              />
              <ProgressRow
                label="Replied"
                value={b.replied_count}
                total={b.recipient_count}
                color={COLORS.accent.success}
              />
              {b.failed_count > 0 ? (
                <PheraText variant="body2" color={COLORS.accent.dangerText}>
                  {b.failed_count} failed to send
                </PheraText>
              ) : null}
            </View>
          </PheraCard>
        ))
      )}
    </Screen>
  );
}
