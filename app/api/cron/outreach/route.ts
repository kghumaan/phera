import { NextRequest, NextResponse } from 'next/server';
import { outreachService } from '@/lib/supabase/outreach-service';
import { outreachSender, OutreachMessage } from '@/lib/whatsapp/outreach-sender';
import { escalationEngine } from '@/lib/ai/escalation-engine';
import { getDueSequences, handlePartialDelivery } from '@/lib/outreach/scheduler';

/**
 * GET /api/cron/outreach — Process due outreach sequences
 * Protected by CRON_SECRET env var
 * Runs every 2 hours via Vercel Cron
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all pending sequences that are due
    const allPending = await outreachService.getPendingSequences();
    const dueSequences = getDueSequences(allPending);

    const results = {
      processed: 0,
      sent: 0,
      skipped: 0,
      escalations_created: 0,
      errors: [] as string[],
    };

    for (const sequence of dueSequences) {
      try {
        const seq = sequence as any;

        // Get target guests
        const guests = await outreachService.getGuestOutreachStatuses(seq.wedding_id);
        const targetGuests = guests.filter(
          (g) =>
            seq.target_statuses.includes(g.outreach_status) &&
            !g.whatsapp_opted_out &&
            g.phone
        );

        if (targetGuests.length === 0) {
          await outreachService.markSequenceSent(seq.id);
          results.skipped++;
          continue;
        }

        // Build messages
        const messages: OutreachMessage[] = targetGuests.map((guest) => ({
          phoneNumber: guest.phone!,
          guestId: guest.id,
          weddingId: seq.wedding_id,
          templateKey: seq.template_name.toUpperCase().replace(/_V\d+$/, ''),
          languageCode: 'en',
          params: { guest_name: guest.name },
        }));

        // Send batch
        const batchResult = await outreachSender.sendBatch(messages);
        const categorized = handlePartialDelivery(batchResult);

        results.sent += categorized.delivered.length;

        // Mark sequence as sent
        await outreachService.markSequenceSent(seq.id);
        results.processed++;

        // Check for escalations (guests with 3+ attempts and no response)
        for (const guest of guests) {
          if (guest.outreach_attempt_count >= 3) {
            const reason = await escalationEngine.checkForEscalation(guest.id, seq.wedding_id);
            if (reason) results.escalations_created++;
          }
        }
      } catch (err: any) {
        results.errors.push(`Sequence ${sequence.id}: ${err.message}`);
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
