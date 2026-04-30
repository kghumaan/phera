/**
 * Helpers for guest-row email handling.
 *
 * Background: the `guests.email` column is NOT NULL, so the import path and
 * the GuestDetailDrawer save path generate a placeholder of the form
 *   imported-<timestamp>-<random>@phera.io
 * when a row has no real email. These rows MUST NOT be sent transactional
 * email — they would bounce-flood Resend and hurt our domain reputation.
 *
 * Use `isPheraPlaceholderEmail` at every guest-email outbound call site,
 * and `filterRealGuestEmails` to narrow a guest list before sending.
 */

const PHERA_PLACEHOLDER_PATTERN = /^imported-[^@]+@phera\.io$/i;

export function isPheraPlaceholderEmail(email: string | null | undefined): boolean {
  if (!email) return true;
  return PHERA_PLACEHOLDER_PATTERN.test(email.trim());
}

export function hasRealGuestEmail<T extends { email: string | null | undefined }>(
  guest: T,
): boolean {
  return !isPheraPlaceholderEmail(guest.email);
}

export function filterRealGuestEmails<T extends { email: string | null | undefined }>(
  guests: T[],
): T[] {
  return guests.filter(hasRealGuestEmail);
}
