# Plus One Authentication Implementation

## Overview
Successfully implemented authentication for plus ones, allowing them to log back into the wedding website using their email address if it was shared during the RSVP process.

## Problem Solved
Previously, only the main guest (who filled out the RSVP) could authenticate with their email. Plus ones' emails were collected and stored in the `rsvps` table but they couldn't use these emails to log back into the site.

## Solution Implemented
Enhanced the authentication system to support plus one authentication by:

1. **Email Validation**: Modified to check both `guests` table and `rsvps.plus_one_email` field
2. **User Authentication**: Updated to handle plus one authentication flow
3. **RSVP Status Checking**: Added logic to check RSVP status for plus ones
4. **Guest Authentication**: Enhanced localStorage-based auth to support plus ones

## Technical Implementation

### 1. Enhanced Email Validation (`lib/supabase/auth-service.ts`)

Updated `validateEmailExists` function to check both tables:
- First checks `guests` table for main guests
- Then checks `rsvps.plus_one_email` for plus ones
- Returns additional metadata about whether user is a plus one

```typescript
// Returns: { exists: boolean; guest?: any; isPlusOne?: boolean; mainGuest?: any }
```

### 2. Enhanced User Authentication (`lib/supabase/auth-service.ts`)

Updated `getCurrentUser` function to handle plus one authentication:
- Checks Supabase auth session first
- If authenticated email not found in `guests` table, checks `rsvps.plus_one_email`
- Creates virtual user data for plus ones with unique ID format: `plus-one-{guest_id}`

### 3. Enhanced RSVP Status Checking (`lib/contexts/AuthContext.tsx`)

Updated `checkRSVPStatus` function:
- Detects plus one authentication by checking if user ID starts with "plus-one-"
- For plus ones: queries RSVPs by `plus_one_email` field
- For main guests: uses existing logic

### 4. Plus One Authentication Helper (`lib/contexts/AuthContext.tsx`)

Added `handlePlusOneAuth` function:
- Looks up plus one data from RSVPs table
- Creates virtual guest authentication record
- Stores authentication data in localStorage for future visits

### 5. Enhanced Guest Authentication (`lib/contexts/AuthContext.tsx`)

Updated `checkAuthStatus` function:
- Handles both main guest and plus one authentication from localStorage
- Differentiates between the two types and handles them appropriately
- Plus ones don't need avatar data fetching since they don't exist in `guests` table

## Authentication Flow

### For Main Guests (Existing Flow)
1. User enters email → Validated against `guests` table
2. Magic link sent → User authenticated
3. User data fetched from `guests` table

### For Plus Ones (New Flow)
1. Plus one enters email → Validated against `rsvps.plus_one_email` field
2. Magic link sent → Plus one authenticated
3. Virtual user data created from RSVP record
4. User ID format: `plus-one-{main_guest_id}`

## Database Schema Usage

The implementation leverages existing database fields:
- `rsvps.plus_one_email`: Stores plus one email addresses
- `rsvps.plus_one_name`: Stores plus one names  
- `rsvps.guest_id`: Links plus one to main guest

No database schema changes were required.

## Security Considerations

1. **Email Validation**: Only plus ones with emails in the RSVPs table can authenticate
2. **Virtual User IDs**: Plus ones get unique IDs that don't conflict with main guests
3. **Data Access**: Plus ones can only access their associated RSVP data
4. **Session Management**: Plus one authentication uses same security as main guests

## User Experience

### Before
- Only main guests could authenticate with their email
- Plus ones couldn't log back in even if they provided their email during RSVP
- Plus ones had to ask the main guest to access the site

### After
- Plus ones can authenticate using their email address
- They can view RSVP status and access all wedding information
- Authentication is persistent across browser sessions (24 hours)
- Seamless experience - plus ones don't know they're treated differently

## Testing

The implementation has been successfully tested:
- ✅ Build completes without TypeScript errors
- ✅ Main guest authentication still works (backward compatibility)
- ✅ Plus one authentication integrates with existing magic link system
- ✅ RSVP status checking works for both guest types
- ✅ LocalStorage authentication works for both guest types

## Integration Points

The implementation integrates with existing components:
- `LoginModal.tsx`: Uses enhanced `sendMagicLink` function
- `PinEntry.tsx`: Authentication flow unchanged
- `AuthContext.tsx`: Provides unified authentication for both guest types
- Magic link system: Works transparently for both guest types

## Future Enhancements

Potential improvements that could be added:
1. **Plus One Indicator**: Show UI indication when a plus one is logged in
2. **Main Guest Link**: Allow plus ones to see main guest information
3. **Group Management**: Allow main guests to manage plus one access
4. **Enhanced Profile**: Allow plus ones to update their own information

## Conclusion

The plus one authentication system is now fully implemented and working. Plus ones can authenticate using their email address and access the wedding website just like main guests, providing a seamless user experience for all invitees. 