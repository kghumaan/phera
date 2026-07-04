import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PageHeading, PheraCard, PheraText } from '@/components/ui';
import { useWedding } from '@/lib/data/hooks';
import { COLORS, SPACING } from '@/lib/theme/tokens';
import { useWeddingSlug } from '@/lib/nav';

const ITEMS: { icon: keyof typeof Ionicons.glyphMap; label: string; sub: string; route: string }[] = [
  { icon: 'calendar-outline', label: 'Schedule', sub: 'Day-by-day timeline', route: 'schedule' },
  { icon: 'sparkles-outline', label: 'Events & Dress Codes', sub: 'What to wear to each celebration', route: 'events' },
  { icon: 'help-circle-outline', label: 'Q&A', sub: 'Answers to common questions', route: 'faq' },
  { icon: 'mail-open-outline', label: 'RSVP', sub: 'Respond or change your answer', route: 'rsvp' },
];

export default function GuestDetailsScreen() {
  const weddingSlug = useWeddingSlug();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const wedding = useWedding(weddingSlug);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.bg.paper }}
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 48,
        paddingHorizontal: SPACING.screenX,
        gap: 14,
      }}
    >
      <PageHeading
        title={wedding.data?.couple_name ?? 'Wedding'}
        subtitle="Everything you need for the celebration"
        action={
          <Ionicons name="close" size={24} color={COLORS.text.muted} onPress={() => router.back()} />
        }
      />
      {ITEMS.map((item) => (
        <PheraCard
          key={item.route}
          accessibilityLabel={`Open ${item.label}`}
          onPress={() => router.push(`/guest/${weddingSlug}/${item.route}` as never)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 999,
                backgroundColor: COLORS.brand.primarySubtle,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name={item.icon} size={20} color={COLORS.brand.primary} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <PheraText variant="h3">{item.label}</PheraText>
              <PheraText variant="body2">{item.sub}</PheraText>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.text.faint} />
          </View>
        </PheraCard>
      ))}
    </ScrollView>
  );
}
