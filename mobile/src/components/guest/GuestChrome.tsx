import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type ImageSourcePropType } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import bgAquarium from '@/assets/images/backgrounds/aquarium.webp';
import bgClouds from '@/assets/images/backgrounds/blue-clouds.webp';
import bgJade from '@/assets/images/backgrounds/jade.webp';
import bgPearl from '@/assets/images/backgrounds/pearl.webp';
import { PheraText } from '@/components/ui';
import { COLORS, FONT, PALETTE, SPACING, TEXT } from '@/lib/theme/tokens';

/**
 * Background convention — mirrors the web guest pages exactly
 * (see MOBILE-PLAN.md §3 and each web page's OptimizedBackground src):
 *   details hub → pearl.webp (hardcoded on web)
 *   schedule    → jade.webp (hardcoded)
 *   events      → aquarium.webp (hardcoded)
 *   home/FAQ/cultural/travel/RSVP → the couple's wedding.background_image,
 *   falling back to the app default blue-clouds.webp.
 */
export type GuestBackground = 'clouds' | 'pearl' | 'jade' | 'aquarium' | 'theme';

const BUNDLED: Record<string, ImageSourcePropType> = {
  '/images/backgrounds/blue-clouds.webp': bgClouds,
  '/images/backgrounds/pearl.webp': bgPearl,
  '/images/backgrounds/jade.webp': bgJade,
  '/images/backgrounds/aquarium.webp': bgAquarium,
};

/**
 * Resolve the couple's chosen background: bundled asset when we ship it,
 * remote URI for anything else (expo-image loads URLs), clouds fallback.
 */
export function resolveWeddingBackground(path?: string | null): ImageSourcePropType {
  if (!path) return bgClouds;
  if (BUNDLED[path]) return BUNDLED[path]!;
  if (path.startsWith('http')) return { uri: path };
  return { uri: `https://phera.io${path}` };
}

const BACKGROUNDS: Record<Exclude<GuestBackground, 'theme'>, ImageSourcePropType> = {
  clouds: bgClouds,
  pearl: bgPearl,
  jade: bgJade,
  aquarium: bgAquarium,
};

/**
 * Guest page chrome matching the web guest portal: full-bleed textured
 * background, header row with a circular-wash back arrow on the left and
 * an uppercase letter-spaced title centered. Content starts well below
 * the header so the back button never crowds it.
 */
export function GuestScreen({
  title,
  background = 'theme',
  themeBackgroundPath,
  children,
  scroll = true,
  centered = false,
}: {
  title?: string;
  background?: GuestBackground;
  /** wedding.background_image — used when background='theme'. */
  themeBackgroundPath?: string | null;
  children: ReactNode;
  scroll?: boolean;
  /** Vertically center content (details-hub style). */
  centered?: boolean;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bgSource =
    background === 'theme' ? resolveWeddingBackground(themeBackgroundPath) : BACKGROUNDS[background];

  const header = (
    <View style={[styles.header, { marginTop: insets.top }]}>
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
      <Image source={bgSource} alt="" style={StyleSheet.absoluteFill} contentFit="cover" />
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
    backgroundColor: PALETTE.whiteAlpha[32],
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
