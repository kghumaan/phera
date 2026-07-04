import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
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

/** Live countdown pill matching the web home (months/days/hours/mins/secs). */
function Countdown({ targetISO }: { targetISO: string }) {
  const target = useMemo(() => new Date(`${targetISO}T00:00:00`).getTime(), [targetISO]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const total = Math.max(0, Math.floor((target - now) / 1000));
  const months = Math.floor(total / (30 * 86400));
  const days = Math.floor((total % (30 * 86400)) / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  const units: [number, string][] = [
    [months, 'months'],
    [days, 'days'],
    [hours, 'hours'],
    [mins, 'mins'],
    [secs, 'secs'],
  ];

  return (
    <View style={styles.countdownPill}>
      {units.map(([value, label]) => (
        <View key={label} style={{ alignItems: 'center', minWidth: 48 }}>
          <PheraText variant="h1" weight={500}>
            {value}
          </PheraText>
          <PheraText variant="body2" color={COLORS.text.muted}>
            {label}
          </PheraText>
        </View>
      ))}
    </View>
  );
}

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

  // ── Home hero — mirrors the web guest home: date, serif couple name,
  // underlined venue, live countdown pill, RSVP pill pinned at bottom. ──
  const rsvpDeadline = new Date(`${w.rsvp_deadline}T00:00:00`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <View style={styles.root}>
      <Image source={bgClouds} alt="" style={StyleSheet.absoluteFill} contentFit="cover" />
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          padding: 24,
          paddingTop: insets.top + 40,
          paddingBottom: 16,
        }}
      >
        <View style={{ gap: 14, alignItems: 'center' }}>
          <PheraText variant="body2" color={COLORS.text.subtle}>
            Welcome, {session?.guestName}
          </PheraText>
          <PheraText variant="body" style={{ fontSize: 22, lineHeight: 30 }} color={COLORS.text.strong}>
            {w.wedding_date_display}
          </PheraText>
          <PheraText
            variant="display"
            align="center"
            style={{ fontSize: 52, lineHeight: 60, fontStyle: 'italic' }}
          >
            {w.couple_name}
          </PheraText>
          <PheraText
            variant="body"
            align="center"
            style={{ fontSize: 19, lineHeight: 26, textDecorationLine: 'underline' }}
          >
            {w.venue_name}, {w.venue_location} 🇮🇳
          </PheraText>
          <Countdown targetISO={w.wedding_date} />
          <PheraText variant="body" align="center" color={COLORS.text.muted}>
            We are getting married!
          </PheraText>
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
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <PheraButton
          fullWidth
          size="lg"
          borderRadius={RADII.pill}
          onPress={() => router.push(`/guest/${weddingSlug}/rsvp` as never)}
          testID="home-rsvp"
        >
          RSVP
        </PheraButton>
        <PheraButton
          variant="secondary"
          fullWidth
          size="lg"
          borderRadius={RADII.pill}
          onPress={() => router.push(`/guest/${weddingSlug}/details` as never)}
        >
          View Details
        </PheraButton>
        <PheraText variant="body2" align="center" color={COLORS.text.muted}>
          Please RSVP by {rsvpDeadline}
        </PheraText>
      </View>
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
  countdownPill: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.bg.white,
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 14,
    gap: 8,
    alignSelf: 'stretch',
    marginTop: 8,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 12,
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },
});
