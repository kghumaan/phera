/**
 * Turn raw column names into the human phrase a couple would actually say —
 * receipts read "couple names updated", never "partner1 name, partner2 name
 * updated". Related columns collapse into ONE phrase (order-preserving,
 * deduped); anything unmapped falls back to underscores→spaces.
 */

/** Column → friendly phrase. Columns sharing a phrase collapse together. */
const FIELD_PHRASES: Record<string, string> = {
  couple_name: 'couple names',
  partner1_name: 'couple names',
  partner2_name: 'couple names',
  wedding_date: 'wedding dates',
  wedding_date_end: 'wedding dates',
  wedding_date_display: 'wedding dates',
  venue_name: 'venue',
  venue_location: 'venue',
  rsvp_deadline: 'RSVP deadline',
  wedding_side: 'side',
  is_major_event: 'main-event highlight',
  dress_code: 'dress code',
  logistics_data: 'travel & stay details',
  assigned_guest_ids: 'room assignments',
  hotel_name: 'hotel',
  bed_type: 'bed type',
};

export function humanizeFields(fields: string[]): string {
  const seen = new Set<string>();
  const phrases: string[] = [];
  for (const f of fields) {
    const phrase = FIELD_PHRASES[f] ?? f.replace(/_/g, ' ');
    if (seen.has(phrase)) continue;
    seen.add(phrase);
    phrases.push(phrase);
  }
  if (phrases.length <= 2) return phrases.join(' and ');
  return `${phrases.slice(0, -1).join(', ')} and ${phrases[phrases.length - 1]}`;
}
