import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { computeInvitedEventIds } from '@/lib/access/event-filter';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Returns the event IDs a given guest is invited to for this wedding.
 * Applies the default-true contract: starts from all wedding_events for the
 * wedding, removes any where guest_event_access.invited = false for this guest.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ weddingSlug: string }> },
) {
  try {
    const { weddingSlug } = await params;
    const guestId = request.nextUrl.searchParams.get('guestId');

    if (!weddingSlug || !guestId) {
      return NextResponse.json({ error: 'Missing weddingSlug or guestId' }, { status: 400 });
    }

    // Validate guest belongs to wedding.
    const { data: guest, error: guestError } = await supabase
      .from('guests')
      .select('id, wedding_id')
      .eq('id', guestId)
      .maybeSingle();

    if (guestError || !guest || guest.wedding_id !== weddingSlug) {
      return NextResponse.json({ error: 'Guest not found for wedding' }, { status: 404 });
    }

    const { data: wedding, error: weddingError } = await supabase
      .from('weddings')
      .select('id')
      .eq('slug', weddingSlug)
      .single();

    if (weddingError || !wedding) {
      return NextResponse.json({ error: 'Wedding not found' }, { status: 404 });
    }

    const { data: events, error: eventsError } = await supabase
      .from('wedding_events')
      .select('id')
      .eq('wedding_id', wedding.id);

    if (eventsError) {
      return NextResponse.json({ error: 'Failed to load events' }, { status: 500 });
    }

    const allEventIds = (events || []).map(e => e.id);

    const { data: access, error: accessError } = await supabase
      .from('guest_event_access')
      .select('event_id, invited')
      .eq('guest_id', guestId);

    if (accessError) {
      // If the table doesn't exist yet (pre-migration), fall back to all events.
      return NextResponse.json({ invitedEventIds: allEventIds });
    }

    return NextResponse.json({
      invitedEventIds: computeInvitedEventIds(allEventIds, access || []),
    });
  } catch (error) {
    console.error('Event access lookup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
