# PIN System - Complete Documentation

## Overview

The PIN system has been fully refactored to support **multi-tenant, dynamic PIN validation** based on wedding-specific settings stored in the database.

---

## How It Works

### 1. Database Structure

Each wedding has its own set of PINs stored in the `wedding_settings` table:

```sql
CREATE TABLE wedding_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
  pin_codes JSONB, -- Array of PIN configurations
  whatsapp_group_link TEXT,
  lapse_event_codes JSONB,
  google_sheets_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. PIN Configuration Format

Each wedding's `pin_codes` is a JSON array with this structure:

```json
[
  {
    "pin": "7834",              // 4-digit numeric string
    "type": "family",           // Guest type/category
    "allows_plus_one": true     // Can bring a +1
  },
  {
    "pin": "2591",
    "type": "friend",
    "allows_plus_one": false
  },
  {
    "pin": "9876",
    "type": "vip",
    "allows_plus_one": true
  }
]
```

**Important Requirements:**
- ✅ PINs must be **exactly 4 digits**
- ✅ PINs must be **strings** (not numbers)
- ✅ Each PIN must be **unique** within a wedding
- ✅ The `type` field is freeform text (e.g., "family", "friends", "vip", "colleagues")
- ✅ The `allows_plus_one` field controls RSVP behavior

---

## Component Flow

### PinEntry Component (`components/guest/PinEntry.tsx`)

**Props:**
```typescript
interface PinEntryProps {
  onPinVerified: () => void;
  weddingSlug: string;  // NEW: Required to fetch wedding-specific PINs
}
```

**Flow:**
1. **On Mount**: Fetches `wedding_settings` for the given `weddingSlug`
2. **User Entry**: Collects 4-digit PIN from user
3. **Validation**: Checks entered PIN against `pin_codes` array from database
4. **On Success**: Stores verification in localStorage with wedding-specific keys
5. **Stored Data**:
   - `phera_pin_verified_{weddingSlug}`: `true`
   - `phera_pin_timestamp_{weddingSlug}`: Timestamp
   - `phera_allows_plus_one_{weddingSlug}`: `true/false`
   - `phera_pin_type_{weddingSlug}`: Guest type

**LocalStorage Keys (Wedding-Specific):**
- Before: `phera_pin_verified` (global)
- After: `phera_pin_verified_sim-kv` (per wedding)

This ensures guests can access multiple weddings without PIN conflicts!

---

## Usage in Guest Pages

### Example: Wedding Home Page

```typescript
// app/(guest)/[weddingId]/page.tsx

import PinEntry from '@/components/guest/PinEntry';
import { useParams } from 'next/navigation';

export default function WeddingHomePage() {
  const { weddingId } = useParams();
  const [isPinVerified, setIsPinVerified] = useState(false);

  // Show PIN entry if not verified
  if (!isPinVerified) {
    return (
      <PinEntry 
        onPinVerified={() => setIsPinVerified(true)} 
        weddingSlug={weddingId}  // Pass the wedding slug!
      />
    );
  }

  // Show wedding content
  return <div>Welcome to the wedding!</div>;
}
```

---

## SQL Examples

### Creating a Wedding with PINs

```sql
-- Step 1: Create wedding
INSERT INTO weddings (slug, couple_name, ...) VALUES
('john-jane', 'John & Jane', ...)
RETURNING id;

-- Step 2: Create wedding settings with PINs
INSERT INTO wedding_settings (wedding_id, pin_codes) VALUES
('your-wedding-id-here', 
 '[
   {"pin": "1234", "type": "family", "allows_plus_one": true},
   {"pin": "5678", "type": "friends", "allows_plus_one": false}
 ]'::jsonb
);
```

### Querying PINs for a Wedding

```sql
-- Get all PINs for a wedding
SELECT 
  w.slug,
  w.couple_name,
  ws.pin_codes
