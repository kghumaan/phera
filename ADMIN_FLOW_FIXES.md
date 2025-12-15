# Admin Flow Fixes - Summary

## Current Issues

### 1. **Missing wedding_admins Entries**
- When weddings are created via signup page, NO entry is added to `wedding_admins` table
- The app relies on `weddings.created_by` field for ownership, but `wedding_admins` table is empty
- This causes the AppHeader to not show "Admin Dashboard" button even for wedding creators

### 2. **Google OAuth Flow Skips Couple Name**
- "Start Planning Free" → Google OAuth → redirects to `/admin/onboarding/new/overview`
- The `/admin/onboarding/new/overview` route doesn't actually create a wedding
- It tries to load a wedding with slug "new" which doesn't exist
- The callback route checks if user has weddings, but if they don't, still redirects to "new"

### 3. **Wedding Slug Updates Don't Cascade**
- When user updates wedding slug in overview page, it updates `weddings.slug`
- But `wedding_admins` table stores `wedding_id` (UUID), not slug
- So this actually DOES work since it uses UUID, but we need to verify the join queries work correctly

## Root Causes

1. **`createWedding` in wedding-service.ts doesn't create `wedding_admins` entry**
2. **Google OAuth redirects to `/admin/onboarding/new/overview` without creating a wedding first**
3. **No validation that couple name is required before signup**

## Solutions

### Solution 1: Update createWedding to Always Create wedding_admins Entry
Modify `lib/supabase/wedding-service.ts` to automatically create a `wedding_admins` entry when a wedding is created.

### Solution 2: Create Pre-Signup Wedding Creation Modal
Add a modal/page that collects couple name BEFORE redirecting to OAuth or signup.

### Solution 3: Handle "new" Wedding Creation
Create an actual page at `/admin/onboarding/new` that collects couple name and creates the wedding.

### Solution 4: Database Migration
Add entries to `wedding_admins` for all existing weddings that don't have them.

## Immediate Actions

### A. SQL to Fix kv.s.ghum aan@gmail.com
Run the SQL in `migrations/seed_kv_admin.sql` to add your admin entry.

### B. Code Fixes (in order of implementation)
1. Fix `createWedding` to create `wedding_admins` entry
2. Create `/admin/onboarding/new/page.tsx` to collect couple name and create wedding
3. Update Google OAuth flow to use the new onboarding page
4. Add migration to backfill existing weddings into `wedding_admins`

## Implementation Plan

### Phase 1: Quick Fix (Immediate)
- Run SQL to fix kv.s.ghumaan@gmail.com admin access ✓
- Update `createWedding` method to create `wedding_admins` entry

### Phase 2: Onboarding Fix
- Create `/admin/onboarding/new/page.tsx` with couple name form
- Update auth callback to handle new wedding creation properly

### Phase 3: Data Migration
- Create migration to backfill all existing weddings into `wedding_admins`
- Update all weddings where `created_by` exists but no `wedding_admins` entry

### Phase 4: Validation
- Make couple name required in signup flow
- Add better error handling for missing weddings
