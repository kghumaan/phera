import { NextRequest, NextResponse } from 'next/server';
import { outreachSender, OutreachMessage } from '@/lib/whatsapp/outreach-sender';
import { outreachService } from '@/lib/supabase/outreach-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { weddingId, templateName, languageCode = 'en', guestIds, targetStatuses, params = {} } = body;

    if (!weddingId || !templateName) {
      return NextResponse.json({ error: 'weddingId and templateName are required' }, { status: 400 });
    }

    // Get target guests
    const allGuests = await outreachService.getGuestOutreachStatuses(weddingId);
    let targetGuests = allGuests;

    if (guestIds?.length) {
      targetGuests = allGuests.filter((g) => guestIds.includes(g.id));
    } else if (targetStatuses?.length) {
      targetGuests = allGuests.filter((g) => targetStatuses.includes(g.outreach_status));
    }

    // Filter out opted-out guests
    targetGuests = targetGuests.filter((g) => !g.whatsapp_opted_out && g.phone);

    if (targetGuests.length === 0) {
      return NextResponse.json({ message: 'No eligible guests to send to', result: { total: 0 } });
    }

    // Build messages
    const messages: OutreachMessage[] = targetGuests.map((guest) => ({
      phoneNumber: guest.phone!,
      guestId: guest.id,
      weddingId,
      templateKey: templateName,
      languageCode,
      params: {
        guest_name: guest.name,
        ...params,
      },
    }));

    const result = await outreachSender.sendBatch(messages);
    return NextResponse.json({ result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