FROM weddings w
LEFT JOIN wedding_settings ws ON w.id = ws.wedding_id
WHERE w.slug = 'sim-kv';
```

### Updating PINs

```sql
-- Update PINs for a wedding
UPDATE wedding_settings
SET pin_codes = '[
  {"pin": "1111", "type": "family", "allows_plus_one": true},
  {"pin": "2222", "type": "friends", "allows_plus_one": false},
  {"pin": "3333", "type": "colleagues", "allows_plus_one": false}
]'::jsonb
WHERE wedding_id = (SELECT id FROM weddings WHERE slug = 'sim-kv');
```

### Adding a New PIN

```sql
-- Add a new PIN to existing array
UPDATE wedding_settings
SET pin_codes = pin_codes || '[{"pin": "9999", "type": "vendors", "allows_plus_one": false}]'::jsonb
WHERE wedding_id = (SELECT id FROM weddings WHERE slug = 'sim-kv');
```

---

## Admin Dashboard Integration

When you create the PIN management UI in the admin dashboard:

### Settings Page (`app/admin/onboarding/[weddingSlug]/settings/page.tsx`)

The settings page should include:

1. **PIN List Display**: Show all existing PINs
2. **Add PIN Form**: Create new PINs with type and +1 settings
3. **Edit PIN**: Update existing PINs
4. **Delete PIN**: Remove PINs
5. **Generate Random PIN**: Button to auto-generate 4-digit PINs

Example UI structure:
```tsx
// Pseudo-code for admin PIN management
{pinCodes.map((pinConfig, index) => (
  <Box key={index}>
    <TextField 
      label="4-Digit PIN" 
      value={pinConfig.pin}
      inputProps={{ maxLength: 4, pattern: "[0-9]*" }}
    />
    <TextField 
      label="Guest Type" 
      value={pinConfig.type}
    />
    <Switch 
      label="Allow +1" 
      checked={pinConfig.allows_plus_one}
    />
    <Button onClick={() => deletePIN(index)}>Delete</Button>
  </Box>
))}
<Button onClick={addNewPIN}>+ Add PIN</Button>
```

---

## Security Considerations

### Current Implementation
- ✅ PINs stored in database (not hardcoded)
- ✅ Wedding-specific validation
- ✅ 24-hour PIN expiration in localStorage
- ✅ Authenticated users bypass PIN entry

### Future Enhancements (Optional)
- 🔄 Server-side PIN validation with rate limiting
- 🔄 PIN usage tracking (how many times used)
- 🔄 PIN expiration dates (time-limited PINs)
- 🔄 One-time use PINs
- 🔄 IP-based rate limiting

---

## Migration Guide

### For Existing Weddings

If you have hardcoded PINs in your components:

1. **Identify Current PINs**: Find all hardcoded PIN values
2. **Create Settings Record**: Insert into `wedding_settings` table
3. **Update Component Usage**: Add `weddingSlug` prop to `<PinEntry />`
4. **Test**: Verify PIN validation works

### For New Weddings

1. When creating a wedding, automatically create a `wedding_settings` record
2. Generate default PINs (e.g., random 4-digit codes)
3. Admin can customize via settings page

---

## Troubleshooting

### PIN Not Working
- Check PIN is exactly 4 digits
- Verify PIN exists in `wedding_settings.pin_codes`
- Check wedding slug matches
- Verify `wedding_settings` record exists

### LocalStorage Issues
- Clear localStorage for testing: `localStorage.clear()`
- Check correct keys: `localStorage.getItem('phera_pin_verified_sim-kv')`

### Multiple Weddings
- Each wedding has its own localStorage keys
- Guests can be verified for multiple weddings simultaneously

---

## Testing

### Manual Test Cases

1. **Valid PIN Entry**
   - Enter correct 4-digit PIN
   - Should store verification in localStorage
   - Should call `onPinVerified()`

2. **Invalid PIN Entry**
   - Enter wrong 4-digit PIN
   - Should show error message
   - Should clear PIN inputs
   - Should remain on PIN entry screen

3. **PIN Expiration**
   - Verify PIN, wait 24+ hours
   - Refresh page
   - Should show PIN entry again

4. **Authenticated Bypass**
   - Login with email/Google
   - Should bypass PIN entry completely

5. **Multiple Weddings**
   - Verify PIN for wedding A
   - Navigate to wedding B
   - Should show PIN entry for wedding B
   - Navigate back to wedding A
   - Should NOT show PIN entry (cached)

---

## Summary

✅ **Refactored**: PinEntry now dynamic, wedding-specific
✅ **Database-driven**: All PINs stored in `wedding_settings`
✅ **Multi-tenant**: Each wedding has independent PINs
✅ **Flexible**: Admins can manage PINs via dashboard
✅ **Scalable**: No hardcoded values, works for unlimited weddings

---

**Next Steps:**
1. Run the updated seed script to populate sim-kv PINs
2. Test PIN entry on the sim-kv wedding page
3. Build admin UI for PIN management (future enhancement)

