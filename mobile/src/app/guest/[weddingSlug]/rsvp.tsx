import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import bgClouds from '@/assets/images/backgrounds/blue-clouds.webp';

import {
  PheraInput,
  PheraText,
  SuccessAlert,
} from '@/components/ui';
import { useSubmitGuestRsvp, useWedding } from '@/lib/data/hooks';
import { getGuestSession, type GuestSession } from '@/lib/guest/session';
import { COLORS, FONT, RADII, SPACING, TEXT } from '@/lib/theme/tokens';
import { useWeddingSlug } from '@/lib/nav';

/**
 * Multi-step RSVP wizard — faithful port of web CustomRSVPForm inside
 * FullScreenFormContainer: X + centered tracked "RSVP" title, white card
 * with segmented progress bar, one question per step with the web's
 * exact headings, list-row radio options, and uppercase BACK/NEXT.
 * (The web's "Create Your Login" step is skipped — mobile guests are
 * already identified by the access gate.)
 */

type Attending = '' | 'yes' | 'no' | 'maybe';
type Side = '' | 'bride' | 'groom' | 'both';

const STEPS = ['basic', 'attendance', 'plusone', 'dining', 'side', 'message'] as const;

const ATTENDING_OPTIONS: { value: Attending; label: string }[] = [
  { value: 'yes', label: "YES! Can't wait to celebrate!" },
  { value: 'no', label: "Sorry, can't make it :(" },
  { value: 'maybe', label: 'MAYBE - Need to check a few things' },
];

const PLUS_ONE_OPTIONS = [
  { value: 'yes', label: 'Yes, bringing my plus-one!' },
  { value: 'no', label: 'Just me this time' },
];

const FOOD_OPTIONS = ['Vegetarian', 'Non-Vegetarian', 'Vegan', 'Jain Food', 'No Preference'];

const SIDE_OPTIONS: { value: Side; label: string }[] = [
  { value: 'bride', label: "Bride's side" },
  { value: 'groom', label: "Groom's side" },
  { value: 'both', label: 'Friends with both!' },
];

function OptionRow({
  label,
  selected,
  onPress,
  last,
  testID,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  last?: boolean;
  testID?: string;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      testID={testID}
      onPress={onPress}
      style={[styles.optionRow, !last && styles.optionDivider]}
    >
      <PheraText
        variant="body"
        weight={selected ? 600 : 400}
        color={selected ? COLORS.brand.primary : COLORS.text.strong}
        style={{ flex: 1, fontSize: TEXT.base }}
      >
        {label}
      </PheraText>
      <View style={[styles.radioOuter, selected && { borderColor: COLORS.brand.primary }]}>
        {selected ? <View style={styles.radioInner} /> : null}
      </View>
    </Pressable>
  );
}

function StepHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={{ gap: 10, marginBottom: 18 }}>
      <PheraText style={styles.stepHeading}>{title}</PheraText>
      {subtitle ? (
        <PheraText variant="body" color={COLORS.text.faint}>
          {subtitle}
        </PheraText>
      ) : null}
    </View>
  );
}

