import { inngest } from '@/lib/inngest/client';
import { createClient } from '@supabase/supabase-js';
import { outreachSender, OutreachMessage } from '@/lib/whatsapp/outreach-sender';
import { SEQUENCE_TEMPLATE_MAP, SequenceType } from '@/lib/types/outreach';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * Outreach Sequence Processor
 *
 * Triggered when a new outreach sequence is started for a wedding.
 * Loads the sequence config, finds target guests, sends WhatsApp templates
 * with durable delays between steps, and creates escalation issues for
 * unresponsive guests after all attempts.
 */
export const outreachSequence = inngest.createFunction(
  {
    id: 'outreach-sequence',
    retries: 3,
    triggers: [{ event: 'outreach/sequence.start' }],
  },
  async ({ event, step }: { event: any; step: any }) => {
    const { wedding_id, sequence_id } = event.data as {
      wedding_id: string;
      sequence_id: string;
    };

    // Step 1: Load sequence config
    const sequence = await step.run('load-sequence', async () => {
      const { data, error } = await supabase
        .from('outreach_sequences')
        .select('*')
        .eq('id', sequence_id)
        .single();

      if (error || !data) {
        throw new Error(`Sequence ${sequence_id} not found: ${error?.message}`);
      }
      return data as any;
    });

    if (sequence.status === 'sent' || sequence.status === 'completed') {
      return { skipped: true, reason: 'Sequence already processed' };
    }

    // Step 2: Load target guests
    const targetGuests = await step.run('load-target-guests', async () => {
      const targetStatuses = sequence.target_statuses || ['not_contacted'];

      // Fetch guests matching target outreach statuses
      const { data: guests, error } = await supabase
        .from('guests')
        .select('id, name, phone, email, outreach_status, outreach_attempt_count, whatsapp_opted_out')
        .eq('wedding_id', wedding_id);

      if (error) throw new Error(`Failed to load guests: ${error.message}`);

      // Filter in JS — outreach_status may not exist as a column yet, so handle gracefully
      return (guests || []).filter((g: any) => {
        if (g.whatsapp_opted_out) return false;
        if (!g.phone) return false;
        const status = g.outreach_status || 'not_contacted';
        return targetStatuses.includes(status);
      });
    });

    if (targetGuests.length === 0) {
      // Mark sequence as sent (no targets)
      await step.run('mark-empty-sent', async () => {
        await supabase
          .from('outreach_sequences')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', sequence_id);
      });
      return { sent: 0, skipped: true, reason: 'No target guests' };
    }

    // Step 3: Send WhatsApp templates to all target guests
    const templateKey = (sequence.template_name || '')
      .toUpperCase()
      .replace(/_V\d+$/, '');

    const sendResult = await step.run('send-batch', async () => {
      const messages: OutreachMessage[] = targetGuests.map((guest: any) => ({
        phoneNumber: guest.phone,
        guestId: guest.id,
        weddingId: wedding_id,
        templateKey,
        languageCode: 'en',
        params: { guest_name: guest.name },
      }));

      return outreachSender.sendBatch(messages);
    });

    // Step 4: Update outreach status for successfully sent guests
    await step.run('update-guest-statuses', async () => {
      const sentGuestIds = [
        ...sendResult.accepted.map((r: any) => r.guestId),
        ...sendResult.delivered.map((r: any) => r.guestId),
      ];

      // Determine the new status based on sequence type
      const newStatus = getNextStatus(sequence.sequence_type as SequenceType);

      for (const guestId of sentGuestIds) {
        await supabase
          .from('guests')
          .update({
            outreach_status: newStatus,
            outreach_last_contacted_at: new Date().toISOString(),
          } as any)
          .eq('id', guestId);
      }
    });

    // Step 5: Mark sequence as sent
    await step.run('mark-sequence-sent', async () => {
      await supabase
        .from('outreach_sequences')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', sequence_id);
    });

    // Step 6: Wait 72 hours, then check for unresponsive guests
    await step.sleep('wait-for-responses', '72h');

    const unresponsiveCount = await step.run('check-unresponsive', async () => {
      // Re-fetch guests who were targeted but haven't moved past their status
      const sentGuestIds = [
        ...sendResult.accepted.map((r: any) => r.guestId),
        ...sendResult.delivered.map((r: any) => r.guestId),
      ];

      if (sentGuestIds.length === 0) return 0;

      const { data: guests } = await supabase
        .from('guests')
        .select('id, name, outreach_status, outreach_attempt_count')
        .in('id', sentGuestIds);

      let count = 0;
      for (const guest of (guests || []) as any[]) {
        const attempts = guest.outreach_attempt_count || 0;
        // If guest still at same status after 3+ attempts, they're unresponsive
        if (attempts >= 3) {
          await supabase
            .from('coordination_issues')
            .insert({
              wedding_id,
              guest_id: guest.id,
              category: 'outreach',
              title: `Unresponsive after ${attempts} outreach attempts`,
              description: `Guest "${guest.name}" has not responded after ${attempts} outreach messages. Current status: ${guest.outreach_status || 'unknown'}. Manual follow-up recommended.`,
              priority: 'medium',
              status: 'open',
              source: 'inngest_outreach',
              metadata: { sequence_id, sequence_type: sequence.sequence_type, attempts },
            });
          count++;
        }
      }

      return count;
    });

    return {
      sent: sendResult.accepted.length + sendResult.delivered.length,
      failed: sendResult.failed.length,
      opted_out: sendResult.optedOut.length,
      frequency_capped: sendResult.retryTomorrow.length,
      unresponsive_escalations: unresponsiveCount,
    };
  },
);

/**
 * Map sequence type to the outreach_status the guest should move to after send.
 */
function getNextStatus(sequenceType: SequenceType): string {
  switch (sequenceType) {
    case 'save_the_date':
      return 'save_the_date_sent';
    case 'rsvp_request':
    case 'rsvp_nudge':
    case 'rsvp_nudge_2':
      return 'rsvp_requested';
    case 'travel_collection':
      return 'travel_collected';
    case 'shuttle_assignment':
    case 'schedule_reminder':
    case 'day_before':
    case 'day_of':
    case 'thank_you':
      return 'logistics_complete';
    default:
      return 'not_contacted';
  }
}
