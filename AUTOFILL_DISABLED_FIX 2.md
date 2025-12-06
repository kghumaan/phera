# Autofill & Disabled State Fix

## Issues Resolved

### 1. ✅ Supabase Email Bouncing
**Problem**: Testing with multiple email addresses triggered Supabase's bounce detection system.

**Solution**: 
- Disabled "Confirm email" in Supabase Dashboard → Authentication → Email (for development)
- Added documentation in signup page about email configuration
- Recommended using Google OAuth as an alternative for testing

**For Production**:
- Re-enable email confirmation
- Set up custom SMTP provider (SendGrid, Mailgun, etc.)
- See `EMAIL_VALIDATION_FIX.md` for detailed setup

### 2. ✅ Browser Autofill Blue Background
**Problem**: When browsers autofilled email/password fields, they applied a blue/yellow background that overrode our white background styling.

**Solution**: Added `-webkit-autofill` pseudo-class styling to force white backgrounds:

```typescript
'&:-webkit-autofill': {
  WebkitBoxShadow: '0 0 0 100px white inset',
  WebkitTextFillColor: '#1a1a1a',
  caretColor: '#1a1a1a',
  borderRadius: 'inherit',
}
```

### 3. ✅ Disappearing Fields on Submit
**Problem**: When clicking "Create Account" or "Sign In", all input text became invisible because the disabled state styling didn't preserve text visibility.

**Solution**: Added explicit disabled state styling:

```typescript
'&.Mui-disabled': {
  bgcolor: 'rgba(255, 255, 255, 0.8)',
  '& fieldset': {
    borderColor: 'rgba(0, 0, 0, 0.15)',
  },
},
// For input text
'&.Mui-disabled': {
  WebkitTextFillColor: '#4a4a4a',
  color: '#4a4a4a',
},
```

## Files Updated

### Auth Pages
1. **`app/auth/signup/page.tsx`**
   - Added autofill override styling to all 3 TextFields (Couple Names, Email, Password)
   - Added disabled state styling to maintain text visibility
   - Added documentation comment about email configuration

2. **`app/auth/login/page.tsx`**
   - Added autofill override styling to both TextFields (Email, Password)
   - Added disabled state styling to maintain text visibility

### Admin Pages
3. **`app/admin/onboarding/[weddingSlug]/overview/page.tsx`**
   - Updated the reusable `textFieldSx` constant with autofill and disabled styles
   - This fix automatically applies to all 8 TextFields on the overview page

## Complete TextField Styling Pattern

Use this pattern for all TextField components throughout the app:

```typescript
const textFieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    bgcolor: 'white',
    '& fieldset': {
      borderColor: 'rgba(0, 0, 0, 0.23)',
    },
    '&:hover fieldset': {
      borderColor: '#DE3F5E',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#DE3F5E',
      borderWidth: '2px',
    },
    // Disabled state styling
    '&.Mui-disabled': {
      bgcolor: 'rgba(255, 255, 255, 0.8)',
      '& fieldset': {
        borderColor: 'rgba(0, 0, 0, 0.15)',
      },
    },
  },
  '& .MuiInputLabel-root': {
    color: '#4a4a4a',
    // Keep label visible when disabled
    '&.Mui-disabled': {
      color: '#6a6a6a',
    },
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: '#DE3F5E',
  },
  '& .MuiInputBase-input': {
    color: '#1a1a1a',
    // Keep text visible when disabled
    '&.Mui-disabled': {
      WebkitTextFillColor: '#4a4a4a',
      color: '#4a4a4a',
    },
    // Override browser autofill styling
    '&:-webkit-autofill': {
      WebkitBoxShadow: '0 0 0 100px white inset',
      WebkitTextFillColor: '#1a1a1a',
      caretColor: '#1a1a1a',
      borderRadius: 'inherit',
    },
  },
  '& .MuiFormHelperText-root': {
    color: '#6a6a6a',
  },
};
```

## Testing Checklist

✅ Browser autofill maintains white background in signup form
✅ Browser autofill maintains white background in login form
✅ Clicking "Create Account" keeps all fields visible
✅ Clicking "Sign In" keeps all fields visible
✅ Tested in Chrome, Safari, Firefox
✅ No linter errors

## Best Practices Going Forward

1. **Reusable Component**: Consider creating a `StyledTextField` component to ensure consistency:

```typescript
// components/admin/StyledTextField.tsx
import { TextField, TextFieldProps } from '@mui/material';

const textFieldSx = { /* complete styling pattern above */ };

export const StyledTextField = (props: TextFieldProps) => (
  <TextField {...props} sx={{ ...textFieldSx, ...props.sx }} />
);
```

2. **Email Testing**: During development, prefer Google OAuth to avoid Supabase bounce rate issues

3. **Disabled States**: Always test form submission states to ensure text remains visible

4. **Browser Testing**: Test autofill behavior across Chrome, Safari, Firefox, and Edge

## Date Implemented
November 21, 2025

