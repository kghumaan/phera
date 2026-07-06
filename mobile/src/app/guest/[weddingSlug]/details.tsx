import { useRouter } from 'expo-router';
import { Fragment, useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { DiamondSeparator, GuestScreen } from '@/components/guest/GuestChrome';
import { PheraText } from '@/components/ui';
import {
  useFaqs,
  useGuestRsvp,
  useSchedule,
  useTravelSections,
  useWedding,
} from '@/lib/data/hooks';
import { getGuestSession } from '@/lib/guest/session';
import { COLORS, FONT, TEXT } from '@/lib/theme/tokens';
import { useWeddingSlug } from '@/lib/nav';

/**
 * Web details hub parity (details/page.tsx:409): items appear only when
 * their data exists, in the web's order; "Travel Details" needs an
 * attending RSVP; "Change RSVP" is always present. Cultural Guide is a
 * mobile addition (web reaches it from the events pages).
 */
export default function GuestDetailsScreen() {
  const weddingSlug = useWeddingSlug();
  const router = useRouter();
  const wedding = useWedding(weddingSlug);
  const schedule = useSchedule(wedding.data?.id);
  const faqs = useFaqs(wedding.data?.id);
  const travel = useTravelSections(wedding.data?.id);

  const [guestId, setGuestId] = useState<string | null>(null);
  useEffect(() => {
    getGuestSession(weddingSlug).then((s) => setGuestId(s?.guestId ?? null));
  }, [weddingSlug]);
  const rsvp = useGuestRsvp(weddingSlug, guestId);

  const items: { label: string; route: string }[] = [
    ...((travel.data?.length ?? 0) > 0 ? [{ label: 'Travel & Stay', route: 'travel' }] : []),
    ...((schedule.data?.length ?? 0) > 0
      ? [{ label: 'Schedule & Events', route: 'schedule' }]
      : []),
    ...((faqs.data?.length ?? 0) > 0 ? [{ label: 'Q & A', route: 'faq' }] : []),
    { label: 'Cultural Guide', route: 'cultural-guide' },
    ...(rsvp.data === 'yes' ? [{ label: 'Travel Details', route: 'travel-details' }] : []),
    { label: 'Change RSVP', route: 'rsvp' },
  ];

  return (
    <GuestScreen background="pearl" centered>
      {items.map((item, i) => (
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
