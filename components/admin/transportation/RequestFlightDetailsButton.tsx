'use client';

/**
 * One-click "ask every guest for their flight + arrival details" action. Opens
 * the existing BroadcastComposer pre-filled with a flight-collection message +
 * data schema, targeted at everyone. Replies are extracted into each
 * recipient's collected_data by the broadcast reply pipeline; a follow-up slice
 * lands them into guest_flights for shuttle assignment.
 */

import { useState } from 'react';
import FlightLandRoundedIcon from '@mui/icons-material/FlightLandRounded';
import { SecondaryActionButton } from '@/components/admin/ActionButton';
import BroadcastComposer from '@/components/admin/concierge/BroadcastComposer';
import type { BroadcastDataField } from '@/lib/supabase/broadcasts-service';

const FLIGHT_MESSAGE =
  "Hi! We're sorting out airport shuttles for the wedding 🚐 To get you on the right pickup, could you reply with your arrival details? Please share: your arrival airport, the date and time you land, your airline + flight number, and whether you'd like a shuttle to the venue. Thank you!";

const FLIGHT_FIELDS: BroadcastDataField[] = [
  { key: 'arrival_airport', label: 'Arrival airport', type: 'text' },
  { key: 'arrival_date', label: 'Arrival date', type: 'date' },
  { key: 'arrival_time', label: 'Arrival time', type: 'text' },
  { key: 'airline_flight', label: 'Airline & flight number', type: 'text' },
  { key: 'needs_shuttle', label: 'Needs a shuttle?', type: 'text' },
];

export default function RequestFlightDetailsButton({
  weddingId,
  weddingSlug,
  onSent,
}: {
  weddingId: string;
  weddingSlug: string;
  onSent?: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <SecondaryActionButton startIcon={<FlightLandRoundedIcon />} onClick={() => setOpen(true)} sx={{ whiteSpace: 'nowrap' }}>
        Request flight details
      </SecondaryActionButton>
      <BroadcastComposer
        open={open}
        onClose={() => setOpen(false)}
        weddingId={weddingId}
        weddingSlug={weddingSlug}
        onSent={() => {
          setOpen(false);
          onSent?.();
        }}
        initialMessage={FLIGHT_MESSAGE}
        initialCollectsData
        initialDataSchema={FLIGHT_FIELDS}
      />
    </>
  );
}
