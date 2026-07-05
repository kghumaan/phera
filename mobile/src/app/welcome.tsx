import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
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

import bgClouds from '@/assets/images/backgrounds/blue-clouds.webp';
import bgJade from '@/assets/images/backgrounds/jade.webp';
import bgPearl from '@/assets/images/backgrounds/pearl.webp';
import { PheraButton, PheraText } from '@/components/ui';
import { COLORS, FONT, RADII, TEXT } from '@/lib/theme/tokens';

export const ONBOARDED_KEY = 'phera_onboarded';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

import type { ImageSourcePropType } from 'react-native';

interface Slide {
  key: string;
  bg: ImageSourcePropType;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
}

// First-launch walkthrough — full-screen carousel, then the role fork
// (couple → login, guest → wedding-code entry). Runs once; the flag lives
// in AsyncStorage and Settings could reset it later if we ever want to.
const SLIDES: Slide[] = [
  {
    key: 'intro',
    bg: bgClouds,
    icon: 'heart',
    title: 'Beautiful chaos,\nhandled.',
    body: '300+ guests, 3–5 days of events, family flying in from everywhere. Phera takes care of the guest logistics so you can be present for the celebration.',
  },
  {
    key: 'couple',
    bg: bgPearl,
    icon: 'sparkles',
    title: 'Planning your\nwedding?',
    body: 'Track RSVPs, travel, rooms, and tasks — and chat with your AI planner who does the chasing for you, right from your pocket.',
  },
  {
    key: 'guest',
    bg: bgJade,
    icon: 'mail-open',
    title: 'Invited to one?',
    body: 'RSVP in a minute, see the schedule and dress codes, share your flight for airport pickup — everything for the big week in one place.',
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);

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
            <View style={[styles.slideContent, { paddingTop: insets.top + 80 }]}>
              <View style={styles.iconBadge}>
                <Ionicons name={item.icon} size={30} color={COLORS.text.inverse} />
              </View>
              <PheraText style={styles.title}>{item.title}</PheraText>
              <PheraText variant="body" align="center" color={COLORS.text.muted} style={{ maxWidth: 310 }}>
                {item.body}
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
    flex: 1,
    alignItems: 'center',
    gap: 18,
    paddingHorizontal: 28,
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: COLORS.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
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
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
  },
});
