/**
 * Phera super admins — the founder accounts.
 * Gates the dev-tools section in the admin top-nav (plan/mode toggles,
 * account reset) and the /api/account/delete route.
 * Comma-separated list in the SUPER_ADMIN_EMAILS env var (repo is public).
 */
export const SUPER_ADMIN_EMAILS = (process.env.SUPER_ADMIN_EMAILS ?? '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return SUPER_ADMIN_EMAILS.includes(email.toLowerCase());
}
