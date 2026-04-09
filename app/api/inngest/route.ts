import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest/client';
import { outreachSequence } from '@/lib/inngest/functions/outreach-sequence';
import { deadlineCheck } from '@/lib/inngest/functions/deadline-check';
import { rsvpReminder } from '@/lib/inngest/functions/rsvp-reminder';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [outreachSequence, deadlineCheck, rsvpReminder],
});
