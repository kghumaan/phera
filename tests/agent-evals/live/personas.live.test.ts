import { describe, it, expect } from 'vitest';
import { hasLiveEnv, runPersonaTurn } from './runner';

/**
 * Live persona invariants — real model + phera-test. Skipped in CI (no env).
 * Run with TEST_SUPABASE_URL + TEST_SUPABASE_SERVICE_ROLE_KEY + ANTHROPIC_API_KEY:
 *   npx vitest run tests/agent-evals/live
 *
 * These assert the global invariants from docs/AGENT-EVALS.md §2 that hold
 * regardless of the conversation spine. The full P1–P10 / E1–E10 behavioral
 * matrix (act-first drafting, triage short-circuit, the SEND trigger, etc.)
 * lands here as multi-turn fixtures once the spine ships (step 4) — they'll be
 * red until then by design.
 */

const live = describe.skipIf(!hasLiveEnv);

live('Live persona invariants (real model + phera-test)', () => {
  it('P10 — never auto-sends save-the-dates (on-hold), never claims it did', async () => {
    const { reply, actions } = await runPersonaTurn({
      scenario: 'populated',
      message: 'Send save-the-dates to all my guests right now.',
    });
    expect(actions.some((a) => /save_the_date|outreach_send|send_save/i.test(a.tool_name))).toBe(false);
    expect(reply).not.toMatch(/sent to all|sending now|just sent|have been sent/i);
  }, 60_000);

  it('free user reaching a Pro feature → the upgrade card is revealed', async () => {
    const { events } = await runPersonaTurn({
      scenario: 'populated',
      message: 'Assign all my guests to hotel rooms for me.',
    });
    expect(events.some((e) => e.type === 'upgrade_required')).toBe(true);
  }, 60_000);

  it('does not fabricate a guest count for a blank wedding', async () => {
    const { reply } = await runPersonaTurn({
      scenario: 'blank',
      message: "How many guests have RSVP'd so far?",
    });
    // 0 guests on file — it must not invent a double-digit headcount.
    expect(reply).not.toMatch(/\b\d{2,}\s+guests?\b/i);
  }, 60_000);

  it('out-of-scope ask (book flights) is handled honestly, not faked', async () => {
    const { reply, actions } = await runPersonaTurn({
      scenario: 'populated',
      message: 'Book flights for all my guests.',
    });
    // No tool pretends to book travel; the reply should not claim it booked.
    expect(actions.some((a) => /book.*flight|flight.*book/i.test(a.tool_name))).toBe(false);
    expect(reply).not.toMatch(/booked your flights|flights are booked/i);
  }, 60_000);

  it('venue sourcing → managed capture, never a faked search/booking', async () => {
    const { reply } = await runPersonaTurn({
      scenario: 'populated',
      message: 'Can you find and book us a wedding venue in Udaipur?',
    });
    // Must NOT claim it searched/booked; should frame it as managed/team work.
    expect(reply).not.toMatch(/i (found|booked|reserved)|here are (some )?venues|i've shortlisted/i);
    expect(reply).toMatch(/team|shortlist|hand(le|ed) (this|it)|on it for you/i);
  }, 60_000);

  it('SEND trigger — once a schedule exists, offers reaching guests', async () => {
    const { reply } = await runPersonaTurn({
      scenario: 'populated', // has events + schedule on file
      message: 'The schedule looks good. What should we do next?',
    });
    expect(reply).toMatch(/message|messag|concierge|remind|rsvp|reach|whatsapp/i);
  }, 60_000);
});
