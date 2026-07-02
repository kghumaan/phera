/**
 * Phera super admins — the two founder accounts.
 * Gates the dev-tools section in the admin top-nav (plan/mode toggles,
 * account reset) and the /api/account/delete route.
 */
export const SUPER_ADMIN_EMAILS = [
  'kv.s.ghumaan@gmail.com',
  'savani.simran@gmail.com',
] as const;

export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return (SUPER_ADMIN_EMAILS as readonly string[]).includes(email.toLowerCase());
}
