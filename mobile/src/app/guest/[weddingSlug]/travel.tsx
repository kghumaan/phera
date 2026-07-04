import { useEffect, useState } from 'react';
import { View } from 'react-native';

import {
  PheraButton,
  PheraCard,
  PheraInput,
  PheraText,
  SuccessAlert,
  WarningAlert,
} from '@/components/ui';
import { GuestScreen } from '@/components/guest/GuestChrome';
import { useGuestFlights, useUpsertGuestFlight, useWedding } from '@/lib/data/hooks';
import { getGuestSession, type GuestSession } from '@/lib/guest/session';
import { COLORS, RADII } from '@/lib/theme/tokens';
import { useWeddingSlug } from '@/lib/nav';

export default function GuestTravelScreen() {
  const weddingSlug = useWeddingSlug();
  const wedding = useWedding(weddingSlug);
  const flights = useGuestFlights(wedding.data?.id);
  const upsert = useUpsertGuestFlight(wedding.data?.id);

  const [session, setSession] = useState<GuestSession | null>(null);
  const [airline, setAirline] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [arrivalDate, setArrivalDate] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [shuttle, setShuttle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getGuestSession(weddingSlug).then(setSession);
  }, [weddingSlug]);

  const existing = flights.data?.find((f) => f.guest_id === session?.guestId);

  const submit = async () => {
    setError(null);
    if (!session) return;
    if (!airline.trim() || !flightNumber.trim()) return setError('Airline and flight number are required');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(arrivalDate.trim())) return setError('Arrival date must be YYYY-MM-DD');
    if (!/^\d{1,2}:\d{2}$/.test(arrivalTime.trim())) return setError('Arrival time must be HH:MM (24h)');
    try {
      await upsert.mutateAsync({
        guestId: session.guestId,
        airline: airline.trim(),
        flightNumber: flightNumber.trim().toUpperCase(),
        departureAirport: from.trim(),
        arrivalAirport: to.trim(),
        arrivalDate: arrivalDate.trim(),
        arrivalTime: arrivalTime.trim().padStart(5, '0'),
        shuttlePreferenceTime: shuttle.trim() || null,
      });
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save — try again');
    }
  };

  return (
    <GuestScreen title="Your Travel" themeBackgroundPath={wedding.data?.background_image}>
      {saved ? <SuccessAlert>Flight saved — your airport pickup will be arranged! ✈️</SuccessAlert> : null}
      {error ? <WarningAlert onClose={() => setError(null)}>{error}</WarningAlert> : null}

      {existing && !saved ? (
        <PheraCard variant="feature">
          <View style={{ gap: 4 }}>
            <PheraText variant="h3">Flight on file</PheraText>
            <PheraText variant="body2">
              {[existing.airline, existing.flight_number].filter(Boolean).join(' ')} ·{' '}
              {existing.departure_airport} → {existing.arrival_airport}
            </PheraText>
            <PheraText variant="body2" color={COLORS.text.subtle}>
              Submitting below replaces it.
            </PheraText>
          </View>
        </PheraCard>
      ) : null}

      <View style={{ gap: 14 }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <PheraInput label="Airline" value={airline} onChangeText={setAirline} placeholder="United" />
          </View>
          <View style={{ flex: 1 }}>
            <PheraInput label="Flight #" value={flightNumber} onChangeText={setFlightNumber} placeholder="UA 48" autoCapitalize="characters" />
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <PheraInput label="From (airport)" value={from} onChangeText={setFrom} placeholder="SFO" autoCapitalize="characters" />
          </View>
          <View style={{ flex: 1 }}>
            <PheraInput label="To (airport)" value={to} onChangeText={setTo} placeholder="UDR" autoCapitalize="characters" />
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <PheraInput label="Arrival date" value={arrivalDate} onChangeText={setArrivalDate} placeholder="2026-11-17" keyboardType="numbers-and-punctuation" />
          </View>
          <View style={{ flex: 1 }}>
            <PheraInput label="Arrival time (24h)" value={arrivalTime} onChangeText={setArrivalTime} placeholder="14:30" keyboardType="numbers-and-punctuation" />
          </View>
        </View>
        <PheraInput
          label="Shuttle preference (optional)"
          value={shuttle}
          onChangeText={setShuttle}
          placeholder="e.g. 3:00 PM pickup"
          helperText="We group pickups by arrival time"
        />
        <PheraButton
          fullWidth
          size="lg"
          borderRadius={RADII.cta}
          loading={upsert.isPending}
          onPress={submit}
          testID="travel-submit"
        >
          Save flight details
        </PheraButton>
      </View>
    </GuestScreen>
  );
}
