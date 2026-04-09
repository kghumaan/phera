import { inngest } from '@/lib/inngest/client';
import { createClient } from '@supabase/supabase-js';
import { outreachSender, OutreachMessage } from '@/lib/whatsapp/outreach-sender';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const MAX_REMINDERS = 3;

/**
 * Weekly RSVP Reminder (Mondays 10am UTC)
 *
 * For each active wedding with an RSVP deadline within 14 days:
 * 1. Find guests who haven't RSVPed
 * 2. Skip guests who've already received 3+ reminders or opted out
 * 3. Send RSVP reminder WhatsApp template
 * 4. Update tracking fields
 */
export const rsvpReminder = inngest.createFunction(
  {
    id: 'rsvp-reminder',
    retries: 2,
    triggers: [{ cron: '0 10 * * 1' }],
  },
  async ({ step }: { step: any }) => {
    const now = new Date();
    const results = {
      weddings_checked: 0,
      reminders_sent: 0,
      guests_skipped: 0,
    };

    // Step 1: Find weddings with RSVP deadline within 14 days
    const activeWeddings = await step.run('load-active-weddings', async () => {
      const fourteenDaysFromNow = new Date(now);
      fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14);

      const { data } = await supabase
        .from('weddings')
        .select('id, slug, couple_name, rsvp_deadline, wedding_date')
        .gte('rsvp_deadline', now.toISOString().split('T')[0])
        .lte('rsvp_deadline', fourteenDaysFromNow.toISOString().split('T')[0]);

      return (data || []) as any[];
    });

    results.weddings_checked = activeWeddings.length;

    for (const wedding of activeWeddings) {
      const sendResult = await step.run(`send-reminders-${wedding.id}`, async () => {
        // Get all guests for this wedding
        const { data: allGuests } = await supabase
          .from('guests')
          .select('id, name, phone, email, outreach_attempt_count, whatsapp_opted_out')
          .eq('wedding_id', wedding.id);

        if (!allGuests || allGuests.length === 0) return { sent: 0, skipped: 0 };

        // Get guests who already have RSVPs
        const { data: rsvpGuests } = await supabase
          .from('rsvps')
          .select('guest_id')
          .eq('wedding_id', wedding.id);

        const rsvpGuestIds = new Set((rsvpGuests || []).map((r: any) => r.guest_id));

        // Filter to guests who need reminders
        const eligibleGuests = (allGuests as any[]).filter((guest) => {
          // Skip if already RSVPed
          if (rsvpGuestIds.has(guest.id)) return false;
          // Skip if no phone
          if (!guest.phone) return false;
          // Skip if opted out
          if (guest.whatsapp_opted_out) return false;
          // Skip if already sent max reminders
          const attempts = guest.outreach_attempt_count || 0;
          if (attempts >= MAX_REMINDERS) return false;
          return true;
        });

        const skipped = allGuests.length - eligibleGuests.length - rsvpGuestIds.size;

        if (eligibleGuests.length === 0) return { sent: 0, skipped };

        // Build messages using RSVP_REQUEST template
        const messages: OutreachMessage[] = eligibleGuests.map((guest: any) => ({
          phoneNumber: guest.phone,
          guestId: guest.id,
          weddingId: wedding.id,
          templateKey: 'RSVP_REQUEST',
          languageCode: 'en',
          params: {
            guest_name: guest.name,
            couple_name: wedding.couple_name || 'the couple',
            rsvp_deadline: wedding.rsvp_deadline || 'soon',
          },
        }));

        const batchResult = await outreachSender.sendBatch(messages);

        // Update tracking fields for sent guests
        const sentGuestIds = [
          ...batchResult.accepted.map((r) => r.guestId),
          ...batchResult.delivered.map((r) => r.guestId),
        ];

        for (const guestId of sentGuestIds) {
          await supabase
            .from('guests')
            .update({
              outreach_last_contacted_at: new Date().toISOString(),
            } as any)
            .eq('id', guestId);

          // Increment attempt count — try RPC first, fall back to manual
          try {
            await (supabase as any).rpc('increment_outreach_attempt', { guest_id_input: guestId });
          } catch {
            // Manual increment fallback
            const { data: guest } = await supabase
              .from('guests')
              .select('outreach_attempt_count')
              .eq('id', guestId)
              .single();
            const current = (guest as any)?.outreach_attempt_count || 0;
            await supabase
              .from('guests')
              .update({ outreach_attempt_count: current + 1 } as any)
              .eq('id', guestId);
          }
        }

        return { sent: sentGuestIds.length, skipped };
      });

      results.reminders_sent += sendResult.sent;
      results.guests_skipped += sendResult.skipped;
    }

    return results;
  },
);
