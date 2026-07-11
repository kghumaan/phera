import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  EmptyState,
  ErrorAlert,
  InfoAlert,
  PageHeading,
  PheraButton,
  PheraCard,
  PheraChip,
  PheraInput,
  PheraSwitch,
  PheraText,
  SectionHeading,
  StatCard,
  SuccessAlert,
  WarningAlert,
  type PheraChipTone,
} from '@/components/ui';
import { COLORS, SPACING } from '@/lib/theme/tokens';

const CHIP_TONES: PheraChipTone[] = [
  'neutral',
  'brand',
  'success',
  'warning',
  'danger',
  'info',
  'side-bride',
  'side-groom',
  'side-both',
];

/**
 * Dev-only design gallery — renders every UI primitive so a single
 * screenshot verifies the whole system against the web design tokens.
 */
export default function GalleryScreen() {
  const insets = useSafeAreaInsets();
  const [switchOn, setSwitchOn] = useState(true);
  const [text, setText] = useState('');

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.bg.muted }}
      contentContainerStyle={{
        paddingTop: insets.top,
        paddingBottom: 48,
        paddingHorizontal: SPACING.screenX,
        gap: 24,
      }}
    >
      <PageHeading title="Design Gallery" subtitle="Every Phera mobile primitive, token-accurate" />

      <View style={{ gap: 8 }}>
        <SectionHeading title="Typography" />
        <PheraText variant="display">Display — Instrument Serif</PheraText>
        <PheraText variant="h1">Heading 1 — Outfit 600</PheraText>
        <PheraText variant="h2">Heading 2 — Outfit 600</PheraText>
        <PheraText variant="h3">Heading 3 — Outfit 600</PheraText>
        <PheraText variant="body">Body — Outfit 400 at 16px</PheraText>
        <PheraText variant="body2">Body 2 — the 14px floor, muted</PheraText>
        <PheraText variant="caps">Subtitle caps</PheraText>
      </View>

      <View style={{ gap: 12 }}>
        <SectionHeading title="Buttons" />
        <PheraButton onPress={() => {}}>Primary action</PheraButton>
        <PheraButton variant="secondary" onPress={() => {}}>
          Secondary action
        </PheraButton>
        <PheraButton variant="ghost" onPress={() => {}}>
          Ghost action
        </PheraButton>
        <PheraButton loading onPress={() => {}}>
          Loading state
        </PheraButton>
        <PheraButton disabled onPress={() => {}}>
          Disabled
        </PheraButton>
        <PheraButton
          fullWidth
          size="lg"
          borderRadius={24}
          onPress={() => {}}
          icon={<Ionicons name="heart" size={16} color={COLORS.text.inverse} />}
        >
          Guest CTA (radius 24)
        </PheraButton>
      </View>

      <View style={{ gap: 12 }}>
        <SectionHeading title="Inputs" />
        <PheraInput label="Label" placeholder="Placeholder text" value={text} onChangeText={setText} />
        <PheraInput label="With error" value="bad value" error="Something is wrong here" />
        <PheraInput label="Helper text" placeholder="e.g. +1 415 555 0100" helperText="Phone is the required contact" />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <PheraSwitch value={switchOn} onValueChange={setSwitchOn} />
          <PheraText variant="body2">PheraSwitch — on = brand pink</PheraText>
        </View>
      </View>

      <View style={{ gap: 12 }}>
        <SectionHeading title="Chips" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {CHIP_TONES.map((tone) => (
            <PheraChip key={tone} label={tone} tone={tone} />
          ))}
        </View>
      </View>

      <View style={{ gap: 12 }}>
        <SectionHeading title="Alerts" />
        <InfoAlert>Heads up — this is informational.</InfoAlert>
        <SuccessAlert>Saved! Everything worked.</SuccessAlert>
        <WarningAlert onClose={() => {}}>Careful — something needs attention.</WarningAlert>
        <ErrorAlert onClose={() => {}}>That didn&apos;t work. Try again.</ErrorAlert>
      </View>

      <View style={{ gap: 12 }}>
        <SectionHeading title="Cards" />
        <PheraCard>
          <PheraText variant="h3">Default card</PheraText>
          <PheraText variant="body2">White, border light, radius 16</PheraText>
        </PheraCard>
        <PheraCard variant="muted">
          <PheraText variant="h3">Muted card</PheraText>
          <PheraText variant="body2">Muted background, faint border</PheraText>
        </PheraCard>
        <PheraCard variant="feature">
          <PheraText variant="h3">Feature card</PheraText>
          <PheraText variant="body2">Brand border tint</PheraText>
        </PheraCard>
        <PheraCard variant="hero">
          <PheraText variant="h3">Hero card</PheraText>
          <PheraText variant="body2">Radius 20 + popover shadow</PheraText>
        </PheraCard>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <StatCard
            icon={<Ionicons name="people-outline" size={20} color={COLORS.brand.primary} />}
            value={142}
            label="Stat card"
          />
          <StatCard
            icon={<Ionicons name="checkmark-circle-outline" size={20} color={COLORS.accent.success} />}
            value="98"
            label="Selected"
            selected
          />
        </View>
      </View>

      <View style={{ gap: 12 }}>
        <SectionHeading title="Empty state" />
        <PheraCard>
          <EmptyState
            icon="people-outline"
            title="No guests yet"
            subtitle="Import your guest list to get started with outreach."
            action={<PheraButton onPress={() => {}}>Import guests</PheraButton>}
          />
        </PheraCard>
      </View>
    </ScrollView>
  );
}
