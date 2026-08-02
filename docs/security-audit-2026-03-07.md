# Phera Pre-Launch Security Audit — 2026-03-07

**Branch:** `sim-branch-e67513`
**32 files changed**, 650+ insertions, 299 deletions

---

## Summary of All Changes

### New Files Created
| File | Purpose |
|------|---------|
| `lib/utils/verify-wedding-access.ts` | Shared helper: checks if user owns or admins a wedding via `weddings.created_by` or `wedding_admins` table |
| `lib/utils/auth-helpers.ts` | Shared `getAuthenticatedClient()` — DRY'd from 11 vendor route files |
| `lib/utils/rate-limiter.ts` | Reusable IP-based rate limiter (in-memory, resets on deploy) |
| `app/api/pin/verify/route.ts` | Server-side PIN verification with rate limiting (6 attempts / 15 min) |
| `supabase/migrations/20260307_rls_lockdown.sql` | RLS policies for all tables |

### Env Vars Required
| Variable | Required? | Purpose |
|----------|-----------|---------|
| `VENDOR_WEBHOOK_SECRET` | Recommended | Shared secret for Whapi webhook verification. Set in Vercel + update Whapi webhook URL to `?token=<secret>` |
| `TEMPLATE_WEDDING_SLUG` | Optional | Template wedding slug for schedule prepopulation. Defaults to `simran-karanvir` |

### No New Secrets for Auth
All API auth uses existing Supabase session cookies via `getAuthenticatedClient()` + `verifyWeddingAccess()`. No new auth secrets needed.

---

## Priority 1: CRITICAL Security Fixes

### 1A. WhatsApp Endpoints — Added Auth + Wedding Ownership
**Files:** `app/api/whatsapp/{broadcast,send-template,opt-in}/route.ts`

Previously had ZERO authentication. Anyone on the internet could send WhatsApp messages to guests, opt in phone numbers, or trigger broadcasts.

**Fix:** Added `getAuthenticatedClient()` + `verifyWeddingAccess()` to all three. Unauthenticated requests get `401`. Authenticated but wrong wedding gets `403`.

### 1B. Vendor Webhook — Secret Token Verification
**File:** `app/api/vendors/webhook/route.ts`

Previously accepted any POST request. An attacker could fabricate vendor messages and trigger AI coordinator replies.

**Fix:** Checks `VENDOR_WEBHOOK_SECRET` env var against `?token=` query param or `x-webhook-secret` header. If env var is not set, the check is skipped (graceful degradation).

### 1C. PIN Entry Bypass — Removed URL Param Bypass
**File:** `components/guest/PinEntry.tsx`

Previously, adding `?bypass_pin=true`, `?auth_success=true`, `?restore_pin=true`, or `?magic_link=true` to ANY wedding URL would completely bypass PIN entry.

**Fix:** Removed `bypass_pin`, `auth_success`, and `restore_pin` checks entirely. `magic_link` is kept but now requires a valid Supabase session.

### 1D. Voice Tasks — Added Auth
**File:** `app/api/admin/tasks/voice/route.ts`

Previously had no authentication. Anyone could upload audio and consume Groq API credits.

**Fix:** Added `getAuthenticatedClient()` check.

### 1E. RLS Policies — Lockdown Migration
**File:** `supabase/migrations/20260307_rls_lockdown.sql`

Previously all RLS policies were `USING(true) WITH CHECK(true)`. Vendor tables didn't even have RLS enabled.

**Fix:** Proper per-table policies with ownership checks. Split INSERT/UPDATE/DELETE for weddings table to fix INSERT blocking bug.

---

## Priority 2: HIGH Security Fixes

### 2A. Vendor API Routes — Added Wedding Ownership Checks
All 11 vendor API routes now check `verifyWeddingAccess()` after auth.

### 2B. Security Headers
HSTS, CSP (permissive for Next.js/MUI), Permissions-Policy added to `next.config.ts`.

### 2C. Wildcard Image Domain Restriction
Restricted from `hostname: '**'` to specific allowed domains.

---

## Priority 3: Logic Bugs Fixed

- Hardcoded `simran-karanvir` removed from non-test code
- Broadcast status always returning 'completed' fixed
- Broadcast using browser Supabase client fixed to server-side
- `formatParametersForAPI` missing argument fixed

---

## Priority 4: Easy Wins

- Rate limiting on public endpoints (contact, feature-request, waitlist, preorder)
- Server-side PIN verification endpoint
