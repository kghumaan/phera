export const BETA_ACCESS_EMAILS: ReadonlySet<string> = new Set([
  'kv.s.ghumaan@gmail.com',
  'savani.simran@google.com',
]);

export function isBetaUser(email?: string | null): boolean {
  if (!email) return false;
  return BETA_ACCESS_EMAILS.has(email.toLowerCase());
}
