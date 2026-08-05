/**
 * Phera super admins — the founder accounts.
 * Gates the dev-tools section in the admin top-nav (plan/mode toggles,
 * account reset), the /api/account/delete route, Pro-by-default access
 * (see lib/agent/plan.ts), and a couple of client components that check
 * this directly (e.g. vendor-management).
 * Comma-separated list in the SUPER_ADMIN_EMAILS env var (repo is public).
 * Client components can only see NEXT_PUBLIC_-prefixed env vars at build
 * time, so the same list must ALSO be set as NEXT_PUBLIC_SUPER_ADMIN_EMAILS
 * (same value) for the client-side checks to work — falls back to it here.
 */
export const SUPER_ADMIN_EMAILS = (
  process.env.SUPER_ADMIN_EMAILS ?? process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS ?? ''
)
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return SUPER_ADMIN_EMAILS.includes(email.toLowerCase());
}
