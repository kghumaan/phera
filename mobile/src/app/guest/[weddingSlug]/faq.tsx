import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { GuestScreen } from '@/components/guest/GuestChrome';
import { EmptyState, PheraCard, PheraText } from '@/components/ui';
import { useFaqs, useWedding } from '@/lib/data/hooks';
import { COLORS, RADII } from '@/lib/theme/tokens';
import { useWeddingSlug } from '@/lib/nav';

export default function GuestFaqScreen() {
  const weddingSlug = useWeddingSlug();
  const wedding = useWedding(weddingSlug);
  const faqs = useFaqs(wedding.data?.id);

  const [open, setOpen] = useState<string | null>(null);
  const list = faqs.data ?? [];

  return (
    <GuestScreen title="Q + A" themeBackgroundPath={wedding.data?.background_image}>
      {list.length === 0 ? (
        <EmptyState icon="help-circle-outline" title="No FAQs available yet." subtitle="Check back soon." />
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
                  {expanded && f.button_text && f.button_link ? (
                    <Pressable
                      accessibilityRole="link"
                      onPress={() => void Linking.openURL(f.button_link!)}
                      style={{
                        borderWidth: 1.5,
                        borderColor: COLORS.brand.primary,
                        borderRadius: RADII.lg,
                        paddingVertical: 10,
                        alignItems: 'center',
                      }}
                    >
                      <PheraText
                        variant="body2"
                        weight={700}
                        color={COLORS.brand.primary}
                        style={{ textTransform: 'uppercase', letterSpacing: 1 }}
                      >
                        {f.button_text}
                      </PheraText>
                    </Pressable>
                  ) : null}
                </View>
              </PheraCard>
            </Pressable>
          );
        })
      )}
    </GuestScreen>
  );
}
