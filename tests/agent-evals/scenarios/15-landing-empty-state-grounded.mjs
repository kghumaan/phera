/**
 * LANDING (hero chat box, anonymous): the visitor types a rotating-prompt
 * style DATA question ("who hasn't RSVPed?") on a brand-new empty draft.
 * The agent must stay grounded — no guest list exists — and offer the import
 * path instead of fabricating names or numbers.
 */
export default {
  name: 'landing-empty-state-grounded',
  description: 'Anon hero chat: RSVP question on empty draft — grounded answer + import path, nothing invented',
  persona: 'L2', // hero chat box, data question on empty state (docs/AGENT-EVALS.md §3b)
  seed: 'fresh-draft',
  anonymous: true,
  turns: [
    {
      message: "Who still hasn't RSVPed from the groom's side?",
      expect: {
        // Must acknowledge the empty state and route to building the list.
        reply: ["guest list|haven'?t added|no guests|import|upload|start"],
        notTools: ['record_rsvp', 'add_guest'],
      },
      verify: async (state) => [
        { label: 'no guests fabricated', pass: state.guests.length === 0, detail: `${state.guests.length} guests` },
        { label: 'no RSVPs fabricated', pass: state.rsvps.length === 0, detail: `${state.rsvps.length} rsvps` },
      ],
    },
    {
      message: "Right, we haven't put anything in yet. Our list is in a Google Sheet.",
      expect: {
        // The spreadsheet path: request_upload surfaces as an upload_requested
        // event (or at minimum the reply must point at uploading the sheet).
        reply: ['upload|drop|import|sheet|spreadsheet|csv|excel'],
        notTools: ['add_guest'],
      },
    },
  ],
};
