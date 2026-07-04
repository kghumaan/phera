import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import bgClouds from '@/assets/images/backgrounds/blue-clouds.webp';
import bgIvory from '@/assets/images/backgrounds/ivory-linen.webp';
import bgSage from '@/assets/images/backgrounds/bamboo-sage.webp';
import { PheraText } from '@/components/ui';
import { COLORS, FONT, SPACING, TEXT } from '@/lib/theme/tokens';

export type GuestBackground = 'clouds' | 'ivory' | 'sage';

const BACKGROUNDS: Record<GuestBackground, number> = {
  clouds: bgClouds,
  ivory: bgIvory,
  sage: bgSage,
};

/**
 * Guest page chrome matching the web guest portal: full-bleed textured
 * background, header row with a circular-wash back arrow on the left and
 * an uppercase letter-spaced title centered. Content starts well below
 * the header so the back button never crowds it.
 */
export function GuestScreen({
  title,
  background = 'clouds',
  children,
  scroll = true,
  centered = false,
}: {
  title?: string;
  background?: GuestBackground;
  children: ReactNode;
  scroll?: boolean;
  /** Vertically center content (details-hub style). */
  centered?: boolean;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const header = (
    <View style={[styles.header, { marginTop: insets.top + 12 }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={() => router.back()}
        style={styles.backButton}
      >
        <Ionicons name="arrow-back" size={22} color={COLORS.text.strong} />
      </Pressable>
      <PheraText style={styles.title}>{title ?? ''}</PheraText>
      <View style={{ width: 44 }} />
    </View>
  );

  return (
    <View style={styles.root}>
      <Image source={BACKGROUNDS[background]} alt="" style={StyleSheet.absoluteFill} contentFit="cover" />
      {header}
      {scroll ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 48 },
            centered && { flexGrow: 1, justifyContent: 'center' },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>{children}</View>
      )}
    </View>
  );
}

/** Champagne diamond ornament row (web details-hub separator). */
export function DiamondSeparator() {
  return (
    <View style={styles.diamondRow}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={styles.diamond} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.paper },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 56,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FONT.regular,
    fontSize: TEXT.lg,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: COLORS.text.strong,
  },
  scrollContent: {
    paddingHorizontal: SPACING.screenX,
    paddingTop: 16,
    gap: 16,
  },
  diamondRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  diamond: {
    width: 10,
    height: 10,
    backgroundColor: COLORS.cultural.champagne,
    transform: [{ rotate: '45deg' }],
    borderRadius: 2,
  },
});
