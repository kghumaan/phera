import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import bgClouds from '@/assets/images/backgrounds/blue-clouds.webp';
import { PheraButton, PheraInput, PheraText, WarningAlert } from '@/components/ui';
import { isPreviewMode, supabase } from '@/lib/supabase/client';
import { COLORS, PALETTE, RADII, SHADOWS } from '@/lib/theme/tokens';

/**
 * Guest landing: turn whatever the guest has — the phera.io link from
 * their invitation, or just the wedding name part of it — into the
 * portal route. Validates the slug exists before navigating.
 */
export default function GuestEntryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [raw, setRaw] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const go = async () => {
    setError(null);
    // Accept "phera.io/priya-rahul-2026", full URLs, or a bare slug.
    const cleaned = raw
      .trim()
      .replace(/^https?:\/\//i, '')
      .replace(/^(www\.)?phera\.io\//i, '')
      .split(/[/?#]/)[0]!
      .toLowerCase();
    if (!cleaned || !/^[a-z0-9-]+$/.test(cleaned)) {
      setError('Paste your invitation link or the wedding name from it — e.g. phera.io/priya-rahul-2026');
      return;
    }
    setBusy(true);
    try {
      if (!isPreviewMode && supabase) {
        const { data } = await supabase.from('weddings').select('slug').eq('slug', cleaned).maybeSingle();
        if (!data) {
          setError("We couldn't find that wedding — double-check the link on your invitation.");
          return;
        }
      }
      router.push(`/guest/${cleaned}` as never);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <Image source={bgClouds} alt="" style={StyleSheet.absoluteFill} contentFit="cover" />
      {/* Overlay back button — keeps the form centered on the full screen. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={() => router.back()}
        style={[styles.back, { top: insets.top + 8 }]}
      >
        <Ionicons name="arrow-back" size={22} color={COLORS.text.strong} />
      </Pressable>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <PheraText variant="display" align="center" style={{ fontSize: 34, lineHeight: 40 }}>
              Find your wedding
            </PheraText>
            <PheraText variant="body2" align="center">
              Paste the link from your invitation — or type the wedding name part of it.
            </PheraText>
            {error ? <WarningAlert onClose={() => setError(null)}>{error}</WarningAlert> : null}
            <PheraInput
              label="Invitation link"
              value={raw}
              onChangeText={setRaw}
              placeholder="phera.io/priya-rahul-2026"
              autoCapitalize="none"
              autoCorrect={false}
              testID="guest-entry-input"
            />
            <PheraButton
              fullWidth
              size="lg"
              borderRadius={RADII.cta}
              loading={busy}
              onPress={go}
              testID="guest-entry-go"
            >
              Continue
            </PheraButton>
            {isPreviewMode ? (
              <PheraText
                variant="body2"
                align="center"
                color={COLORS.brand.primary}
                onPress={() => router.push('/guest/priya-rahul-2026' as never)}
              >
                Try the demo wedding →
              </PheraText>
            ) : null}
            <PheraText
              variant="body2"
              align="center"
              color={COLORS.text.subtle}
              onPress={() => router.push('/login' as never)}
            >
              Planning a wedding instead? Sign in
            </PheraText>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.paper },
  back: {
    position: 'absolute',
    left: 12,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.white[32],
  },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  card: {
    backgroundColor: PALETTE.white[100],
    borderRadius: RADII.dialog,
    padding: 24,
    gap: 16,
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    ...SHADOWS.dialog,
  },
});
