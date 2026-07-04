import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  EmptyState,
  PageHeading,
  PheraButton,
  PheraCard,
  PheraInput,
  PheraText,
  SuccessAlert,
  WarningAlert,
} from '@/components/ui';
import { useSubmitGuestRsvp, useWedding } from '@/lib/data/hooks';
import { getGuestSession, type GuestSession } from '@/lib/guest/session';
import { COLORS, RADII, SPACING } from '@/lib/theme/tokens';
import { useWeddingSlug } from '@/lib/nav';

const FOOD_OPTIONS = ['Vegetarian', 'Non-Vegetarian', 'Vegan', 'Jain Food', 'No Preference'];

type Attending = 'yes' | 'no' | 'maybe';

const ATTENDING_OPTIONS: { key: Attending; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'yes', label: "Joyfully accepts", icon: 'heart' },
  { key: 'maybe', label: 'Not sure yet', icon: 'help' },
  { key: 'no', label: 'Regretfully declines', icon: 'close' },
];

export default function GuestRsvpScreen() {
  const weddingSlug = useWeddingSlug();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const wedding = useWedding(weddingSlug);
  const submit = useSubmitGuestRsvp(weddingSlug);

  const [session, setSession] = useState<GuestSession | null | 'loading'>('loading');
  const [attending, setAttending] = useState<Attending | null>(null);
  const [guestCount, setGuestCount] = useState(1);
  const [food, setFood] = useState<string[]>([]);
  const [dietary, setDietary] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    getGuestSession(weddingSlug).then(setSession);
  }, [weddingSlug]);

  const toggleFood = (option: string) => {
    setFood((prev) => (prev.includes(option) ? prev.filter((f) => f !== option) : [...prev, option]));
  };

  const handleSubmit = async () => {
    setError(null);
    if (!attending) {
      setError('Choose whether you can make it first');
      return;
    }
    if (session === 'loading' || !session) return;
    try {
      await submit.mutateAsync({
        guestId: session.guestId,
        attending,
        guestCount,
        foodPreference: food,
        dietaryRestrictions: dietary,
        specialMessage: message,
      });
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong — try again');
    }
  };

  if (session !== 'loading' && !session) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg.paper, justifyContent: 'center' }}>
        <EmptyState
          icon="key-outline"
          title="Find your invitation first"
          subtitle="Head back and enter the wedding password to RSVP."
          action={
            <PheraButton borderRadius={RADII.cta} onPress={() => router.back()}>
              Go back
            </PheraButton>
          }
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.bg.paper }}
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 48,
        paddingHorizontal: SPACING.screenX,
        gap: 18,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <PageHeading
        title="RSVP"
        subtitle={
          session !== 'loading' && session
            ? `Responding as ${session.guestName}`
            : (wedding.data?.couple_name ?? '')
        }
        action={
          <Ionicons name="close" size={24} color={COLORS.text.muted} onPress={() => router.back()} />
        }
      />

      {done ? (
        <View style={{ gap: 16 }}>
          <SuccessAlert>
            {attending === 'yes'
              ? "You're in! We can't wait to celebrate with you. 🎉"
              : attending === 'maybe'
                ? 'Noted — let us know when your plans firm up!'
                : "We'll miss you — thank you for letting us know. 💛"}
          </SuccessAlert>
          {attending === 'yes' ? (
            <PheraCard variant="feature">
              <View style={{ gap: 8 }}>
                <PheraText variant="h3">Next: your travel details</PheraText>
                <PheraText variant="body2">
                  Share your flight once it&apos;s booked so the couple can arrange your airport pickup.
                </PheraText>
              </View>
            </PheraCard>
          ) : null}
          <PheraButton
            variant="secondary"
            fullWidth
            size="lg"
            borderRadius={RADII.cta}
            onPress={() => router.back()}
          >
            Back to the wedding
          </PheraButton>
        </View>
      ) : (
        <>
          {error ? <WarningAlert onClose={() => setError(null)}>{error}</WarningAlert> : null}

          <View style={{ gap: 10 }}>
            <PheraText variant="h3">Will you join us?</PheraText>
            {ATTENDING_OPTIONS.map((opt) => {
              const active = attending === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  accessibilityRole="button"
                  accessibilityLabel={`attending-${opt.key}`}
                  onPress={() => setAttending(opt.key)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    padding: 16,
                    borderRadius: RADII.lg,
                    borderWidth: active ? 2 : 1,
                    borderColor: active ? COLORS.brand.primary : COLORS.border.default,
                    backgroundColor: active ? COLORS.brand.primarySubtle : COLORS.bg.white,
                  }}
                >
                  <Ionicons
                    name={opt.icon}
                    size={20}
                    color={active ? COLORS.brand.primary : COLORS.text.subtle}
                  />
                  <PheraText
                    variant="body"
                    weight={active ? 600 : 400}
                    color={active ? COLORS.brand.primary : COLORS.text.strong}
                  >
                    {opt.label}
                  </PheraText>
                </Pressable>
              );
            })}
          </View>

          {attending === 'yes' ? (
            <>
              <View style={{ gap: 10 }}>
                <PheraText variant="h3">How many in your party?</PheraText>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                  <PheraButton
                    variant="secondary"
                    onPress={() => setGuestCount((c) => Math.max(1, c - 1))}
                  >
                    −
                  </PheraButton>
                  <PheraText variant="h1" weight={700}>
                    {guestCount}
                  </PheraText>
                  <PheraButton
                    variant="secondary"
                    onPress={() => setGuestCount((c) => Math.min(10, c + 1))}
                  >
                    +
                  </PheraButton>
                </View>
              </View>

              <View style={{ gap: 10 }}>
                <PheraText variant="h3">Food preference</PheraText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {FOOD_OPTIONS.map((option) => {
                    const active = food.includes(option);
                    return (
                      <Pressable
                        key={option}
                        accessibilityRole="button"
                        onPress={() => toggleFood(option)}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 9,
                          borderRadius: RADII.pill,
                          borderWidth: 1.5,
                          borderColor: active ? COLORS.brand.primary : COLORS.border.default,
                          backgroundColor: active ? COLORS.brand.primarySubtle : COLORS.bg.white,
                        }}
                      >
                        <PheraText
                          variant="body2"
                          weight={500}
                          color={active ? COLORS.brand.primary : COLORS.text.muted}
                        >
                          {option}
                        </PheraText>
                      </Pressable>
                    );
                  })}
                </View>
                <PheraInput
                  label="Allergies or dietary notes (optional)"
                  value={dietary}
                  onChangeText={setDietary}
                  placeholder="e.g. severe nut allergy"
                />
              </View>
            </>
          ) : null}

          {attending ? (
            <PheraInput
              label="A note for the couple (optional)"
              value={message}
              onChangeText={setMessage}
              placeholder="So excited for you both!"
              multiline
              style={{ minHeight: 80, textAlignVertical: 'top' }}
            />
          ) : null}

          <PheraButton
            fullWidth
            size="lg"
            borderRadius={RADII.cta}
            loading={submit.isPending}
            onPress={handleSubmit}
            testID="rsvp-submit"
          >
            Send RSVP
          </PheraButton>
        </>
      )}
    </ScrollView>
  );
}
