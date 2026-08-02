/**
 * Guest list arrives as a FILE (the richest path — smart column mapping
 * handles plus-one columns, additional-guest columns, party sizes). The
 * agent must route to the in-chat upload card via request_upload, not
 * dictate a format in prose, not send them elsewhere, and not fabricate
 * guests before the file lands.
 */
export default {
  name: 'guest-import-upload',
  description: 'Blank wedding: spreadsheet guest list routes to request_upload, nothing fabricated',
  persona: 'P1', // brand-new couple with an existing spreadsheet
  seed: 'blank',
  turns: [
    {
      message:
        "I've got our whole guest list in an Excel file — it has a plus-one column and extra columns for additional family guests. Can I just give you the file?",
      expect: {
        // request_upload surfaces as the upload_requested EVENT (special-cased
        // in dispatch — no action row).
        events: ['upload_requested'],
        replyNot: ["can't upload|cannot upload|email it to|go to the guest list page"],
      },
      verify: async (state) => [
        {
          label: 'no guests fabricated before the upload',
          pass: state.guests.length === 0,
          detail: `${state.guests.length} guests`,
        },
      ],
    },
  ],
};
