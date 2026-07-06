import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { GuestScreen } from '@/components/guest/GuestChrome';
import { PheraText } from '@/components/ui';
import { useTravelSections, useWedding, type TravelSection } from '@/lib/data/hooks';
import { COLORS, PALETTE, RADII } from '@/lib/theme/tokens';
import { useWeddingSlug } from '@/lib/nav';

// Web travel/page.tsx ICON_MAP equivalents.
const ICONS: Record<TravelSection['type'], keyof typeof Ionicons.glyphMap> = {
  travel: 'earth-outline',
  flight: 'airplane-outline',
  travel_note: 'document-text-outline',
  accommodation: 'home-outline',
  hotel: 'briefcase-outline',
};

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function Section({ section }: { section: TravelSection }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={{ alignItems: 'center', gap: 8, paddingVertical: 18 }}>
      <Ionicons name={ICONS[section.type] ?? 'earth-outline'} size={22} color={COLORS.text.strong} />
      {section.title ? (
        <PheraText
          variant="body"
          weight={600}
          align="center"
          style={{ textTransform: 'uppercase', letterSpacing: 2 }}
        >
          {section.title}
        </PheraText>
      ) : null}
      {section.type === 'hotel' && section.address ? (
        <PheraText variant="body2" align="center">
          {section.address}
        </PheraText>
      ) : null}
      {section.type === 'hotel' && section.phone ? (
        <PheraText variant="body2" align="center">
          {section.phone}
        </PheraText>
      ) : null}
      {section.type === 'hotel' && section.price_level ? (
        <PheraText variant="body2" weight={700} color={COLORS.brand.primary}>
          {'$'.repeat(section.price_level)}
        </PheraText>
      ) : null}
      {section.content ? (
        <PheraText variant="body" align="center" style={{ lineHeight: 24 }}>
          {section.content}
        </PheraText>
      ) : null}
      {section.more_details ? (
        <>
          {expanded ? (
            <PheraText variant="body2" align="center" style={{ lineHeight: 20 }}>
              {stripHtml(section.more_details)}
            </PheraText>
          ) : null}
          <Pressable
            accessibilityRole="button"
            onPress={() => setExpanded((v) => !v)}
            style={{
              borderWidth: 1.5,
              borderColor: COLORS.brand.primary,
              borderRadius: RADII.cta,
              paddingHorizontal: 20,
              paddingVertical: 8,
            }}
          >
            <PheraText variant="body2" weight={600} color={COLORS.brand.primary}>
              {expanded ? 'Hide Details' : 'View Details'}
            </PheraText>
          </Pressable>
        </>
      ) : null}
    </View>
  );
}

/** Web "Travel & Stay" (travel/page.tsx): travel_sections rendered as
 *  centered icon + caps title + content blocks on the pearl texture. */
export default function GuestTravelStayScreen() {
  const weddingSlug = useWeddingSlug();
  const wedding = useWedding(weddingSlug);
  const sections = useTravelSections(wedding.data?.id);

  const visible = (sections.data ?? []).filter(
    (s) =>
      s.visible !== false &&
      (s.content || s.more_details || (s.type === 'hotel' && (s.address || s.phone))),
  );
  const headerImage = visible.find((s) => s.type === 'travel' && s.image_url)?.image_url;

  return (
    <GuestScreen title="Travel & Stay" background="pearl">
      {headerImage ? (
        <Image
          source={{ uri: headerImage }}
          alt=""
          style={{ width: '100%', height: 220, borderRadius: RADII.lg }}
          contentFit="cover"
        />
      ) : null}
      <View
        style={{
          backgroundColor: PALETTE.white[100],
          borderRadius: RADII.lg,
          paddingHorizontal: 20,
          paddingVertical: 8,
        }}
      >
        {visible.length === 0 ? (
          <PheraText variant="body" align="center" style={{ paddingVertical: 32 }}>
            Travel information coming soon.
          </PheraText>
        ) : (
          visible.map((s, i) => (
            <View
              key={s.id}
              style={i > 0 ? { borderTopWidth: 1, borderTopColor: COLORS.border.light } : undefined}
            >
              <Section section={s} />
            </View>
          ))
        )}
      </View>
    </GuestScreen>
  );
}