export default function GuestRsvpScreen() {
  const weddingSlug = useWeddingSlug();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  useWedding(weddingSlug); // warm the cache for the return trip
  const submit = useSubmitGuestRsvp(weddingSlug);

  const [session, setSession] = useState<GuestSession | null>(null);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [attending, setAttending] = useState<Attending>('');
  const [plusOne, setPlusOne] = useState<'' | 'yes' | 'no'>('');
  const [plusOneName, setPlusOneName] = useState('');
  const [partyCount, setPartyCount] = useState(1);
  const [maybeComment, setMaybeComment] = useState('');
  const [food, setFood] = useState<string[]>([]);
  const [dietary, setDietary] = useState('');
  const [side, setSide] = useState<Side>('');
  const [song, setSong] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    getGuestSession(weddingSlug).then((s) => {
      setSession(s);
      if (s) {
        const [first, ...rest] = s.guestName.split(/\s+/);
        setFirstName(first ?? '');
        setLastName(rest.join(' '));
      }
    });
  }, [weddingSlug]);

  // Skip steps that don't apply when not attending (mirrors web flow).
  const activeSteps =
    attending === 'no' ? (['basic', 'attendance', 'message'] as const) : STEPS;
  const stepName = activeSteps[Math.min(step, activeSteps.length - 1)]!;
  const isLast = step === activeSteps.length - 1;

  const validate = (): string | null => {
    switch (stepName) {
      case 'basic':
        if (!firstName.trim()) return 'First name is required';
        if (!phone.trim()) return 'Phone number is required';
        if (!consent) return 'Please confirm consent to continue';
        return null;
      case 'attendance':
        return attending ? null : 'Please choose an option';
      case 'plusone':
        if (!plusOne) return 'Please choose an option';
        if (plusOne === 'yes' && !plusOneName.trim()) return "Your plus-one's name is required";
        return null;
      case 'dining':
        return food.length ? null : 'Pick at least one preference';
      case 'side':
        return side ? null : 'Please choose a side';
      default:
        return null;
    }
  };

  const handleNext = async () => {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    if (!isLast) {
      setStep((s) => s + 1);
      return;
    }
    if (!session) return;
    try {
      await submit.mutateAsync({
        guestId: session.guestId,
        name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        phone: phone.trim(),
        attending: (attending || 'maybe') as 'yes' | 'no' | 'maybe',
        guestCount: Math.max(partyCount, plusOne === 'yes' ? 2 : 1),
        plusOne: plusOne === 'yes',
        plusOneName: plusOneName.trim(),
        foodPreference: food,
        dietaryRestrictions: dietary,
        songRequest: song.trim(),
        specialMessage: message,
        maybeComment: maybeComment.trim(),
        side,
        consentGiven: consent,
      });
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong — try again');
    }
  };

  const renderStep = () => {
    switch (stepName) {
      case 'basic':
        return (
          <View style={{ gap: 16 }}>
            <StepHeading
              title="Let's make this celebration official! ✨"
              subtitle="First, tell us a bit about yourself:"
            />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <PheraInput label="First name" value={firstName} onChangeText={setFirstName} />
              </View>
              <View style={{ flex: 1 }}>
                <PheraInput label="Last name" value={lastName} onChangeText={setLastName} />
              </View>
            </View>
            <PheraInput
              label="Phone"
              value={phone}
              onChangeText={setPhone}
              placeholder="000 000 0000"
              keyboardType="phone-pad"
              testID="rsvp-phone"
            />
            <PheraText variant="body2">
              <PheraText variant="body2" weight={600} color={COLORS.text.strong}>
                Note:{' '}
              </PheraText>
              Phone number is required for hotel confirmations and important updates.
            </PheraText>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: consent }}
              testID="rsvp-consent"
              onPress={() => setConsent(!consent)}
              style={[styles.consentCard, consent && { backgroundColor: COLORS.brand.primaryWash }]}
            >
              <View style={[styles.checkbox, consent && styles.checkboxChecked]}>
                {consent ? <Ionicons name="checkmark" size={14} color={COLORS.text.inverse} /> : null}
              </View>
              <PheraText variant="body2" style={{ flex: 1 }}>
                I agree to share this information so the couple and their wedding team can
                coordinate my attendance (RSVPs, travel, logistics, and reminders). I can withdraw
                anytime by replying <PheraText variant="body2" weight={700}>STOP</PheraText> on
                WhatsApp or emailing{' '}
                <PheraText variant="body2" color={COLORS.brand.primary}>
                  privacy@phera.io
                </PheraText>
                .
              </PheraText>
            </Pressable>
          </View>
        );
      case 'attendance':
        return (
          <View>
            <StepHeading title="Will you be celebrating with us? 🏖️" />
            {ATTENDING_OPTIONS.map((o, i) => (
              <OptionRow
                key={o.value}
                label={o.label}
                selected={attending === o.value}
                onPress={() => setAttending(o.value)}
                last={i === ATTENDING_OPTIONS.length - 1}
                testID={`rsvp-attending-${o.value}`}
              />
            ))}
            {attending === 'maybe' ? (
              <View style={{ marginTop: 16 }}>
                <PheraInput
                  label="Tell us what you're figuring out"
                  value={maybeComment}
                  onChangeText={setMaybeComment}
                  multiline
                />
              </View>
            ) : null}
          </View>
        );
      case 'plusone':
        return (
          <View>
            <StepHeading title="Bringing your special someone? 💕" />
            {PLUS_ONE_OPTIONS.map((o, i) => (
              <OptionRow
                key={o.value}
                label={o.label}
                selected={plusOne === o.value}
                onPress={() => {
                  setPlusOne(o.value as 'yes' | 'no');
                  setPartyCount((c) => Math.max(c, o.value === 'yes' ? 2 : 1));
                }}
                last={i === PLUS_ONE_OPTIONS.length - 1}
              />
            ))}
            {plusOne === 'yes' ? (
              <View style={{ marginTop: 16 }}>
                <PheraInput label="Plus-one's name" value={plusOneName} onChangeText={setPlusOneName} />
              </View>
            ) : null}
            {/* Web party stepper: "Total number in your party (including kids)?" */}
            <View style={{ marginTop: 20, gap: 8 }}>
              <PheraText variant="body" weight={500}>
                Total number in your party (including kids)?
              </PheraText>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Fewer guests"
                  onPress={() =>
                    setPartyCount((c) => Math.max(plusOne === 'yes' ? 2 : 1, c - 1))
                  }
                  style={styles.stepperButton}
                >
                  <Ionicons name="remove" size={20} color={COLORS.text.strong} />
                </Pressable>
                <PheraText variant="h2">{partyCount}</PheraText>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="More guests"
                  onPress={() => setPartyCount((c) => Math.min(10, c + 1))}
                  style={styles.stepperButton}
                >
                  <Ionicons name="add" size={20} color={COLORS.text.strong} />
                </Pressable>
              </View>
            </View>
          </View>
        );
      case 'dining':
        return (
          <View>
            <StepHeading title="What's your dining preference? 🍛" />
            {FOOD_OPTIONS.map((o, i) => (
              <OptionRow
                key={o}
                label={o}
                selected={food.includes(o)}
                onPress={() =>
                  setFood((prev) => (prev.includes(o) ? prev.filter((f) => f !== o) : [...prev, o]))
                }
                last={i === FOOD_OPTIONS.length - 1}
              />
            ))}
            <View style={{ marginTop: 16 }}>
              <PheraInput
                label="Allergies or dietary restrictions (optional)"
                value={dietary}
                onChangeText={setDietary}
                placeholder="e.g. severe nut allergy"
              />
            </View>
          </View>
        );
      case 'side':
        return (
          <View>
            <StepHeading title="Which side of the celebration? 👰🏻‍♀️🤵🏻‍♂️" />
            {SIDE_OPTIONS.map((o, i) => (
              <OptionRow
                key={o.value}
                label={o.label}
                selected={side === o.value}
                onPress={() => setSide(o.value)}
                last={i === SIDE_OPTIONS.length - 1}
              />
            ))}
          </View>
        );
      case 'message':
        return (
          <View style={{ gap: 16 }}>
            <StepHeading title="Almost done! 🎶" />
            {attending !== 'no' ? (
              <PheraInput
                label="What song will make this celebration perfect? (optional)"
                value={song}
                onChangeText={setSong}
                placeholder="Song + artist"
              />
            ) : null}
            <PheraInput
              label="Leave a message for everyone to see! (optional)"
              value={message}
              onChangeText={setMessage}
              placeholder="So excited for you both!"
              multiline
              style={{ minHeight: 90, textAlignVertical: 'top' }}
            />
          </View>
        );
    }
  };

  return (
    <View style={styles.root}>
      {/* Web RSVP renders on the app-default clouds background (rsvp/page.tsx
          passes useAppDefault) — same here. */}
      <Image source={bgClouds} alt="" style={StyleSheet.absoluteFill} contentFit="cover" />
      {/* Header: X left, tracked uppercase title centered (web FullScreenFormContainer) */}
      <View style={[styles.header, { marginTop: insets.top }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <Ionicons name="close" size={24} color={COLORS.text.strong} />
        </Pressable>
        <PheraText style={styles.headerTitle}>RSVP</PheraText>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={[styles.card, { marginBottom: insets.bottom + 12 }]}>
          {/* Segmented progress bar */}
          <View style={styles.progressRow}>
            {activeSteps.map((s, i) => (
              <View
                key={s}
                style={[
                  styles.progressSegment,
                  { backgroundColor: i <= step ? COLORS.brand.primary : COLORS.border.default },
                ]}
              />
            ))}
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 16 }}
            keyboardShouldPersistTaps="handled"
          >
            {done ? (
              <View style={{ gap: 16, paddingTop: 8 }}>
                <SuccessAlert>
                  {attending === 'yes'
                    ? "You're in! We can't wait to celebrate with you. 🎉"
                    : attending === 'maybe'
                      ? 'Noted — let us know when your plans firm up!'
                      : "We'll miss you — thank you for letting us know. 💛"}
                </SuccessAlert>
                {attending === 'yes' ? (
                  <PheraText variant="body2">
                    Next: share your flight details in <PheraText variant="body2" weight={600}>Your Travel</PheraText>{' '}
                    so the couple can arrange your airport pickup.
                  </PheraText>
                ) : null}
              </View>
            ) : (
              renderStep()
            )}
            {error ? (
              <PheraText variant="body2" color={COLORS.accent.dangerText} style={{ marginTop: 12 }}>
                {error}
              </PheraText>
            ) : null}
          </ScrollView>

          {/* BACK / NEXT — uppercase, tracked, radius 16 (web contract) */}
          <View style={styles.navRow}>
            {done ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.back()}
                style={[styles.navButton, styles.nextButton]}
              >
                <PheraText style={styles.nextLabel}>Done</PheraText>
              </Pressable>
            ) : (
              <>
                {step > 0 ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      setError(null);
                      setStep((s) => s - 1);
                    }}
                    style={[styles.navButton, styles.backButton]}
                  >
                    <PheraText style={styles.backLabel}>Back</PheraText>
                  </Pressable>
                ) : null}
                <Pressable
                  accessibilityRole="button"
                  testID="rsvp-next"
                  disabled={submit.isPending}
                  onPress={() => void handleNext()}
                  style={[styles.navButton, styles.nextButton, submit.isPending && { opacity: 0.7 }]}
                >
                  <PheraText style={styles.nextLabel}>
                    {isLast ? 'Submit RSVP' : 'Next'}
                  </PheraText>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.paper },
  stepperButton: {
    width: 44,
    height: 44,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: COLORS.border.default,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bg.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 12,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FONT.regular,
    fontSize: TEXT.lg,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: COLORS.text.strong,
  },
  card: {
    flex: 1,
    marginHorizontal: SPACING.screenX,
    backgroundColor: COLORS.bg.white,
    borderRadius: RADII.dialog,
    borderWidth: 1.5,
    borderColor: COLORS.text.strong,
    padding: 20,
  },
  progressRow: { flexDirection: 'row', gap: 4, marginBottom: 20 },
  progressSegment: { flex: 1, height: 4, borderRadius: 2 },
  stepHeading: {
    fontFamily: FONT.regular,
    fontSize: 26,
    lineHeight: 38,
    color: COLORS.text.strong,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  optionDivider: { borderBottomWidth: 1, borderBottomColor: COLORS.border.light },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: COLORS.border.strong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: COLORS.brand.primary,
  },
  consentCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.12)',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: COLORS.brand.primary,
    borderColor: COLORS.brand.primary,
  },
  navRow: { flexDirection: 'row', gap: 12, paddingTop: 12 },
  navButton: {
    flex: 1,
    height: 48,
    borderRadius: RADII.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButton: { backgroundColor: COLORS.brand.primary },
  nextLabel: {
    fontFamily: FONT.bold,
    fontSize: 15,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: COLORS.text.inverse,
  },
  backButton: {
    backgroundColor: COLORS.bg.white,
    borderWidth: 1.5,
    borderColor: COLORS.text.strong,
  },
  backLabel: {
    fontFamily: FONT.bold,
    fontSize: 15,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: COLORS.text.strong,
  },
});
