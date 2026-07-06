import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { resolveWeddingBackground } from '@/components/guest/GuestChrome';
import { PinEntryGate } from '@/components/guest/PinEntryGate';
import { PheraButton, PheraText } from '@/components/ui';
import { useGuestRsvp, useWedding } from '@/lib/data/hooks';
import { clearGuestSession, getGuestSession, setGuestSession, type GuestSession } from '@/lib/guest/session';
import { COLORS, PALETTE, RADII } from '@/lib/theme/tokens';
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

  // Web CountdownTimer parity: avg month = 30.44 days; hidden for the
  // epoch-0 "TBD" sentinel (handled by the caller).
  const MONTH_SECS = Math.floor(30.44 * 86400);
  const total = Math.max(0, Math.floor((target - now) / 1000));
  const months = Math.floor(total / MONTH_SECS);
  const days = Math.floor((total % MONTH_SECS) / 86400);
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
  const rsvp = useGuestRsvp(weddingSlug, session?.guestId);

  useEffect(() => {
    getGuestSession(weddingSlug).then((s) => {
      setSession(s);
      setStep(s ? 'home' : 'password');
    });
  }, [weddingSlug]);

  const pickGuest = async (m: { id: string; name: string }) => {
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
    return <PinEntryGate wedding={w} onSelect={(m) => void pickGuest(m)} />;
  }

  // ── Home hero — mirrors the web guest home: date, serif couple name,
  // venue (revealed after RSVP), live countdown pill, sticky CTA bar
  // showing RSVP before responding and View Details after. ──
  const rsvpDeadline =
    w.rsvp_deadline && w.rsvp_deadline !== 'TBD'
      ? new Date(`${w.rsvp_deadline}T00:00:00`).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })
      : null;
  const hasRsvped = rsvp.data === 'yes' || rsvp.data === 'no' || rsvp.data === 'maybe';
  // Epoch-0 wedding_date is the "TBD" sentinel — web hides the countdown.
  const dateTbd = !w.wedding_date || new Date(w.wedding_date).getTime() <= 0;

  return (
    <View style={styles.root}>
      <Image source={resolveWeddingBackground(w.background_image)} alt="" style={StyleSheet.absoluteFill} contentFit="cover" />
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          padding: 24,
          paddingTop: insets.top,
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
          {hasRsvped ? (
            <PheraText
              variant="body"
              align="center"
              style={{ fontSize: 19, lineHeight: 26, textDecorationLine: 'underline' }}
            >
              {[w.venue_name, w.venue_location].filter(Boolean).join(', ')} 🇮🇳
            </PheraText>
          ) : (
            <PheraText variant="body" align="center" style={{ fontSize: 19, lineHeight: 26 }}>
              <PheraText variant="body" weight={700} style={{ fontSize: 19 }}>
                RSVP
              </PheraText>{' '}
              to see location
            </PheraText>
          )}
          {!dateTbd ? <Countdown targetISO={w.wedding_date} /> : null}
          {w.welcome_text ? (
            <PheraText variant="body" align="center" color={COLORS.text.muted}>
              {w.welcome_text}
            </PheraText>
          ) : null}
          <Pressable
            accessibilityRole="button"
            onPress={async () => {
              await clearGuestSession(weddingSlug);
              setSession(null);
              setStep('password');
            }}
          >
            <PheraText variant="body2" align="center" color={COLORS.text.faint}>
              Not {session?.guestName}? Switch guest
            </PheraText>
          </Pressable>
        </View>
      </ScrollView>
      {/* Web mobile sticky bar: RSVP (+deadline) before responding,
          View Details after. */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        {!hasRsvped ? (
          <>
            <PheraButton
              fullWidth
              size="lg"
              borderRadius={RADII.pill}
              onPress={() => router.push(`/guest/${weddingSlug}/rsvp` as never)}
              testID="home-rsvp"
            >
              RSVP
            </PheraButton>
            {rsvpDeadline ? (
              <PheraText variant="body2" align="center" color={COLORS.text.muted}>
                Please RSVP by {rsvpDeadline}
              </PheraText>
            ) : null}
          </>
        ) : (
          <PheraButton
            fullWidth
            size="lg"
            borderRadius={RADII.pill}
            onPress={() => router.push(`/guest/${weddingSlug}/details` as never)}
            testID="home-view-details"
          >
            View Details
          </PheraButton>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.paper },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
    backgroundColor: PALETTE.white[56],
  },
});
