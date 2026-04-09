import { inngest } from '@/lib/inngest/client';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * Daily Deadline Check (9am UTC)
 *
 * 1. Milestones: mark overdue, auto-escalate approaching deadlines
 * 2. Guests: flag missing hotels/flights within 14 days of wedding
 * 3. Visas: flag applications pending > 30 days
 */
export const deadlineCheck = inngest.createFunction(
  {
    id: 'deadline-check',
    retries: 2,
    triggers: [{ cron: '0 9 * * *' }],
  },
  async ({ step }: { step: any }) => {
    const now = new Date();
    const results = {
      milestones_overdue: 0,
      milestones_escalated: 0,
      hotel_issues: 0,
      flight_issues: 0,
      visa_issues: 0,
    };

    // ─── 1. Milestones ──────────────────────────────────────────

    // 1a: Mark overdue milestones
    results.milestones_overdue = await step.run('mark-overdue-milestones', async () => {
      const { data: overdue } = await (supabase as any)
        .from('milestones')
        .select('id')
        .eq('status', 'pending')
        .lt('due_date', now.toISOString());

      if (!overdue || overdue.length === 0) return 0;

      const ids = overdue.map((m: any) => m.id);
      await (supabase as any)
        .from('milestones')
        .update({ status: 'overdue' })
        .in('id', ids);

      return ids.length;
    });

    // 1b: Auto-escalate approaching milestones
    results.milestones_escalated = await step.run('auto-escalate-milestones', async () => {
      const { data: milestones } = await (supabase as any)
        .from('milestones')
        .select('id, wedding_id, title, category, due_date, escalation_days_before')
        .eq('auto_escalate', true)
        .in('status', ['pending', 'in_progress']);

      if (!milestones || milestones.length === 0) return 0;

      let escalated = 0;
      for (const m of milestones as any[]) {
        const dueDate = new Date(m.due_date);
        const escalationDate = new Date(dueDate);
        escalationDate.setDate(escalationDate.getDate() - (m.escalation_days_before || 3));

        if (now < escalationDate) continue; // Not yet time to escalate

        // Check if issue already exists for this milestone
        const { data: existing } = await (supabase as any)
          .from('coordination_issues')
          .select('id')
          .eq('wedding_id', m.wedding_id)
          .contains('metadata', { milestone_id: m.id })
          .limit(1);

        if (existing && existing.length > 0) continue; // Already escalated

        await (supabase as any)
          .from('coordination_issues')
          .insert({
            wedding_id: m.wedding_id,
            category: m.category || 'general',
            title: `Approaching deadline: ${m.title}`,
            description: `Milestone "${m.title}" is due on ${m.due_date}. Auto-escalated ${m.escalation_days_before || 3} days before deadline.`,
            priority: 'high',
            status: 'open',
            source: 'inngest_deadline',
            due_date: m.due_date,
            metadata: { milestone_id: m.id },
          });

        escalated++;
      }
      return escalated;
    });

    // ─── 2. Missing hotel/flight bookings ────────────────────────

    // Get all active weddings within 14 days
    const weddingsWithin14Days = await step.run('load-upcoming-weddings', async () => {
      const fourteenDaysFromNow = new Date(now);
      fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14);

      const { data } = await supabase
        .from('weddings')
        .select('id, slug, wedding_date, couple_name')
        .gte('wedding_date', now.toISOString().split('T')[0])
        .lte('wedding_date', fourteenDaysFromNow.toISOString().split('T')[0]);

      return (data || []) as any[];
    });

    for (const wedding of weddingsWithin14Days) {
      const weddingDate = new Date(wedding.wedding_date);
      const daysUntil = Math.ceil((weddingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // 2a: Guests with RSVP=yes but no hotel
      const hotelIssues = await step.run(`check-hotels-${wedding.id}`, async () => {
        // Get guests who RSVPed yes
        const { data: yesGuests } = await supabase
          .from('rsvps')
          .select('guest_id')
          .eq('wedding_id', wedding.id)
          .eq('attending', 'yes');

        if (!yesGuests || yesGuests.length === 0) return 0;

        const guestIds = yesGuests.map((r: any) => r.guest_id).filter(Boolean);

        // Check which have hotel bookings
        const { data: hotelGuests } = await (supabase as any)
          .from('guest_hotels')
          .select('guest_id')
          .eq('wedding_id', wedding.id)
          .in('guest_id', guestIds);

        const hotelGuestIds = new Set((hotelGuests || []).map((h: any) => h.guest_id));
        const missingHotel = guestIds.filter((id: string) => !hotelGuestIds.has(id));

        let created = 0;
        for (const guestId of missingHotel) {
          // Check if issue already exists
          const { data: existing } = await (supabase as any)
            .from('coordination_issues')
            .select('id')
            .eq('guest_id', guestId)
            .eq('category', 'hotel')
            .in('status', ['open', 'in_progress'])
            .limit(1);

          if (existing && existing.length > 0) continue;

          await (supabase as any)
            .from('coordination_issues')
            .insert({
              wedding_id: wedding.id,
              guest_id: guestId,
              category: 'hotel',
              title: `No hotel booking — wedding in ${daysUntil} days`,
              priority: 'high',
              status: 'open',
              source: 'inngest_deadline',
              metadata: { days_until_wedding: daysUntil },
            });
          created++;
        }
        return created;
      });

      results.hotel_issues += hotelIssues;

      // 2b: Guests with RSVP=yes but no flight
      const flightIssues = await step.run(`check-flights-${wedding.id}`, async () => {
        const { data: yesGuests } = await supabase
          .from('rsvps')
          .select('guest_id')
          .eq('wedding_id', wedding.id)
          .eq('attending', 'yes');

        if (!yesGuests || yesGuests.length === 0) return 0;

        const guestIds = yesGuests.map((r: any) => r.guest_id).filter(Boolean);

        const { data: flightGuests } = await supabase
          .from('guest_flights')
          .select('guest_id')
          .eq('wedding_id', wedding.id)
          .in('guest_id', guestIds);

        const flightGuestIds = new Set((flightGuests || []).map((f: any) => f.guest_id));
        const missingFlight = guestIds.filter((id: string) => !flightGuestIds.has(id));

        let created = 0;
        for (const guestId of missingFlight) {
          const { data: existing } = await (supabase as any)
            .from('coordination_issues')
            .select('id')
            .eq('guest_id', guestId)
            .eq('category', 'flight')
            .in('status', ['open', 'in_progress'])
            .limit(1);

          if (existing && existing.length > 0) continue;

          await (supabase as any)
            .from('coordination_issues')
            .insert({
              wedding_id: wedding.id,
              guest_id: guestId,
              category: 'flight',
              title: `No flight booking — wedding in ${daysUntil} days`,
              priority: 'high',
              status: 'open',
              source: 'inngest_deadline',
              metadata: { days_until_wedding: daysUntil },
            });
          created++;
        }
        return created;
      });

      results.flight_issues += flightIssues;
    }

    // ─── 3. Visa applications pending > 30 days ──────────────────

    results.visa_issues = await step.run('check-stale-visas', async () => {
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: staleVisas } = await (supabase as any)
        .from('guest_visas')
        .select('id, guest_id, wedding_id, visa_type, applied_at')
        .eq('status', 'applied')
        .lt('applied_at', thirtyDaysAgo.toISOString().split('T')[0]);

      if (!staleVisas || staleVisas.length === 0) return 0;

      let created = 0;
      for (const visa of staleVisas as any[]) {
        const { data: existing } = await (supabase as any)
          .from('coordination_issues')
          .select('id')
          .eq('guest_id', visa.guest_id)
          .eq('category', 'visa')
          .in('status', ['open', 'in_progress'])
          .limit(1);

        if (existing && existing.length > 0) continue;

        const daysPending = Math.ceil(
          (now.getTime() - new Date(visa.applied_at).getTime()) / (1000 * 60 * 60 * 24),
        );

        await (supabase as any)
          .from('coordination_issues')
          .insert({
            wedding_id: visa.wedding_id,
            guest_id: visa.guest_id,
            category: 'visa',
            title: `Visa application pending over ${daysPending} days`,
            priority: 'medium',
            status: 'open',
            source: 'inngest_deadline',
            metadata: { visa_id: visa.id, visa_type: visa.visa_type, days_pending: daysPending },
          });
        created++;
      }
      return created;
    });

    return results;
  },
);
