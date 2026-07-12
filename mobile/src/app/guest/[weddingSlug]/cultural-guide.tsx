import { View } from 'react-native';

import { EmptyState, PheraCard, PheraText } from '@/components/ui';
import { GuestScreen } from '@/components/guest/GuestChrome';
import { useEvents, useWedding } from '@/lib/data/hooks';
import { COLORS } from '@/lib/theme/tokens';
import { useWeddingSlug } from '@/lib/nav';

/**
 * Cultural guide — for guests new to Indian weddings ("reverse
 * destination" guests). Content derives from wedding_events, matching
 * the web page: what each ritual means, what to wear, what to expect.
 */
export default function CulturalGuideScreen() {
  const weddingSlug = useWeddingSlug();
  const wedding = useWedding(weddingSlug);
  const events = useEvents(wedding.data?.id);

  const list = events.data ?? [];

  return (
    <GuestScreen title="Cultural Guide" themeBackgroundPath={wedding.data?.background_image}>
      <PheraCard variant="muted">
        <PheraText variant="body2">
          Indian weddings are multi-day celebrations, each event with its own meaning, dress code,
          and energy. Don&apos;t worry about getting everything &quot;right&quot; — joining in is the
          whole point. 💛
        </PheraText>
      </PheraCard>

      {list.length === 0 ? (
        <EmptyState icon="book-outline" title="Guide coming soon" subtitle="The couple is adding event details." />
      ) : (
        list.map((e) => (
          <PheraCard key={e.id} variant="hero" padding={20}>
            <View style={{ gap: 10 }}>
              <PheraText variant="display" style={{ fontSize: 32, lineHeight: 38 }}>
                {e.name}
              </PheraText>
              {e.ritual_description ? (
                <View style={{ gap: 4 }}>
                  <PheraText variant="caps" color={COLORS.cultural.maroon}>
                    What it means
                  </PheraText>
                  <PheraText variant="body2">{e.ritual_description}</PheraText>
                </View>
              ) : null}
              <View style={{ gap: 4 }}>
                <PheraText variant="caps" color={COLORS.cultural.maroon}>
                  What to wear
                </PheraText>
                <PheraText variant="body2" weight={500} color={COLORS.text.strong}>
                  {e.dress_code}
                </PheraText>
                {e.dress_code_description ? (
                  <PheraText variant="body2">{e.dress_code_description}</PheraText>
                ) : null}
              </View>
            </View>
          </PheraCard>
        ))
      )}
    </GuestScreen>
  );
}
