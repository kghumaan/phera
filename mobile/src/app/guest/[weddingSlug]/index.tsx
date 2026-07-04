import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import bgClouds from '@/assets/images/backgrounds/blue-clouds.webp';
import { PheraButton, PheraInput, PheraText, WarningAlert } from '@/components/ui';
import { useWedding } from '@/lib/data/hooks';
import { matchName, verifyPassword, type NameMatch } from '@/lib/guest/access';
import { clearGuestSession, getGuestSession, setGuestSession, type GuestSession } from '@/lib/guest/session';
import { isPreviewMode } from '@/lib/supabase/client';
import { COLORS, RADII, SHADOWS } from '@/lib/theme/tokens';
import { useWeddingSlug } from '@/lib/nav';

type GateStep = 'loading' | 'password' | 'name' | 'home';

/**
 * Guest portal entry — the two-step access gate from web PinEntry
 * (wedding password → find your name), then the wedding home hero.
 */
export default function GuestHomeScreen() {
  const weddingSlug = useWeddingSlug();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const wedding = useWedding(weddingSlug);

  const [step, setStep] = useState<GateStep>('loading');
  const [session, setSession] = useState<GuestSession | null>(null);
  const [password, setPassword] = useState('');
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<NameMatch[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getGuestSession(weddingSlug).then((s) => {
      setSession(s);
      setStep(s ? 'home' : 'password');
    });
  }, [weddingSlug]);

  const submitPassword = async () => {
    setError(null);
    setBusy(true);
    try {
      const ok = await verifyPassword(weddingSlug, password);
      if (!ok) {
        setError('That password does not match — check your invitation.');
        return;
      }
      setStep('name');
    } finally {
      setBusy(false);
    }
  };

  const searchName = async (text: string) => {
    setQuery(text);
    if (text.trim().length < 2) {
      setMatches([]);
      return;
    }
    setMatches(await matchName(weddingSlug, text, password));
  };

  const pickGuest = async (m: NameMatch) => {
    const s = { guestId: m.id, guestName: m.name };
    await setGuestSession(weddingSlug, s);
    setSession(s);
    setStep('home');
  };

  const w = wedding.data;

  if (step === 'loading' || !w) {
    return (
      <View style={[styles.center, { backgroundColor: COLORS.bg.paper }]}>
        <ActivityIndicator color={COLORS.brand.primary} />
      </View>
    );
  }

  if (step !== 'home') {
    return (
      <View style={styles.root}>
        <Image source={bgClouds} alt="" style={StyleSheet.absoluteFill} contentFit="cover" />
        <ScrollView contentContainerStyle={styles.gateScroll} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <PheraText variant="display" align="center">
              {w.couple_name}
            </PheraText>
            <PheraText variant="body2" align="center">
              {w.wedding_date_display}
            </PheraText>
            {error ? <WarningAlert onClose={() => setError(null)}>{error}</WarningAlert> : null}
            {step === 'password' ? (
              <View style={{ gap: 14 }}>
                <PheraInput
                  label="Wedding password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="From your invitation"
                  autoCapitalize="none"
                  testID="guest-password"
                />
                <PheraButton
                  fullWidth
                  size="lg"
                  borderRadius={RADII.cta}
                  loading={busy}
                  onPress={submitPassword}
                  testID="guest-password-submit"
                >
                  Continue
                </PheraButton>
                {isPreviewMode ? (
                  <PheraText variant="body2" align="center" color={COLORS.text.subtle}>
                    Preview — any password of 4+ characters works
                  </PheraText>
                ) : null}
              </View>
            ) : (
              <View style={{ gap: 14 }}>
                <PheraInput
                  label="Find your name"
                  value={query}
                  onChangeText={searchName}
                  placeholder="Start typing your name…"
                  autoCorrect={false}
                  testID="guest-name"
                />
                {matches.map((m) => (
                  <Pressable
                    key={m.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Pick ${m.name}`}
                    onPress={() => void pickGuest(m)}
                    style={styles.matchRow}
                  >
                    <View
                      style={[styles.matchAvatar, { backgroundColor: m.avatarColor ?? COLORS.brand.primary }]}
                    >
                      <PheraText variant="body2" weight={600} color={COLORS.text.inverse}>
                        {m.initials ??
                          m.name
                            .split(/\s+/)
                            .slice(0, 2)
                            .map((p) => p[0]?.toUpperCase() ?? '')
                            .join('')}
                      </PheraText>
                    </View>
                    <View style={{ flex: 1 }}>
                      <PheraText variant="body" weight={500}>
                        {m.name}
                      </PheraText>
                      {m.partySize > 1 ? (
                        <PheraText variant="body2">Party of {m.partySize}</PheraText>
                      ) : null}
                    </View>
                  </Pressable>
                ))}
                {query.trim().length >= 2 && matches.length === 0 ? (
                  <PheraText variant="body2" align="center">
                    No match — try just your first name.
                  </PheraText>
                ) : null}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  // ── Home hero ──
  return (
    <View style={styles.root}>
      <Image source={bgClouds} alt="" style={StyleSheet.absoluteFill} contentFit="cover" />
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          padding: 24,
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 48,
        }}
      >
        <View style={styles.card}>
          <PheraText variant="body2" align="center" color={COLORS.text.subtle}>
            Welcome, {session?.guestName}
          </PheraText>
          <PheraText variant="display" align="center" style={{ fontSize: 40, lineHeight: 46 }}>
            {w.couple_name}
          </PheraText>
          <PheraText variant="body" align="center" color={COLORS.text.muted}>
            {w.wedding_date_display}
          </PheraText>
          <PheraText variant="body2" align="center">
            {w.venue_name} · {w.venue_location}
          </PheraText>
          <View style={{ gap: 12, marginTop: 12 }}>
            <PheraButton
              fullWidth
              size="lg"
              borderRadius={RADII.cta}
              onPress={() => router.push(`/guest/${weddingSlug}/rsvp` as never)}
            >
              RSVP
            </PheraButton>
            <PheraButton
              variant="secondary"
              fullWidth
              size="lg"
              borderRadius={RADII.cta}
              onPress={() => router.push(`/guest/${weddingSlug}/details` as never)}
            >
              View Details
            </PheraButton>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={async () => {
              await clearGuestSession(weddingSlug);
              setSession(null);
              setPassword('');
              setQuery('');
              setMatches([]);
              setStep('password');
            }}
          >
            <PheraText variant="body2" align="center" color={COLORS.text.faint}>
              Not {session?.guestName}? Switch guest
            </PheraText>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.paper },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  gateScroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: RADII.dialog,
    padding: 24,
    gap: 12,
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    ...SHADOWS.dialog,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.border.light,
    backgroundColor: COLORS.bg.white,
  },
  matchAvatar: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
