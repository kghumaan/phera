import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState, PageHeading, PheraCard, PheraText } from '@/components/ui';
import { useFaqs, useWedding } from '@/lib/data/hooks';
import { COLORS, SPACING } from '@/lib/theme/tokens';
import { useWeddingSlug } from '@/lib/nav';

export default function GuestFaqScreen() {
  const weddingSlug = useWeddingSlug();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const wedding = useWedding(weddingSlug);
  const faqs = useFaqs(wedding.data?.id);

  const [open, setOpen] = useState<string | null>(null);
  const list = faqs.data ?? [];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.bg.paper }}
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 48,
        paddingHorizontal: SPACING.screenX,
        gap: 12,
      }}
    >
      <PageHeading
        title="Q&A"
        subtitle="Answers from the couple"
        action={
          <Ionicons name="close" size={24} color={COLORS.text.muted} onPress={() => router.back()} />
        }
      />
      {list.length === 0 ? (
        <EmptyState icon="help-circle-outline" title="No questions yet" subtitle="Ask the couple anything on WhatsApp." />
      ) : (
        list.map((f) => {
          const expanded = open === f.id;
          return (
            <Pressable
              key={f.id}
              accessibilityRole="button"
              accessibilityLabel={`FAQ ${f.question}`}
              onPress={() => setOpen(expanded ? null : f.id)}
            >
              <PheraCard>
                <View style={{ gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <PheraText variant="body" weight={600} style={{ flex: 1 }}>
                      {f.question}
                    </PheraText>
                    <Ionicons
                      name={expanded ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={COLORS.text.faint}
                    />
                  </View>
                  {expanded ? <PheraText variant="body2">{f.answer}</PheraText> : null}
                </View>
              </PheraCard>
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}
