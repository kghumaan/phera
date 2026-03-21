import { NextRequest, NextResponse } from 'next/server';
import { outreachSender, OutreachMessage } from '@/lib/whatsapp/outreach-sender';
import { outreachService } from '@/lib/supabase/outreach-service';

/**
 * POST /api/outreach/trigger — manually trigger a specific sequence type
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { weddingId, sequenceType, guestIds, languageCode = 'en', params = {} } = body;

    if (!weddingId || !sequenceType) {
      return NextResponse.json({ error: 'weddingId and sequenceType are required' }, { status: 400 });
    }

    // Get target guests
    const allGuests = await outreachService.getGuestOutreachStatuses(weddingId);
    let targetGuests = allGuests.filter((g) => !g.whatsapp_opted_out && g.phone);

    if (guestIds?.length) {
      targetGuests = targetGuests.filter((g) => guestIds.includes(g.id));
    }

    if (targetGuests.length === 0) {
      return NextResponse.json({ message: 'No eligible guests', result: { total: 0 } });
    }

    // Map sequence type to template key
    const templateMap: Record<string, string> = {
      save_the_date: 'SAVE_THE_DATE',
      rsvp_request: 'RSVP_REQUEST',
      rsvp_nudge: 'NUDGE',
      travel_collection: 'TRAVEL_REQUEST',
      shuttle_assignment: 'SHUTTLE_ASSIGNMENT',
      schedule_reminder: 'SCHEDULE_REMINDER',
      day_before: 'DAY_BEFORE_SUMMARY',
      thank_you: 'THANK_YOU',
    };

    const templateKey = templateMap[sequenceType];
    if (!templateKey) {
      return NextResponse.json({ error: `Unknown sequence type: ${sequenceType}` }, { status: 400 });
    }

    const messages: OutreachMessage[] = targetGuests.map((guest) => ({
      phoneNumber: guest.phone!,
      guestId: guest.id,
      weddingId,
      templateKey,
      languageCode,
      params: { guest_name: guest.name, ...params },
    }));

    const result = await outreachSender.sendBatch(messages);
    return NextResponse.json({ result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
