import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import logoStacked from '@/assets/images/logo-stacked.svg';
import overlayLeft from '@/assets/images/overlays/entry-topleft.webp';
import overlayRight from '@/assets/images/overlays/entry-topright.webp';
import { resolveWeddingBackground } from '@/components/guest/GuestChrome';
import { PheraText } from '@/components/ui';
import { matchName, verifyPassword, type NameMatch } from '@/lib/guest/access';
import { isPreviewMode } from '@/lib/supabase/client';
import { COLORS, FONT, RADII } from '@/lib/theme/tokens';
import type { Wedding } from '@/lib/data/types';

/**
 * Lock screen matching web `components/guest/PinEntry.tsx`: pearl (or
 * custom) background, decorative corner overlays, stacked logo, serif
 * welcome headline, then password → find-your-name steps. Honors the
 * couple's pin_entry_* customisations (copy, background, colors).
 */
export function PinEntryGate({
  wedding,
  onSelect,
}: {
  wedding: Wedding;
  onSelect: (guest: { id: string; name: string }) => void;
}) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<'password' | 'name'>('password');
  const [password, setPassword] = useState('');
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<NameMatch[]>([]);
  const [searched, setSearched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const primary = wedding.pin_entry_primary_color || COLORS.brand.primary;
  const fontColor = wedding.pin_entry_font_color || COLORS.text.strong;
  const buttonFontColor = wedding.pin_entry_button_font_color || COLORS.bg.white;
  const background = wedding.pin_entry_background || '/images/backgrounds/pearl.webp';

  const couple = wedding.couple_name || '';
  const headline = wedding.pin_entry_text
    ? wedding.pin_entry_text.replace(/\{couple_name\}/g, couple)
    : couple
      ? `Celebrate with ${couple}!`
      : "You're Invited!";
  const subtitle =
    step === 'password'
      ? wedding.pin_entry_subtitle_text
        ? wedding.pin_entry_subtitle_text.replace(/\{couple_name\}/g, couple)
        : 'Enter the password from your invitation to RSVP and see all the details.'
      : "Please enter the first and last name of one member of your party below. If you're responding for you and a guest (or your family), you'll be able to RSVP for your entire group on the next page.";

  const submitPassword = async () => {
    if (!password.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await verifyPassword(wedding.slug, password.trim());
      if (!result.valid) {
        setError(result.error ?? 'Incorrect password. Please try again.');
        return;
      }
      setStep('name');
    } finally {
      setBusy(false);
    }
  };

  const submitSearch = async () => {
    if (query.trim().length < 2 || busy) return;
    setBusy(true);
    setError(null);
    setSearched(false);
    try {
      setMatches(await matchName(wedding.slug, query.trim(), password.trim()));
      setSearched(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const canSubmit = step === 'password' ? password.trim().length > 0 : query.trim().length >= 2;

  return (
    <View style={styles.root}>
      <Image
        source={resolveWeddingBackground(background)}
        alt=""
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />
      {/* Decorative corner florals (web: /images/overlays/entry-top*.png) */}
      <Image source={overlayLeft} alt="" style={[styles.corner, { left: 0 }]} contentFit="contain" />
      <Image source={overlayRight} alt="" style={[styles.corner, { right: 0 }]} contentFit="contain" />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo + welcome copy */}
          <Image source={logoStacked} alt="Phera" style={styles.logo} contentFit="contain" tintColor="#000000" />
          <PheraText style={[styles.headline, { color: fontColor }]}>{headline}</PheraText>
          <PheraText variant="body2" align="center" color={fontColor} style={styles.subtitle}>
            {subtitle}
          </PheraText>

          {step === 'password' ? (
            <View style={styles.form}>
              {/* Web PheraPasswordField: left-aligned text + eye toggle */}
              <View style={styles.passwordRow}>
                <TextInput
                  value={password}
                  onChangeText={(v) => {
                    setPassword(v);
                    setError(null);
                  }}
                  placeholder="Password"
                  placeholderTextColor={COLORS.text.faint}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  style={styles.passwordInput}
                  accessibilityLabel="Wedding password"
                  testID="guest-password"
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  onPress={() => setShowPassword((s) => !s)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color={COLORS.text.subtle}
                  />
                </Pressable>
              </View>
              {error ? (
                <View style={[styles.errorPill, { backgroundColor: `${primary}15`, borderColor: `${primary}33` }]}>
                  <PheraText variant="body2" weight={600} align="center" color={primary}>
                    {error}
                  </PheraText>
                </View>
              ) : null}
              <Pressable
                accessibilityRole="button"
                disabled={!canSubmit || busy}
                onPress={() => void submitPassword()}
                style={[
                  styles.button,
                  { backgroundColor: canSubmit ? primary : COLORS.border.default },
                ]}
                testID="guest-password-submit"
              >
                <PheraText variant="body" weight={700} color={buttonFontColor} style={styles.buttonLabel}>
                  {busy ? 'CHECKING…' : 'SUBMIT'}
                </PheraText>
              </Pressable>
              {isPreviewMode ? (
                <PheraText variant="body2" align="center" color={COLORS.text.subtle}>
                  Preview — any password of 4+ characters works
                </PheraText>
              ) : null}
            </View>
          ) : (
            <View style={styles.form}>
              <View style={{ alignSelf: 'stretch', gap: 6 }}>
                <TextInput
                  value={query}
                  onChangeText={(v) => {
                    setQuery(v);
                    setError(null);
                  }}
                  placeholder="First and last name"
                  placeholderTextColor={COLORS.text.faint}
                  autoCorrect={false}
                  style={styles.input}
                  accessibilityLabel="Your full name"
                  testID="guest-name"
                />
                <PheraText variant="body2" align="center" color={fontColor} style={{ opacity: 0.75 }}>
                  Ex. Sarah Fortune (not The Fortune Family or Dr. & Mr. Fortune)
                </PheraText>
              </View>
              {error ? (
                <View style={[styles.errorPill, { backgroundColor: `${primary}15`, borderColor: `${primary}33` }]}>
                  <PheraText variant="body2" weight={600} align="center" color={primary}>
                    {error}
                  </PheraText>
                </View>
              ) : null}
              <Pressable
                accessibilityRole="button"
                disabled={!canSubmit || busy}
                onPress={() => void submitSearch()}
                style={[
                  styles.button,
                  { backgroundColor: canSubmit ? primary : COLORS.border.default },
                ]}
                testID="guest-name-submit"
              >
                <PheraText variant="body" weight={700} color={buttonFontColor} style={styles.buttonLabel}>
                  {busy ? 'SEARCHING…' : 'CONTINUE'}
                </PheraText>
              </Pressable>

              {searched ? (
                <View style={{ alignSelf: 'stretch', gap: 12 }}>
                  <PheraText variant="body2" align="center" color={fontColor} style={{ opacity: 0.9 }}>
                    {matches.length > 0
                      ? 'Select your info below or try searching again.'
                      : 'No matches found. Try just your first or last name.'}
                  </PheraText>
                  <View style={[styles.divider, { backgroundColor: `${fontColor}30` }]} />
                  {matches.map((m) => (
                    <View key={m.id} style={{ alignItems: 'center', gap: 8 }}>
                      <PheraText variant="body" weight={600} align="center" color={fontColor}>
                        {m.name}
                      </PheraText>
                      {m.plusOneName ? (
                        <PheraText variant="body2" align="center" color={fontColor} style={{ opacity: 0.7 }}>
                          +1 {m.plusOneName}
                        </PheraText>
                      ) : null}
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Select ${m.name}`}
                        onPress={() => onSelect({ id: m.id, name: m.name })}
                        style={[styles.selectButton, { backgroundColor: primary }]}
                      >
                        <PheraText variant="body2" weight={700} color={buttonFontColor}>
                          Select
                        </PheraText>
                      </Pressable>
                      <View style={[styles.divider, { backgroundColor: `${fontColor}20` }]} />
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.paper },
  corner: {
    position: 'absolute',
    top: 0,
    width: 120,
    height: 201, // source is 400×671
    zIndex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 20,
    zIndex: 2,
  },
  logo: { width: 120, height: 96 },
  headline: {
    // Web h1 renders Instrument Serif italic on the lock screen.
    fontFamily: FONT.displayItalic,
    fontStyle: 'italic',
    fontSize: 38,
    lineHeight: 44,
    textAlign: 'center',
  },
  subtitle: { maxWidth: 320, lineHeight: 20 },
  form: { alignSelf: 'stretch', maxWidth: 420, width: '100%', alignItems: 'center', gap: 18, marginTop: 6 },
  input: {
    alignSelf: 'stretch',
    backgroundColor: COLORS.bg.white,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.border.default,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: FONT.regular,
    fontSize: 16,
    color: COLORS.text.strong,
    textAlign: 'center',
  },
  passwordRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg.white,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.border.default,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: FONT.regular,
    fontSize: 16,
    color: COLORS.text.strong,
  },
  eyeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorPill: {
    borderRadius: RADII.pill,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  button: {
    alignSelf: 'stretch',
    minHeight: 48,
    borderRadius: RADII.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  buttonLabel: { letterSpacing: 1 },
  selectButton: {
    minWidth: 160,
    minHeight: 42,
    borderRadius: RADII.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  divider: { alignSelf: 'stretch', height: 1 },
});
