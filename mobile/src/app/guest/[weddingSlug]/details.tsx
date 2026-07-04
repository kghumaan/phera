import { useRouter } from 'expo-router';
import { Fragment } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { DiamondSeparator, GuestScreen } from '@/components/guest/GuestChrome';
import { PheraText } from '@/components/ui';
import { COLORS, FONT, TEXT } from '@/lib/theme/tokens';
import { useWeddingSlug } from '@/lib/nav';

// Mirrors the web details hub (app/(guest)/[slug]/details): a vertically
// centered column of uppercase tracked links separated by champagne
// diamond ornaments on the ivory texture.
const ITEMS: { label: string; route: string }[] = [
  { label: 'Schedule & Events', route: 'schedule' },
  { label: 'Cultural Guide', route: 'cultural-guide' },
  { label: 'Your Travel', route: 'travel' },
  { label: 'Q & A', route: 'faq' },
  { label: 'Change RSVP', route: 'rsvp' },
];

export default function GuestDetailsScreen() {
  const weddingSlug = useWeddingSlug();
  const router = useRouter();

  return (
    <GuestScreen background="ivory" centered>
      {ITEMS.map((item, i) => (
        <Fragment key={item.route}>
          {i > 0 ? <DiamondSeparator /> : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Open ${item.label}`}
            onPress={() => router.push(`/guest/${weddingSlug}/${item.route}` as never)}
            style={({ pressed }) => [styles.item, pressed && { opacity: 0.6 }]}
          >
            <PheraText style={styles.itemText}>{item.label}</PheraText>
          </Pressable>
        </Fragment>
      ))}
    </GuestScreen>
  );
}

const styles = StyleSheet.create({
  item: { paddingVertical: 14, alignItems: 'center' },
  itemText: {
    fontFamily: FONT.regular,
    fontSize: TEXT.xl,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: COLORS.text.strong,
    textAlign: 'center',
  },
});
