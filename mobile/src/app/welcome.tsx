import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  View,
  type ViewToken,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import artCouple from '@/assets/images/onboarding/slide-couple.webp';
import artGuest from '@/assets/images/onboarding/slide-guest.webp';
import artIntro from '@/assets/images/onboarding/slide-intro.webp';
import { PheraButton, PheraText } from '@/components/ui';
import { useAuth } from '@/lib/auth/AuthContext';
import { enableDemoMode } from '@/lib/supabase/client';
import { COLORS, FONT, PALETTE, RADII, TEXT } from '@/lib/theme/tokens';

export const ONBOARDED_KEY = 'phera_onboarded';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

import type { ImageSourcePropType } from 'react-native';

interface Slide {
  key: string;
  bg: ImageSourcePropType;
  title: string;
  caption: string;
}

// First-launch walkthrough — full-bleed generated artwork, one line of
// copy each, then the role fork (couple → login, guest → link entry).
const SLIDES: Slide[] = [
  {
    key: 'intro',
    bg: artIntro,
    title: 'Beautiful chaos,\nhandled.',
    caption: 'Indian wedding guest logistics, done for you',
  },
  {
    key: 'couple',
    bg: artCouple,
    title: 'Plan it from\nyour pocket.',
    caption: 'RSVPs, travel & an AI planner that does the chasing',
  },
  {
    key: 'guest',
    bg: artGuest,
    title: 'Invited?\nIt\u2019s all here.',
    caption: 'RSVP, schedule, dress codes & your airport pickup',
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);
  const { enterPreview } = useAuth();
  const queryClient = useQueryClient();

  // New-user path: no account, no invitation — tour the fixture wedding
  // as its couple. Session-only; the badge in Screen exits back out.
  const enterDemo = async () => {
    enableDemoMode();
    enterPreview();
    queryClient.clear();
    await AsyncStorage.setItem(ONBOARDED_KEY, 'true');
    router.replace('/');
  };

  const onViewable = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems[0];
    if (first?.index != null) setIndex(first.index);
  });

  const finish = async (dest: '/login' | '/guest-entry') => {
    await AsyncStorage.setItem(ONBOARDED_KEY, 'true');
    router.replace(dest as never);
  };

  const last = index === SLIDES.length - 1;

  return (
    <View style={styles.root}>
      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(s) => s.key}
        horizontal
        pagingEnabled
        style={{ flex: 1 }}
        getItemLayout={(_, i) => ({ length: SCREEN_W, offset: SCREEN_W * i, index: i })}
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewable.current}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        renderItem={({ item }) => (
          <View style={{ width: SCREEN_W, height: SCREEN_H }}>
            <Image source={item.bg} alt="" style={StyleSheet.absoluteFill} contentFit="cover" />
            <View style={styles.slideContent}>
              <PheraText style={styles.title}>{item.title}</PheraText>
              <PheraText variant="body" align="center" color={COLORS.text.muted} style={{ maxWidth: 300 }}>
                {item.caption}
              </PheraText>
            </View>
          </View>
        )}
      />

      {/* Skip */}
      {!last ? (
        <Pressable
          accessibilityRole="button"
          testID="onboarding-skip"
          onPress={() => {
            setIndex(SLIDES.length - 1);
            listRef.current?.scrollToIndex({ index: SLIDES.length - 1, animated: true });
          }}
          style={[styles.skip, { top: insets.top + 16 }]}
        >
          <PheraText variant="body2" weight={600} color={COLORS.text.muted}>
            Skip
          </PheraText>
        </Pressable>
      ) : null}

      {/* Dots + actions */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.dots}>
          {SLIDES.map((s, i) => (
            <View
              key={s.key}
              style={[
                styles.dot,
                i === index && { backgroundColor: COLORS.brand.primary, width: 22 },
              ]}
            />
          ))}
        </View>
        {last ? (
          <View style={{ gap: 10, alignSelf: 'stretch' }}>
            <PheraButton
              fullWidth
              size="lg"
              borderRadius={RADII.pill}
              onPress={() => void finish('/login')}
              testID="onboarding-couple"
            >
              I&apos;m planning a wedding
            </PheraButton>
            <PheraButton
              variant="secondary"
              fullWidth
              size="lg"
              borderRadius={RADII.pill}
              onPress={() => void finish('/guest-entry')}
              testID="onboarding-guest"
            >
              I&apos;m a wedding guest
            </PheraButton>
            <PheraText
              variant="body2"
              align="center"
              weight={600}
              color={COLORS.text.muted}
              onPress={() => void enterDemo()}
              accessibilityRole="button"
              testID="onboarding-demo"
            >
              Just exploring? Browse a sample wedding →
            </PheraText>
          </View>
        ) : (
          <PheraButton
            fullWidth
            size="lg"
            borderRadius={RADII.pill}
            onPress={() => {
              const next = Math.min(index + 1, SLIDES.length - 1);
              setIndex(next);
              listRef.current?.scrollToIndex({ index: next, animated: true });
            }}
            testID="onboarding-next"
          >
            Continue
          </PheraButton>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.paper },
  slideContent: {
    position: 'absolute',
    left: 28,
    right: 28,
    // Sits in the artwork's clean lower third, above dots + buttons.
    bottom: 200,
    alignItems: 'center',
    gap: 10,
    // Soft paper wash so the headline stays legible over any artwork.
    backgroundColor: PALETTE.white[72],
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  title: {
    fontFamily: FONT.display,
    fontSize: 44,
    lineHeight: 50,
    textAlign: 'center',
    color: COLORS.text.strong,
  },
  skip: { position: 'absolute', right: 24, padding: 8 },
  footer: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 0,
    gap: 18,
    alignItems: 'center',
  },
  dots: { flexDirection: 'row', gap: 7 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: COLORS.border.default,
  },
});
