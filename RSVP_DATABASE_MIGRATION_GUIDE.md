# RSVP Database Migration Guide

## Overview
This guide outlines the comprehensive updates made to capture ALL data points from the RSVP form, including support for 'maybe' attendance status.

## Changes Made

### 1. Database Schema Changes
The RSVP table has been enhanced to capture all form fields:

**New/Modified Columns:**
- `attending`: Changed from `boolean` to `text` with values: 'yes', 'no', 'maybe'
- `country_code`: Phone country code (e.g., '+1', '+91')
- `plus_one`: Boolean indicating if bringing plus one
- `food_preference`: Array of food preferences (text[])
- `song_request`: Music request from guest
- `special_message`: Special message from guest
- `maybe_comment`: Comment when selecting 'maybe' attendance

**Existing Columns (Enhanced):**
- `plus_one_name`: Plus one's name
- `plus_one_email`: Plus one's email
- `dietary_restrictions`: Dietary restrictions/allergies
- `guest_count`: Number of guests

### 2. Migration Script
Run the migration script located at `migrations/enhance_rsvp_table.sql`:

```bash
# Connect to your Supabase database and run:
psql -h your-db-host -U postgres -d postgres -f migrations/enhance_rsvp_table.sql
```

**Or manually run these commands:**

```sql
-- Step 1: Change attending from boolean to text
ALTER TABLE rsvps ADD COLUMN attending_new text;
UPDATE rsvps SET attending_new = CASE 
  WHEN attending = true THEN 'yes'
  WHEN attending = false THEN 'no'
  ELSE 'no'
END;
ALTER TABLE rsvps DROP COLUMN attending;
ALTER TABLE rsvps RENAME COLUMN attending_new TO attending;
ALTER TABLE rsvps ADD CONSTRAINT rsvps_attending_check 
CHECK (attending IN ('yes', 'no', 'maybe'));
ALTER TABLE rsvps ALTER COLUMN attending SET NOT NULL;

-- Step 2: Add new columns
ALTER TABLE rsvps ADD COLUMN country_code text DEFAULT '+1';
ALTER TABLE rsvps ADD COLUMN plus_one boolean DEFAULT false;
ALTER TABLE rsvps ADD COLUMN food_preference text[];
ALTER TABLE rsvps ADD COLUMN song_request text;
ALTER TABLE rsvps ADD COLUMN special_message text;
ALTER TABLE rsvps ADD COLUMN maybe_comment text;

-- Step 3: Add indexes
CREATE INDEX idx_rsvps_attending ON rsvps(attending);
CREATE INDEX idx_rsvps_plus_one ON rsvps(plus_one);

-- Step 4: Update existing data
UPDATE rsvps SET plus_one = true WHERE plus_one_name IS NOT NULL AND plus_one_name != '';
```

### 3. TypeScript Updates
Updated type definitions in `lib/supabase/types.ts`:

- `RSVP.attending`: Now `'yes' | 'no' | 'maybe'` instead of `boolean`
- Added all new fields to RSVP interface
- Enhanced RSVPFormData to support both old and new formats

### 4. Service Layer Updates
Updated `lib/supabase/rsvp-service.ts`:

- **Enhanced submitRSVP()**: Now captures all form fields
- **Backward compatibility**: Handles both old boolean and new string attending values
- **Food preferences**: Supports both string and array formats
- **Phone handling**: Properly combines country code with phone number
- **New functions**: Added `getAllRSVPs()` and `getMaybeAttendees()`

### 5. Form Updates
Updated `components/guest/CustomRSVPForm.tsx`:

- Fixed data mapping to send all form fields
- Proper type conversion for attending field
- Enhanced data validation

## Data Mapping

### Form Field → Database Column
```
firstName + lastName → guests.name
email → guests.email
phone + countryCode → guests.phone (combined)
countryCode → rsvps.country_code
attending → rsvps.attending ('yes'/'no'/'maybe')
plusOne → rsvps.plus_one (boolean)
plusOneName → rsvps.plus_one_name
plusOneEmail → rsvps.plus_one_email
guestCount → rsvps.guest_count
foodPreference[] → rsvps.food_preference (array)
dietaryRestrictions → rsvps.dietary_restrictions
songRequest → rsvps.song_request
specialMessage → rsvps.special_message
maybeComment → rsvps.maybe_comment
weddingSide → guests.wedding_side
```

## New Query Capabilities

After migration, you can now query:

```sql
-- Get all maybe responses
SELECT * FROM rsvps WHERE attending = 'maybe';

-- Get food preferences analysis
SELECT food_preference, COUNT(*) 
FROM rsvps 
WHERE attending = 'yes' 
GROUP BY food_preference;

-- Get song requests
SELECT song_request, guest.name 
FROM rsvps 
JOIN guests ON rsvps.guest_id = guests.id 
WHERE song_request IS NOT NULL;

-- Get maybe comments for follow-up
SELECT maybe_comment, guest.name, guest.email
FROM rsvps 
JOIN guests ON rsvps.guest_id = guests.id 
WHERE attending = 'maybe' AND maybe_comment IS NOT NULL;
```

## Testing

After running the migration:

1. **Test existing RSVPs**: Verify old data is properly converted
2. **Test new RSVP submission**: Submit a new RSVP with all fields
3. **Test maybe attendance**: Submit with 'maybe' status and comment
4. **Test food preferences**: Submit with multiple food preferences
5. **Verify queries**: Test all new query functions

## Rollback Plan

If needed, you can rollback by:

```sql
-- Convert attending back to boolean (will lose 'maybe' data)
ALTER TABLE rsvps ADD COLUMN attending_old boolean;
UPDATE rsvps SET attending_old = (attending = 'yes');
ALTER TABLE rsvps DROP COLUMN attending;
ALTER TABLE rsvps RENAME COLUMN attending_old TO attending;

-- Drop new columns
ALTER TABLE rsvps DROP COLUMN country_code;
ALTER TABLE rsvps DROP COLUMN plus_one;
ALTER TABLE rsvps DROP COLUMN food_preference;
ALTER TABLE rsvps DROP COLUMN song_request;
ALTER TABLE rsvps DROP COLUMN special_message;
ALTER TABLE rsvps DROP COLUMN maybe_comment;
```

## Benefits

✅ **Complete data capture**: All form fields now stored in database  
✅ **Maybe support**: Proper handling of uncertain attendance  
✅ **Better analytics**: Rich data for wedding planning insights  
✅ **Backward compatibility**: Existing code continues to work  
✅ **Enhanced queries**: New functions for comprehensive RSVP management  
✅ **Type safety**: Full TypeScript support for all fields 