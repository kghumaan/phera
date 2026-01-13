# Fix for Onboarding RLS Error

## Problem
When creating events during onboarding, you received this error:
```
new row violates row-level security policy for table "wedding_events"
```

## Root Cause
The RLS policies in `create_multi_wedding_system.sql` only had `USING` clauses but were missing `WITH CHECK` clauses. In PostgreSQL:
- `USING` clause: Applies to SELECT, UPDATE, and DELETE operations
- `WITH CHECK` clause: **Required** for INSERT operations

Without `WITH CHECK`, INSERT operations are blocked by default.

## Solution
Run the migration file: `migrations/fix_wedding_events_rls.sql`

### Steps to Apply Fix:

1. **Open Supabase SQL Editor**
   - Go to your Supabase Dashboard
   - Navigate to SQL Editor

2. **Run the Migration**
   - Copy the contents of `migrations/fix_wedding_events_rls.sql`
   - Paste into a new query
   - Click "Run" or press Ctrl/Cmd + Enter

3. **Verify the Fix**
   The migration includes a verification query at the end that shows all policies now have both USING and WITH CHECK clauses.

### What This Migration Does:
- ✅ Fixes `wedding_events` table RLS policies
- ✅ Fixes `wedding_schedule` table RLS policies  
- ✅ Fixes `schedule_items` table RLS policies
- ✅ Fixes `wedding_travel_cards` table RLS policies
- ✅ Fixes `wedding_faqs` table RLS policies
- ✅ Fixes `wedding_registry` table RLS policies
- ✅ Fixes `wedding_shops` table RLS policies
- ✅ Fixes `wedding_settings` table RLS policies

All tables now properly support INSERT, UPDATE, and DELETE operations for authenticated wedding admins.

## After Applying
Try creating an event from the event templates again - it should work now! 🎉

## Technical Details
The fix adds `WITH CHECK` clauses that match the existing `USING` clauses, ensuring that:
- You can only INSERT events for weddings you created or are an admin of
- You can only UPDATE/DELETE events for weddings you created or are an admin of
- Public users can still VIEW events for live weddings

## Prevention
This issue has been documented, and future table migrations should include both `USING` and `WITH CHECK` clauses for any `FOR ALL` policies that involve INSERT operations.

